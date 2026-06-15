import type { PuzzleDirection } from '@prisma/client';
import {
  buildLetterMap,
  getPlacementCells,
  validatePuzzlePlacement,
  type PuzzleBlockedCellInput,
  type PuzzlePlacementInput,
} from '@/lib/content/puzzle/grid';

export type PuzzleGhostCell = {
  row: number;
  col: number;
  letter: string;
  overlapsExisting: boolean;
};

export type PuzzleGhostPlacement = {
  cells: Map<string, PuzzleGhostCell>;
  startKey: string;
  isValid: boolean;
  message: string | null;
};

export function buildGhostPlacement(options: {
  answerSnapshot: string;
  row: number;
  col: number;
  direction: PuzzleDirection;
  existing: PuzzlePlacementInput[];
  blockedCells: PuzzleBlockedCellInput[];
  width: number;
  height: number;
}): PuzzleGhostPlacement {
  const placement = {
    answerSnapshot: options.answerSnapshot,
    row: options.row,
    col: options.col,
    direction: options.direction,
  };

  const validation = validatePuzzlePlacement({
    placement,
    existing: options.existing,
    blockedCells: options.blockedCells,
    width: options.width,
    height: options.height,
  });

  const letterMap = buildLetterMap(options.existing);
  const cells = new Map<string, PuzzleGhostCell>();

  for (const cell of getPlacementCells(placement)) {
    const key = `${cell.row}:${cell.col}`;

    cells.set(key, {
      ...cell,
      overlapsExisting: letterMap.has(key),
    });
  }

  return {
    cells,
    startKey: `${options.row}:${options.col}`,
    isValid: validation.ok,
    message: validation.ok ? null : validation.message,
  };
}
