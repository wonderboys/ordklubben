import type { PuzzleDirection } from "@prisma/client";
import { getAnswerLength } from "@/lib/content/puzzle/grid";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

export type OrdflataPlayerEntry = {
  id: string;
  row: number;
  col: number;
  direction: PuzzleDirection;
  number: number | null;
  length: number;
  answer: string;
  clue: string;
};

export type OrdflataPlayerPuzzle = {
  title: string;
  width: number;
  height: number;
  entries: OrdflataPlayerEntry[];
  blockedCells: Array<{ row: number; col: number }>;
};

function normalizeAnswer(answerSnapshot: string) {
  return answerSnapshot
    .trim()
    .toLocaleUpperCase("sv-SE")
    .replace(/[\s'’\-‐‑‒–—]+/g, "");
}

const playableWordGridWhere = {
  type: "WORD_GRID" as const,
  entries: { some: {} },
};

async function findOrdflataPuzzleId() {
  const prisma = getPrisma();

  const published = await prisma.puzzle.findFirst({
    where: {
      ...playableWordGridWhere,
      status: "PUBLISHED",
    },
    orderBy: [{ publishDate: "desc" }, { updatedAt: "desc" }],
    select: { id: true },
  });

  if (published) {
    return published.id;
  }

  // Alpha/dev: visa senaste spelbara utkast om inget är publicerat ännu.
  const fallback = await prisma.puzzle.findFirst({
    where: {
      ...playableWordGridWhere,
      status: { in: ["DRAFT", "REVIEW"] },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  return fallback?.id ?? null;
}

export async function loadOrdflataAlphaPuzzle(): Promise<OrdflataPlayerPuzzle | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const prisma = getPrisma();
  const puzzleId = await findOrdflataPuzzleId();

  if (!puzzleId) {
    return null;
  }

  const puzzle = await prisma.puzzle.findUnique({
    where: { id: puzzleId },
    include: {
      entries: {
        include: {
          hint: {
            select: { text: true },
          },
        },
        orderBy: [{ direction: "asc" }, { number: "asc" }, { row: "asc" }, { col: "asc" }],
      },
      blockedCells: {
        orderBy: [{ row: "asc" }, { col: "asc" }],
      },
    },
  });

  if (!puzzle) {
    return null;
  }

  return {
    title: puzzle.title,
    width: puzzle.width,
    height: puzzle.height,
    entries: puzzle.entries.map((entry) => ({
      id: entry.id,
      row: entry.row,
      col: entry.col,
      direction: entry.direction,
      number: entry.number,
      length: getAnswerLength(entry.answerSnapshot),
      answer: normalizeAnswer(entry.answerSnapshot),
      clue: entry.hintSnapshot ?? entry.hint?.text ?? "Ingen nyckel",
    })),
    blockedCells: puzzle.blockedCells.map((cell) => ({
      row: cell.row,
      col: cell.col,
    })),
  };
}
