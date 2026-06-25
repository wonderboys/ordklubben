import type { PuzzleDirection } from '@prisma/client';

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
