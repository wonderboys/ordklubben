import {
  buildLetterMap,
  getPlacementCells,
  type PuzzlePlacementInput,
  validatePuzzlePlacement,
} from "@/lib/content/puzzle/grid";
import { getAnswerLetters } from "@/lib/content/puzzle/grid-generator-scoring";
import { getActiveRegionBounds, buildBlockedSet as buildBlockedSetFromBlocks } from "@/lib/content/puzzle/grid-generator-blocks";

export type GeneratorValidationFailure =
  | "collision"
  | "adjacency"
  | "side_word";

export type GeneratorValidationResult =
  | { ok: true }
  | { ok: false; reason: GeneratorValidationFailure; message: string };

type GridRun = {
  row: number;
  col: number;
  direction: "ACROSS" | "DOWN";
  letters: string;
};

type CellKind = "out" | "empty" | "blocked" | "letter";

function buildBlockedSet(blockedCells: Array<{ row: number; col: number }>) {
  return buildBlockedSetFromBlocks(blockedCells);
}

function getCellKind(
  row: number,
  col: number,
  letterMap: Map<string, string>,
  blocked: Set<string>,
  width: number,
  height: number,
): CellKind {
  if (row < 0 || row >= height || col < 0 || col >= width) {
    return "out";
  }

  const key = `${row}:${col}`;

  if (letterMap.has(key)) {
    return "letter";
  }

  if (blocked.has(key)) {
    return "blocked";
  }

  return "empty";
}

function isCapAllowed(kind: CellKind) {
  return kind === "out" || kind === "empty" || kind === "blocked";
}

function occupiedCellKeys(entries: PuzzlePlacementInput[]) {
  return new Set(
    entries.flatMap((entry) =>
      getPlacementCells(entry).map((cell) => `${cell.row}:${cell.col}`),
    ),
  );
}

function entryAtCell(
  entries: PuzzlePlacementInput[],
  row: number,
  col: number,
  direction: "ACROSS" | "DOWN",
) {
  for (const entry of entries) {
    if (entry.direction !== direction) {
      continue;
    }

    const cells = getPlacementCells(entry);

    if (cells.some((cell) => cell.row === row && cell.col === col)) {
      return entry;
    }
  }

  return null;
}

function isValidCrossingNeighbor(options: {
  row: number;
  col: number;
  crossingRow: number;
  crossingCol: number;
  entries: PuzzlePlacementInput[];
  perpendicularDirection: "ACROSS" | "DOWN";
}) {
  const entry = entryAtCell(
    options.entries,
    options.crossingRow,
    options.crossingCol,
    options.perpendicularDirection,
  );

  if (!entry) {
    return false;
  }

  const cells = getPlacementCells(entry);

  return cells.some(
    (cell) => cell.row === options.row && cell.col === options.col,
  );
}

export function extractGridRuns(
  entries: PuzzlePlacementInput[],
  width: number,
  height: number,
): GridRun[] {
  const letterMap = buildLetterMap(entries);
  const runs: GridRun[] = [];

  for (let row = 0; row < height; row += 1) {
    let col = 0;

    while (col < width) {
      if (!letterMap.has(`${row}:${col}`)) {
        col += 1;
        continue;
      }

      const startCol = col;
      let letters = "";

      while (col < width && letterMap.has(`${row}:${col}`)) {
        letters += letterMap.get(`${row}:${col}`) ?? "";
        col += 1;
      }

      if (letters.length > 1) {
        runs.push({
          row,
          col: startCol,
          direction: "ACROSS",
          letters,
        });
      }
    }
  }

  for (let col = 0; col < width; col += 1) {
    let row = 0;

    while (row < height) {
      if (!letterMap.has(`${row}:${col}`)) {
        row += 1;
        continue;
      }

      const startRow = row;
      let letters = "";

      while (row < height && letterMap.has(`${row}:${col}`)) {
        letters += letterMap.get(`${row}:${col}`) ?? "";
        row += 1;
      }

      if (letters.length > 1) {
        runs.push({
          row: startRow,
          col,
          direction: "DOWN",
          letters,
        });
      }
    }
  }

  return runs;
}

export function validateNoSpuriousWords(
  entries: PuzzlePlacementInput[],
  width: number,
  height: number,
): GeneratorValidationResult {
  const runs = extractGridRuns(entries, width, height);

  for (const run of runs) {
    const matchingEntries = entries.filter((entry) => {
      if (entry.direction !== run.direction) {
        return false;
      }

      if (entry.row !== run.row || entry.col !== run.col) {
        return false;
      }

      const letters = getAnswerLetters(entry.answerSnapshot).join("");
      return letters === run.letters;
    });

    if (matchingEntries.length !== 1) {
      return {
        ok: false,
        reason: "side_word",
        message: `Oavsiktligt ${run.direction === "ACROSS" ? "vågrätt" : "lodrätt"} ord: ${run.letters}`,
      };
    }
  }

  return { ok: true };
}

export function validateGeneratorPlacement(options: {
  placement: PuzzlePlacementInput;
  existing: PuzzlePlacementInput[];
  blockedCells?: Array<{ row: number; col: number }>;
  width: number;
  height: number;
}): GeneratorValidationResult {
  const { placement, existing, width, height } = options;
  const blockedCells = options.blockedCells ?? [];
  const blocked = buildBlockedSet(blockedCells);

  const baseValidation = validatePuzzlePlacement({
    placement,
    existing,
    blockedCells,
    width,
    height,
  });

  if (!baseValidation.ok) {
    return {
      ok: false,
      reason: "collision",
      message: baseValidation.message,
    };
  }

  const letters = getAnswerLetters(placement.answerSnapshot);
  const cells = getPlacementCells(placement);
  const letterMap = buildLetterMap(existing);
  const occupiedBefore = occupiedCellKeys(existing);
  const allEntries = [...existing, placement];

  if (placement.direction === "ACROSS") {
    const beforeKind = getCellKind(
      placement.row,
      placement.col - 1,
      letterMap,
      blocked,
      width,
      height,
    );
    const afterKind = getCellKind(
      placement.row,
      placement.col + letters.length,
      letterMap,
      blocked,
      width,
      height,
    );

    if (!isCapAllowed(beforeKind) || !isCapAllowed(afterKind)) {
      return {
        ok: false,
        reason: "adjacency",
        message: "Ordet får inte ligga direkt intill ett annat ord.",
      };
    }
  } else {
    const beforeKind = getCellKind(
      placement.row - 1,
      placement.col,
      letterMap,
      blocked,
      width,
      height,
    );
    const afterKind = getCellKind(
      placement.row + letters.length,
      placement.col,
      letterMap,
      blocked,
      width,
      height,
    );

    if (!isCapAllowed(beforeKind) || !isCapAllowed(afterKind)) {
      return {
        ok: false,
        reason: "adjacency",
        message: "Ordet får inte ligga direkt intill ett annat ord.",
      };
    }
  }

  for (const cell of cells) {
    const isCrossing = occupiedBefore.has(`${cell.row}:${cell.col}`);

    if (isCrossing) {
      const existingAcross = entryAtCell(existing, cell.row, cell.col, "ACROSS");
      const existingDown = entryAtCell(existing, cell.row, cell.col, "DOWN");

      if (placement.direction === "ACROSS" && existingAcross) {
        return {
          ok: false,
          reason: "collision",
          message: "Korsande ord måste ha motsatt riktning.",
        };
      }

      if (placement.direction === "DOWN" && existingDown) {
        return {
          ok: false,
          reason: "collision",
          message: "Korsande ord måste ha motsatt riktning.",
        };
      }

      continue;
    }

    const perpendicularOffsets =
      placement.direction === "ACROSS"
        ? [
            { row: cell.row - 1, col: cell.col },
            { row: cell.row + 1, col: cell.col },
          ]
        : [
            { row: cell.row, col: cell.col - 1 },
            { row: cell.row, col: cell.col + 1 },
          ];

    for (const neighbor of perpendicularOffsets) {
      const kind = getCellKind(
        neighbor.row,
        neighbor.col,
        letterMap,
        blocked,
        width,
        height,
      );

      if (kind === "out" || kind === "empty" || kind === "blocked") {
        continue;
      }

      const perpendicularDirection = placement.direction === "ACROSS" ? "DOWN" : "ACROSS";
      const validCrossing = isValidCrossingNeighbor({
        row: neighbor.row,
        col: neighbor.col,
        crossingRow: cell.row,
        crossingCol: cell.col,
        entries: existing,
        perpendicularDirection,
      });

      if (!validCrossing) {
        return {
          ok: false,
          reason: "adjacency",
          message: "Ordet får inte ligga parallellt intill ett annat ord.",
        };
      }
    }
  }

  const sideWordValidation = validateNoSpuriousWords(allEntries, width, height);

  if (!sideWordValidation.ok) {
    return sideWordValidation;
  }

  return { ok: true };
}

export type FinalGridValidationResult =
  | { ok: true; remainingEmptyCount: number; activeRegionEmptyCount: 0 }
  | { ok: false; remainingEmptyCount: number; activeRegionEmptyCount: number; message: string };

export function validateFinalGrid(options: {
  entries: PuzzlePlacementInput[];
  blockedCells: Array<{ row: number; col: number }>;
  width: number;
  height: number;
}): FinalGridValidationResult {
  const { entries, blockedCells, width, height } = options;
  const letterMap = buildLetterMap(entries);
  const blocked = buildBlockedSet(blockedCells);
  const bounds = getActiveRegionBounds(entries, width, height, 1);
  let remainingEmptyCount = 0;
  let activeRegionEmptyCount = 0;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const key = `${row}:${col}`;

      if (!letterMap.has(key) && !blocked.has(key)) {
        remainingEmptyCount += 1;

        if (
          row >= bounds.minRow &&
          row <= bounds.maxRow &&
          col >= bounds.minCol &&
          col <= bounds.maxCol
        ) {
          activeRegionEmptyCount += 1;
        }
      }
    }
  }

  if (activeRegionEmptyCount > 0) {
    return {
      ok: false,
      remainingEmptyCount,
      activeRegionEmptyCount,
      message: `${activeRegionEmptyCount} tomrutor kvar i den aktiva flätan.`,
    };
  }

  for (const entry of entries) {
    const letters = getAnswerLetters(entry.answerSnapshot);

    if (letters.length < 2) {
      return {
        ok: false,
        remainingEmptyCount,
        activeRegionEmptyCount,
        message: "Enbokstavsord är inte tillåtna.",
      };
    }
  }

  const sideWordValidation = validateNoSpuriousWords(entries, width, height);

  if (!sideWordValidation.ok) {
    return {
      ok: false,
      remainingEmptyCount,
      activeRegionEmptyCount,
      message: sideWordValidation.message,
    };
  }

  return { ok: true, remainingEmptyCount, activeRegionEmptyCount: 0 };
}
