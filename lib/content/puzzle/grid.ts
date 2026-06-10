import type { PuzzleDirection } from "@prisma/client";

export type PuzzlePlacementInput = {
  id?: string;
  answerSnapshot: string;
  row: number;
  col: number;
  direction: PuzzleDirection;
};

export type PuzzleBlockedCellInput = {
  row: number;
  col: number;
};

export type PuzzleGridCell = {
  letter: string | null;
  conflict: boolean;
  blocked: boolean;
};

export type PuzzlePlacementValidationResult =
  | { ok: true }
  | { ok: false; message: string };

function getAnswerLetters(answerSnapshot: string) {
  return answerSnapshot
    .trim()
    .toLocaleUpperCase("sv-SE")
    .replace(/[\s'’\-‐‑‒–—]+/g, "");
}

export function getPlacementCells(placement: PuzzlePlacementInput) {
  const letters = getAnswerLetters(placement.answerSnapshot);
  const cells: Array<{ row: number; col: number; letter: string }> = [];

  for (let index = 0; index < letters.length; index += 1) {
    if (placement.direction === "ACROSS") {
      cells.push({
        row: placement.row,
        col: placement.col + index,
        letter: letters[index] ?? "",
      });
    } else {
      cells.push({
        row: placement.row + index,
        col: placement.col,
        letter: letters[index] ?? "",
      });
    }
  }

  return cells;
}

export function buildLetterMap(entries: PuzzlePlacementInput[]) {
  const map = new Map<string, string>();

  for (const entry of entries) {
    for (const cell of getPlacementCells(entry)) {
      const key = `${cell.row}:${cell.col}`;
      const existing = map.get(key);

      if (existing && existing !== cell.letter) {
        continue;
      }

      map.set(key, cell.letter);
    }
  }

  return map;
}

export function getOccupiedCells(entries: PuzzlePlacementInput[]) {
  return new Set(
    entries.flatMap((entry) =>
      getPlacementCells(entry).map((cell) => `${cell.row}:${cell.col}`),
    ),
  );
}

function formatGridCoordinate(row: number, col: number) {
  return `rad ${row + 1}, kolumn ${col + 1}`;
}

export function validatePuzzlePlacement(options: {
  placement: PuzzlePlacementInput;
  existing: PuzzlePlacementInput[];
  blockedCells: PuzzleBlockedCellInput[];
  width: number;
  height: number;
}): PuzzlePlacementValidationResult {
  const { placement, existing, blockedCells, width, height } = options;

  const letters = getAnswerLetters(placement.answerSnapshot);

  if (letters.length === 0) {
    return { ok: false, message: "Ordets svar saknar bokstäver att placera." };
  }

  if (placement.row < 0 || placement.col < 0) {
    return { ok: false, message: "Rad och kolumn måste vara 0 eller större." };
  }

  const cells = getPlacementCells(placement);
  const blocked = new Set(blockedCells.map((cell) => `${cell.row}:${cell.col}`));
  const letterMap = buildLetterMap(
    existing.filter((entry) => entry.id !== placement.id),
  );

  for (const cell of cells) {
    if (cell.row < 0 || cell.col < 0 || cell.row >= height || cell.col >= width) {
      return {
        ok: false,
        message: "Ordet får inte plats i rutnätet med vald position och riktning.",
      };
    }

    const key = `${cell.row}:${cell.col}`;

    if (blocked.has(key)) {
      return {
        ok: false,
        message: `Ordet kan inte placeras över blockerad ruta vid ${formatGridCoordinate(cell.row, cell.col)}.`,
      };
    }

    const existingLetter = letterMap.get(key);

    if (existingLetter && existingLetter !== cell.letter) {
      return {
        ok: false,
        message: `Bokstavskrock vid ${formatGridCoordinate(cell.row, cell.col)}: befintlig bokstav ${existingLetter}, ny bokstav ${cell.letter}`,
      };
    }
  }

  return { ok: true };
}

export function buildPuzzleGrid(options: {
  width: number;
  height: number;
  entries: PuzzlePlacementInput[];
  blockedCells?: PuzzleBlockedCellInput[];
}) {
  const grid: PuzzleGridCell[][] = Array.from({ length: options.height }, () =>
    Array.from({ length: options.width }, () => ({
      letter: null,
      conflict: false,
      blocked: false,
    })),
  );

  for (const blockedCell of options.blockedCells ?? []) {
    const target = grid[blockedCell.row]?.[blockedCell.col];

    if (target) {
      target.blocked = true;
    }
  }

  for (const entry of options.entries) {
    for (const cell of getPlacementCells(entry)) {
      const target = grid[cell.row]?.[cell.col];

      if (!target || target.blocked) {
        continue;
      }

      if (target.letter && target.letter !== cell.letter) {
        target.conflict = true;
        target.letter = cell.letter;
        continue;
      }

      target.letter = cell.letter;
    }
  }

  return grid;
}

export function getAnswerLength(answerSnapshot: string) {
  return getAnswerLetters(answerSnapshot).length;
}

export type PuzzleCellOwnership = {
  entryId: string;
  isStart: boolean;
  number: number | null;
};

export function buildCellOwnershipMap(
  entries: Array<PuzzlePlacementInput & { id: string; number?: number | null }>,
) {
  const map = new Map<string, PuzzleCellOwnership>();

  for (const entry of entries) {
    if (!entry.id) {
      continue;
    }

    const cells = getPlacementCells(entry);

    cells.forEach((cell, index) => {
      const key = `${cell.row}:${cell.col}`;
      const isStart = index === 0;
      const existing = map.get(key);

      map.set(key, {
        entryId: entry.id,
        isStart: isStart || Boolean(existing?.isStart),
        number: isStart
          ? (entry.number ?? existing?.number ?? null)
          : (existing?.number ?? null),
      });
    });
  }

  return map;
}

export function findEntryIdAtCell(
  entries: Array<PuzzlePlacementInput & { id: string }>,
  row: number,
  col: number,
) {
  for (const entry of entries) {
    const cells = getPlacementCells(entry);
    const matches = cells.some((cell) => cell.row === row && cell.col === col);

    if (matches) {
      return entry.id;
    }
  }

  return null;
}

/** Startceller numreras rad för rad, vänster till höger. Delat nummer vid korsning. */
export function computeStartCellNumbers(entries: PuzzlePlacementInput[]) {
  const startCells = new Set<string>();

  for (const entry of entries) {
    startCells.add(`${entry.row}:${entry.col}`);
  }

  const sorted = [...startCells].sort((left, right) => {
    const [leftRow, leftCol] = left.split(":").map(Number);
    const [rightRow, rightCol] = right.split(":").map(Number);

    return leftRow - rightRow || leftCol - rightCol;
  });

  const numbers = new Map<string, number>();

  sorted.forEach((key, index) => {
    numbers.set(key, index + 1);
  });

  return numbers;
}

export function getEntryNumberForPlacement(
  entry: PuzzlePlacementInput,
  startCellNumbers: Map<string, number>,
) {
  return startCellNumbers.get(`${entry.row}:${entry.col}`) ?? null;
}
