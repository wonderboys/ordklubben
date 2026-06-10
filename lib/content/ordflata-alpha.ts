import type { PuzzleDirection } from "@prisma/client";
import { getAnswerLength } from "@/lib/content/puzzle/grid";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

export const ORDFLATA_ALPHA_PUZZLE_ID = "cmq8l05wz01fv0ps7keqoy3vq";

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

export async function loadOrdflataAlphaPuzzle(): Promise<OrdflataPlayerPuzzle | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const prisma = getPrisma();
  const puzzle = await prisma.puzzle.findUnique({
    where: { id: ORDFLATA_ALPHA_PUZZLE_ID },
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
