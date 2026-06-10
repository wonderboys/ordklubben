import type { Prisma, PrismaClient } from "@prisma/client";
import { computeStartCellNumbers, getAnswerLength } from "@/lib/content/puzzle/grid";
import { generateGridLayout } from "@/lib/content/puzzle/grid-generator";
import { getGridSizeProfile } from "@/lib/content/puzzle/grid-generator-scoring";
import type { CreateGeneratedPuzzleInput } from "@/lib/content/validators";

export type GeneratePuzzleReport = {
  themeName: string | null;
  candidateCount: number;
  placedCount: number;
  failedCount: number;
  skippedCount: number;
  rejectedCollisions: number;
  rejectedSideWords: number;
  rejectedBlockPatterns: number;
  blockedCount: number;
  letterCellCount: number;
  utilizationRate: number;
  crossingCount: number;
  attemptCount: number;
  bestScore: number;
  shortWordCount: number;
  mediumWordCount: number;
  longWordCount: number;
  longestWord: number;
  averageWordLength: number;
  blockRatio: number;
  gapsFilled: number;
  openConnections: number;
  blockClusters: number;
  isolatedRegions: number;
  optimizationImprovements: string | null;
  emptyCellsBlocked: number;
  remainingEmptyCount: number;
  finalValidationOk: boolean;
  width: number;
  height: number;
  summaryNote: string | null;
};

export type GeneratePuzzleResult = {
  puzzleId: string;
  report: GeneratePuzzleReport;
};

/** Upper target for how many words the generator tries to place. */
export function computeTargetWordCount(width: number, height: number) {
  const size = Math.max(width, height);

  if (size <= 5) {
    return 8;
  }

  if (size <= 7) {
    return 14;
  }

  if (size <= 9) {
    return 20;
  }

  return 30;
}

function buildCandidateLimit(targetWordCount: number) {
  return Math.max(targetWordCount * 14, 180);
}

function buildWordWhere(input: CreateGeneratedPuzzleInput): Prisma.WordWhereInput {
  const hintStatusFilter: Array<"DRAFT" | "APPROVED"> = input.allowDraftHints
    ? ["DRAFT", "APPROVED"]
    : ["APPROVED"];

  return {
    ...(input.themeId
      ? {
          themes: {
            some: {
              themeId: input.themeId,
            },
          },
        }
      : {}),
    ...(input.allowDraftWords
      ? { status: { in: ["DRAFT", "APPROVED"] as Array<"DRAFT" | "APPROVED"> } }
      : { status: "APPROVED" }),
    hints: {
      some: {
        status: { in: hintStatusFilter },
      },
    },
  };
}

function mapWordRows(
  words: Array<{
    id: string;
    answer: string;
    hints: Array<{ id: string; text: string; status: string }>;
  }>,
) {
  return words
    .filter((word) => getAnswerLength(word.answer) >= 2)
    .map((word) => ({
      id: word.id,
      answer: word.answer,
      hints: word.hints.map((hint) => ({
        id: hint.id,
        text: hint.text,
        status: hint.status as "DRAFT" | "APPROVED",
      })),
    }));
}

function mergeUniqueWords<T extends { id: string }>(primary: T[], secondary: T[]) {
  const seen = new Set(primary.map((word) => word.id));
  const merged = [...primary];

  for (const word of secondary) {
    if (!seen.has(word.id)) {
      seen.add(word.id);
      merged.push(word);
    }
  }

  return merged;
}

async function fetchCandidates(
  prisma: PrismaClient,
  input: CreateGeneratedPuzzleInput,
  targetWordCount: number,
) {
  const limit = buildCandidateLimit(targetWordCount);
  const profile = getGridSizeProfile(input.width, input.height);
  const hintStatusFilter: Array<"DRAFT" | "APPROVED"> = input.allowDraftHints
    ? ["DRAFT", "APPROVED"]
    : ["APPROVED"];
  const wordWhere = buildWordWhere(input);
  const longTake = Math.max(Math.round(limit / 3), 40);

  const wordSelect = {
    id: true,
    answer: true,
    hints: {
      where: {
        status: { in: hintStatusFilter },
      },
      select: {
        id: true,
        text: true,
        status: true,
      },
    },
  } satisfies Prisma.WordSelect;

  const [longWords, generalWords] = await Promise.all([
    prisma.word.findMany({
      where: {
        ...wordWhere,
        length: { gte: profile.anchorMin },
      },
      select: wordSelect,
      orderBy: [{ length: "desc" }, { answer: "asc" }],
      take: longTake,
    }),
    prisma.word.findMany({
      where: wordWhere,
      select: wordSelect,
      orderBy: [{ length: "asc" }, { answer: "asc" }],
      take: limit,
    }),
  ]);

  return mapWordRows(mergeUniqueWords(longWords, generalWords));
}

export async function generatePuzzle(
  prisma: PrismaClient,
  input: CreateGeneratedPuzzleInput,
): Promise<GeneratePuzzleResult> {
  const targetWordCount = computeTargetWordCount(input.width, input.height);

  const [theme, candidates] = await Promise.all([
    input.themeId
      ? prisma.theme.findUnique({
          where: { id: input.themeId },
          select: { name: true },
        })
      : Promise.resolve(null),
    fetchCandidates(prisma, input, targetWordCount),
  ]);

  if (candidates.length === 0) {
    throw new Error("Inga ord matchade urvalet. Justera tema eller statusfilter.");
  }

  const layout = generateGridLayout({
    candidates,
    width: input.width,
    height: input.height,
    wordCount: targetWordCount,
    allowDraftHints: input.allowDraftHints,
    hasTheme: Boolean(input.themeId),
  });

  if (layout.placed.length === 0) {
    throw new Error(
      layout.summaryNote ??
        "Kunde inte placera några ord i rutnätet. Prova större rutnät eller fler kandidater.",
    );
  }

  const startCellNumbers = computeStartCellNumbers(layout.placed);

  const puzzle = await prisma.$transaction(async (tx) => {
    const createdPuzzle = await tx.puzzle.create({
      data: {
        title: input.title,
        type: "WORD_GRID",
        status: input.status,
        width: input.width,
        height: input.height,
        publishDate: input.publishDate ? new Date(input.publishDate) : null,
      },
    });

    for (const entry of layout.placed) {
      await tx.puzzleEntry.create({
        data: {
          puzzleId: createdPuzzle.id,
          wordId: entry.wordId,
          hintId: entry.hintId,
          answerSnapshot: entry.answerSnapshot,
          hintSnapshot: entry.hintSnapshot,
          row: entry.row,
          col: entry.col,
          direction: entry.direction,
          number: startCellNumbers.get(`${entry.row}:${entry.col}`) ?? null,
        },
      });
    }

    for (const blockedCell of layout.blockedCells) {
      await tx.puzzleBlockedCell.create({
        data: {
          puzzleId: createdPuzzle.id,
          row: blockedCell.row,
          col: blockedCell.col,
        },
      });
    }

    return createdPuzzle;
  });

  return {
    puzzleId: puzzle.id,
    report: {
      themeName: theme?.name ?? null,
      candidateCount: layout.candidateCount,
      placedCount: layout.placed.length,
      failedCount: layout.failedCount,
      skippedCount: layout.skippedCount,
      rejectedCollisions: layout.rejectedCollisions,
      rejectedSideWords: layout.rejectedSideWords,
      rejectedBlockPatterns: layout.rejectedBlockPatterns,
      blockedCount: layout.blockedCells.length,
      letterCellCount: layout.letterCellCount,
      utilizationRate: layout.utilizationRate,
      crossingCount: layout.crossingCount,
      attemptCount: layout.attemptCount,
      bestScore: layout.bestScore,
      shortWordCount: layout.shortWordCount,
      mediumWordCount: layout.mediumWordCount,
      longWordCount: layout.longWordCount,
      longestWord: layout.longestWord,
      averageWordLength: layout.averageWordLength,
      blockRatio: layout.blockRatio,
      gapsFilled: layout.gapsFilled,
      openConnections: layout.openConnections,
      blockClusters: layout.blockClusters,
      isolatedRegions: layout.isolatedRegions,
      optimizationImprovements: layout.optimizationImprovements,
      emptyCellsBlocked: layout.emptyCellsBlocked,
      remainingEmptyCount: layout.remainingEmptyCount,
      finalValidationOk: layout.finalValidationOk,
      width: input.width,
      height: input.height,
      summaryNote: layout.summaryNote,
    },
  };
}
