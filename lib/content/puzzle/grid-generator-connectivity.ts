import { getOccupiedCells, type PuzzlePlacementInput } from "@/lib/content/puzzle/grid";
import { buildBlockedSet, type BlockedCell } from "@/lib/content/puzzle/grid-generator-blocks";

function cellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function parseKey(key: string) {
  const [row, col] = key.split(":").map(Number);
  return { row, col };
}

const ORTHOGONAL = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
] as const;

function isInside(row: number, col: number, width: number, height: number) {
  return row >= 0 && row < height && col >= 0 && col < width;
}

function isLetterCell(
  row: number,
  col: number,
  letterKeys: Set<string>,
) {
  return letterKeys.has(cellKey(row, col));
}

function isEmptyCell(
  row: number,
  col: number,
  letterKeys: Set<string>,
  blockedKeys: Set<string>,
) {
  const key = cellKey(row, col);
  return !letterKeys.has(key) && !blockedKeys.has(key);
}

function touchesLetter(
  row: number,
  col: number,
  letterKeys: Set<string>,
  width: number,
  height: number,
) {
  for (const delta of ORTHOGONAL) {
    const neighborRow = row + delta.row;
    const neighborCol = col + delta.col;

    if (!isInside(neighborRow, neighborCol, width, height)) {
      continue;
    }

    if (isLetterCell(neighborRow, neighborCol, letterKeys)) {
      return true;
    }
  }

  return false;
}

/** Empty cells directly adjacent to placed letters — potential future word hooks. */
export function computeOpenConnections(
  entries: PuzzlePlacementInput[],
  blockedCells: BlockedCell[],
  width: number,
  height: number,
) {
  const letterKeys = getOccupiedCells(entries);
  const blockedKeys = buildBlockedSet(blockedCells);
  let count = 0;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (!isEmptyCell(row, col, letterKeys, blockedKeys)) {
        continue;
      }

      if (touchesLetter(row, col, letterKeys, width, height)) {
        count += 1;
      }
    }
  }

  return count;
}

export function computeOpenConnectionDelta(
  placement: PuzzlePlacementInput,
  existing: PuzzlePlacementInput[],
  blockedCells: BlockedCell[],
  width: number,
  height: number,
) {
  const before = computeOpenConnections(existing, blockedCells, width, height);
  const after = computeOpenConnections([...existing, placement], blockedCells, width, height);

  return after - before;
}

/** Empty connected components with no letter-adjacent cell — dead expansion zones. */
export function countIsolatedEmptyRegions(
  entries: PuzzlePlacementInput[],
  blockedCells: BlockedCell[],
  width: number,
  height: number,
) {
  const letterKeys = getOccupiedCells(entries);
  const blockedKeys = buildBlockedSet(blockedCells);
  const visited = new Set<string>();
  let regions = 0;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const key = cellKey(row, col);

      if (!isEmptyCell(row, col, letterKeys, blockedKeys) || visited.has(key)) {
        continue;
      }

      regions += 1;
      const queue = [key];
      visited.add(key);
      let touchesLetters = touchesLetter(row, col, letterKeys, width, height);

      while (queue.length > 0) {
        const current = queue.pop() ?? "";
        const { row: currentRow, col: currentCol } = parseKey(current);

        for (const delta of ORTHOGONAL) {
          const neighborRow = currentRow + delta.row;
          const neighborCol = currentCol + delta.col;

          if (!isInside(neighborRow, neighborCol, width, height)) {
            continue;
          }

          const neighborKey = cellKey(neighborRow, neighborCol);

          if (!isEmptyCell(neighborRow, neighborCol, letterKeys, blockedKeys) || visited.has(neighborKey)) {
            continue;
          }

          if (touchesLetter(neighborRow, neighborCol, letterKeys, width, height)) {
            touchesLetters = true;
          }

          visited.add(neighborKey);
          queue.push(neighborKey);
        }
      }

      if (touchesLetters) {
        regions -= 1;
      }
    }
  }

  return regions;
}

export type GridConnectivityMetrics = {
  openConnections: number;
  isolatedEmptyRegions: number;
};

export function computeGridConnectivityMetrics(
  entries: PuzzlePlacementInput[],
  blockedCells: BlockedCell[],
  width: number,
  height: number,
): GridConnectivityMetrics {
  return {
    openConnections: computeOpenConnections(entries, blockedCells, width, height),
    isolatedEmptyRegions: countIsolatedEmptyRegions(entries, blockedCells, width, height),
  };
}
