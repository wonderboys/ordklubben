"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  computeStartCellNumbers,
  getOccupiedCells,
  validatePuzzlePlacement,
} from "@/lib/content/puzzle/grid";
import {
  addPuzzleEntrySchema,
  createGeneratedPuzzleSchema,
  createPuzzleSchema,
  removePuzzleEntrySchema,
  togglePuzzleBlockedCellSchema,
  updatePuzzleEntryHintSchema,
} from "@/lib/content/validators";
import { generatePuzzle } from "@/lib/content/puzzle/generate-puzzle";
import { getPrisma } from "@/lib/db/prisma";

function getFormValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function redirectWithMessage(
  pathname: string,
  type: "error" | "success",
  message: string,
): never {
  const [basePath, queryString] = pathname.split("?");
  const searchParams = new URLSearchParams(queryString ?? "");
  searchParams.set(type, message);
  redirect(`${basePath}?${searchParams.toString()}`);
}

function getValidationErrorMessage() {
  return "Kunde inte spara formuläret. Kontrollera fälten och försök igen.";
}

function puzzleDetailPath(puzzleId: string) {
  return `/admin/puzzles/${puzzleId}`;
}

function revalidatePuzzle(puzzleId: string) {
  revalidatePath("/admin/puzzles");
  revalidatePath(puzzleDetailPath(puzzleId));
}

function parseOptionalDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

async function syncPuzzleEntryNumbers(
  puzzleId: string,
  entries: Array<{
    id: string;
    row: number;
    col: number;
    direction: "ACROSS" | "DOWN";
    answerSnapshot: string;
  }>,
) {
  if (entries.length === 0) {
    return;
  }

  const prisma = getPrisma();
  const startCellNumbers = computeStartCellNumbers(entries);

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.puzzleEntry.update({
        where: { id: entry.id },
        data: {
          number: startCellNumbers.get(`${entry.row}:${entry.col}`) ?? null,
        },
      }),
    ),
  );
}

export async function createPuzzle(formData: FormData) {
  const parsed = createPuzzleSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectWithMessage(
      "/admin/puzzles/new?mode=manual",
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();

  const puzzle = await prisma.puzzle.create({
    data: {
      title: parsed.data.title,
      type: parsed.data.type,
      status: parsed.data.status,
      width: parsed.data.width,
      height: parsed.data.height,
      description: parsed.data.description,
      slug: parsed.data.slug,
      publishDate: parseOptionalDate(parsed.data.publishDate),
    },
  });

  revalidatePath("/admin/puzzles");
  redirect(puzzleDetailPath(puzzle.id));
}

function puzzleGenerationReportPath(
  puzzleId: string,
  report: {
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
  },
) {
  const searchParams = new URLSearchParams({
    generated: "1",
    genCandidates: String(report.candidateCount),
    genPlaced: String(report.placedCount),
    genFailed: String(report.failedCount),
    genSkipped: String(report.skippedCount),
    genRejectedCollisions: String(report.rejectedCollisions),
    genRejectedSideWords: String(report.rejectedSideWords),
    genRejectedBlockPatterns: String(report.rejectedBlockPatterns),
    genBlocked: String(report.blockedCount),
    genLetterCells: String(report.letterCellCount),
    genUtilization: String(report.utilizationRate),
    genCrossings: String(report.crossingCount),
    genAttempts: String(report.attemptCount),
    genBestScore: String(report.bestScore),
    genShortWords: String(report.shortWordCount),
    genMediumWords: String(report.mediumWordCount),
    genLongWords: String(report.longWordCount),
    genLongestWord: String(report.longestWord),
    genAvgWordLength: String(report.averageWordLength),
    genBlockRatio: String(report.blockRatio),
    genGapsFilled: String(report.gapsFilled),
    genOpenConnections: String(report.openConnections),
    genBlockClusters: String(report.blockClusters),
    genIsolatedRegions: String(report.isolatedRegions),
    genEmptyBlocked: String(report.emptyCellsBlocked),
    genRemainingEmpty: String(report.remainingEmptyCount),
    genValidationOk: report.finalValidationOk ? "1" : "0",
    genWidth: String(report.width),
    genHeight: String(report.height),
  });

  if (report.themeName) {
    searchParams.set("genTheme", report.themeName);
  }

  if (report.optimizationImprovements) {
    searchParams.set("genOptimization", report.optimizationImprovements);
  }

  if (report.summaryNote) {
    searchParams.set("genSummary", report.summaryNote);
  }

  return `${puzzleDetailPath(puzzleId)}?${searchParams.toString()}`;
}

export async function createAndGeneratePuzzle(formData: FormData) {
  const parsed = createGeneratedPuzzleSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectWithMessage(
      "/admin/puzzles/new?mode=generated",
      "error",
      getValidationErrorMessage(),
    );
  }

  let result;

  try {
    const prisma = getPrisma();
    result = await generatePuzzle(prisma, parsed.data);
  } catch (error) {
    redirectWithMessage(
      "/admin/puzzles/new?mode=generated",
      "error",
      error instanceof Error ? error.message : "Genereringen misslyckades.",
    );
  }

  revalidatePath("/admin/puzzles");
  revalidatePath(puzzleDetailPath(result.puzzleId));
  redirect(puzzleGenerationReportPath(result.puzzleId, result.report));
}

export async function addPuzzleEntry(formData: FormData) {
  const parsed = addPuzzleEntrySchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectWithMessage(
      puzzleDetailPath(String(formData.get("puzzleId") ?? "")),
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  const puzzle = await prisma.puzzle.findUnique({
    where: { id: parsed.data.puzzleId },
    include: {
      entries: true,
      blockedCells: true,
    },
  });

  if (!puzzle) {
    redirectWithMessage("/admin/puzzles", "error", "Pusslet hittades inte.");
  }

  const word = await prisma.word.findUnique({
    where: { id: parsed.data.wordId },
    include: {
      hints: {
        where: {
          status: {
            in: ["DRAFT", "APPROVED"],
          },
        },
      },
    },
  });

  if (!word) {
    redirectWithMessage(
      puzzleDetailPath(parsed.data.puzzleId),
      "error",
      "Ordet hittades inte i ordbanken.",
    );
  }

  if (puzzle.entries.some((entry) => entry.wordId === word.id)) {
    redirectWithMessage(
      puzzleDetailPath(parsed.data.puzzleId),
      "error",
      "Samma ord är redan placerat i detta pussel.",
    );
  }

  const hint = parsed.data.hintId
    ? word.hints.find((item) => item.id === parsed.data.hintId)
    : null;

  if (parsed.data.hintId && !hint) {
    redirectWithMessage(
      puzzleDetailPath(parsed.data.puzzleId),
      "error",
      "Nyckeln måste tillhöra ordet och vara utkast eller godkänd.",
    );
  }

  const answerSnapshot = word.answer;
  const validation = validatePuzzlePlacement({
    placement: {
      answerSnapshot,
      row: parsed.data.row,
      col: parsed.data.col,
      direction: parsed.data.direction,
    },
    existing: puzzle.entries.map((entry) => ({
      id: entry.id,
      answerSnapshot: entry.answerSnapshot,
      row: entry.row,
      col: entry.col,
      direction: entry.direction,
    })),
    blockedCells: puzzle.blockedCells.map((cell) => ({
      row: cell.row,
      col: cell.col,
    })),
    width: puzzle.width,
    height: puzzle.height,
  });

  if (!validation.ok) {
    redirectWithMessage(puzzleDetailPath(parsed.data.puzzleId), "error", validation.message);
  }

  await prisma.puzzleEntry.create({
    data: {
      puzzleId: puzzle.id,
      wordId: word.id,
      hintId: hint?.id,
      answerSnapshot,
      hintSnapshot: hint?.text,
      row: parsed.data.row,
      col: parsed.data.col,
      direction: parsed.data.direction,
    },
  });

  const allEntries = await prisma.puzzleEntry.findMany({
    where: { puzzleId: puzzle.id },
    select: {
      id: true,
      row: true,
      col: true,
      direction: true,
      answerSnapshot: true,
    },
  });

  await syncPuzzleEntryNumbers(puzzle.id, allEntries);
  revalidatePuzzle(puzzle.id);
  redirectWithMessage(
    puzzleDetailPath(parsed.data.puzzleId),
    "success",
    "Ordet placerades i rutnätet.",
  );
}

export async function removePuzzleEntry(formData: FormData) {
  const parsed = removePuzzleEntrySchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectWithMessage(
      puzzleDetailPath(String(formData.get("puzzleId") ?? "")),
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();

  const entry = await prisma.puzzleEntry.findUnique({
    where: { id: parsed.data.entryId },
    select: { id: true, puzzleId: true },
  });

  if (!entry || entry.puzzleId !== parsed.data.puzzleId) {
    redirectWithMessage(
      puzzleDetailPath(parsed.data.puzzleId),
      "error",
      "Placeringen hittades inte.",
    );
  }

  await prisma.puzzleEntry.delete({
    where: { id: entry.id },
  });

  const remainingEntries = await prisma.puzzleEntry.findMany({
    where: { puzzleId: parsed.data.puzzleId },
    select: {
      id: true,
      row: true,
      col: true,
      direction: true,
      answerSnapshot: true,
    },
  });

  await syncPuzzleEntryNumbers(parsed.data.puzzleId, remainingEntries);
  revalidatePuzzle(parsed.data.puzzleId);
  redirectWithMessage(
    puzzleDetailPath(parsed.data.puzzleId),
    "success",
    "Placeringen togs bort.",
  );
}

export async function updatePuzzleEntryHint(formData: FormData) {
  const parsed = updatePuzzleEntryHintSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectWithMessage(
      puzzleDetailPath(String(formData.get("puzzleId") ?? "")),
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();

  const entry = await prisma.puzzleEntry.findUnique({
    where: { id: parsed.data.entryId },
    include: {
      word: {
        include: {
          hints: {
            where: {
              status: {
                in: ["DRAFT", "APPROVED"],
              },
            },
          },
        },
      },
    },
  });

  if (!entry || entry.puzzleId !== parsed.data.puzzleId) {
    redirectWithMessage(
      puzzleDetailPath(parsed.data.puzzleId),
      "error",
      "Placeringen hittades inte.",
    );
  }

  const hint = parsed.data.hintId
    ? entry.word.hints.find((item) => item.id === parsed.data.hintId)
    : null;

  if (parsed.data.hintId && !hint) {
    redirectWithMessage(
      puzzleDetailPath(parsed.data.puzzleId),
      "error",
      "Nyckeln måste tillhöra ordet och vara utkast eller godkänd.",
    );
  }

  await prisma.puzzleEntry.update({
    where: { id: entry.id },
    data: {
      hintId: hint?.id ?? null,
      hintSnapshot: hint?.text ?? null,
    },
  });

  revalidatePuzzle(parsed.data.puzzleId);
  redirectWithMessage(
    puzzleDetailPath(parsed.data.puzzleId),
    "success",
    hint ? "Nyckeln uppdaterades." : "Nyckeln togs bort från placeringen.",
  );
}

export async function togglePuzzleBlockedCell(formData: FormData) {
  const parsed = togglePuzzleBlockedCellSchema.safeParse(getFormValues(formData));

  if (!parsed.success) {
    redirectWithMessage(
      puzzleDetailPath(String(formData.get("puzzleId") ?? "")),
      "error",
      getValidationErrorMessage(),
    );
  }

  const prisma = getPrisma();
  const puzzle = await prisma.puzzle.findUnique({
    where: { id: parsed.data.puzzleId },
    include: {
      entries: true,
      blockedCells: true,
    },
  });

  if (!puzzle) {
    redirectWithMessage("/admin/puzzles", "error", "Pusslet hittades inte.");
  }

  if (
    parsed.data.row < 0 ||
    parsed.data.col < 0 ||
    parsed.data.row >= puzzle.height ||
    parsed.data.col >= puzzle.width
  ) {
    redirectWithMessage(
      puzzleDetailPath(parsed.data.puzzleId),
      "error",
      "Cellen ligger utanför rutnätet.",
    );
  }

  const occupied = getOccupiedCells(
    puzzle.entries.map((entry) => ({
      answerSnapshot: entry.answerSnapshot,
      row: entry.row,
      col: entry.col,
      direction: entry.direction,
    })),
  );
  const key = `${parsed.data.row}:${parsed.data.col}`;
  const existingBlock = puzzle.blockedCells.find(
    (cell) => cell.row === parsed.data.row && cell.col === parsed.data.col,
  );

  if (existingBlock) {
    await prisma.puzzleBlockedCell.delete({
      where: { id: existingBlock.id },
    });
    revalidatePuzzle(puzzle.id);
    redirectWithMessage(
      puzzleDetailPath(parsed.data.puzzleId),
      "success",
      "Blockeringen togs bort.",
    );
  }

  if (occupied.has(key)) {
    redirectWithMessage(
      puzzleDetailPath(parsed.data.puzzleId),
      "error",
      `Cellen vid rad ${parsed.data.row + 1}, kolumn ${parsed.data.col + 1} används redan av ett ord.`,
    );
  }

  await prisma.puzzleBlockedCell.create({
    data: {
      puzzleId: puzzle.id,
      row: parsed.data.row,
      col: parsed.data.col,
    },
  });

  revalidatePuzzle(puzzle.id);
  redirectWithMessage(
    puzzleDetailPath(parsed.data.puzzleId),
    "success",
    "Cellen blockerades.",
  );
}
