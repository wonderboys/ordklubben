import {
  getAnswerLength,
  getOccupiedCells,
  getPlacementCells,
  type PuzzlePlacementInput,
} from "@/lib/content/puzzle/grid";

export type BlockedCell = {
  row: number;
  col: number;
};

export type BlockPatternScore = {
  total: number;
  capBonus: number;
  spreadBonus: number;
  runPenalty: number;
  fullLinePenalty: number;
  clusterPenalty: number;
  wallPenalty: number;
  islandPenalty: number;
};

export type ProposeBlockedCellsResult = {
  cells: BlockedCell[];
  rejectedBlockPatterns: number;
};

function cellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function parseKey(key: string) {
  const [row, col] = key.split(":").map(Number);
  return { row, col };
}

function getClusterBounds(
  entries: PuzzlePlacementInput[],
  width: number,
  height: number,
  padding = 1,
) {
  const keys = getOccupiedCells(entries);

  if (keys.size === 0) {
    return { minRow: 0, maxRow: height - 1, minCol: 0, maxCol: width - 1 };
  }

  let minRow = height;
  let maxRow = 0;
  let minCol = width;
  let maxCol = 0;

  for (const key of keys) {
    const { row, col } = parseKey(key);
    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
  }

  return {
    minRow: Math.max(0, minRow - padding),
    maxRow: Math.min(height - 1, maxRow + padding),
    minCol: Math.max(0, minCol - padding),
    maxCol: Math.min(width - 1, maxCol + padding),
  };
}

export function getActiveRegionBounds(
  entries: PuzzlePlacementInput[],
  width: number,
  height: number,
  padding = 1,
) {
  return getClusterBounds(entries, width, height, padding);
}

function rowHasLetters(row: number, letterKeys: Set<string>, width: number) {
  for (let col = 0; col < width; col += 1) {
    if (letterKeys.has(cellKey(row, col))) {
      return true;
    }
  }

  return false;
}

function colHasLetters(col: number, letterKeys: Set<string>, height: number) {
  for (let row = 0; row < height; row += 1) {
    if (letterKeys.has(cellKey(row, col))) {
      return true;
    }
  }

  return false;
}

/** Relaxed blocking rules used when filling the active puzzle region. */
function hasUnacceptableBlockPatternForFinalize(
  blockedCells: BlockedCell[],
  letterKeys: Set<string>,
  width: number,
  height: number,
) {
  const blockedKeys = new Set(blockedCells.map((cell) => cellKey(cell.row, cell.col)));

  for (let row = 0; row < height; row += 1) {
    if (!rowHasLetters(row, letterKeys, width)) {
      continue;
    }

    let blockedInRow = 0;

    for (let col = 0; col < width; col += 1) {
      if (blockedKeys.has(cellKey(row, col))) {
        blockedInRow += 1;
      }
    }

    if (blockedInRow === width) {
      return true;
    }
  }

  for (let col = 0; col < width; col += 1) {
    if (!colHasLetters(col, letterKeys, height)) {
      continue;
    }

    let blockedInCol = 0;

    for (let row = 0; row < height; row += 1) {
      if (blockedKeys.has(cellKey(row, col))) {
        blockedInCol += 1;
      }
    }

    if (blockedInCol === height) {
      return true;
    }
  }

  return false;
}

function countEmptyInRegion(
  letterKeys: Set<string>,
  blockedKeys: Set<string>,
  bounds: ReturnType<typeof getClusterBounds>,
) {
  let count = 0;

  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
      const key = cellKey(row, col);

      if (!letterKeys.has(key) && !blockedKeys.has(key)) {
        count += 1;
      }
    }
  }

  return count;
}

function isInsideBounds(
  row: number,
  col: number,
  bounds: ReturnType<typeof getClusterBounds>,
) {
  return (
    row >= bounds.minRow &&
    row <= bounds.maxRow &&
    col >= bounds.minCol &&
    col <= bounds.maxCol
  );
}

function collectWordCapCandidates(
  entries: PuzzlePlacementInput[],
  letterKeys: Set<string>,
  width: number,
  height: number,
) {
  const caps: BlockedCell[] = [];

  for (const entry of entries) {
    const length = getAnswerLength(entry.answerSnapshot);

    if (entry.direction === "ACROSS") {
      caps.push({ row: entry.row, col: entry.col - 1 });
      caps.push({ row: entry.row, col: entry.col + length });
    } else {
      caps.push({ row: entry.row - 1, col: entry.col });
      caps.push({ row: entry.row + length, col: entry.col });
    }
  }

  return caps.filter(
    (cell) =>
      cell.row >= 0 &&
      cell.row < height &&
      cell.col >= 0 &&
      cell.col < width &&
      !letterKeys.has(cellKey(cell.row, cell.col)),
  );
}

function collectSmallHoleCandidates(
  entries: PuzzlePlacementInput[],
  blockedKeys: Set<string>,
  letterKeys: Set<string>,
  width: number,
  height: number,
) {
  const bounds = getClusterBounds(entries, width, height, 1);
  const holes: BlockedCell[] = [];

  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
      const key = cellKey(row, col);

      if (letterKeys.has(key) || blockedKeys.has(key)) {
        continue;
      }

      const neighbors = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 },
      ];

      let occupiedNeighbors = 0;

      for (const neighbor of neighbors) {
        if (neighbor.row < 0 || neighbor.row >= height || neighbor.col < 0 || neighbor.col >= width) {
          occupiedNeighbors += 1;
          continue;
        }

        const neighborKey = cellKey(neighbor.row, neighbor.col);

        if (letterKeys.has(neighborKey) || blockedKeys.has(neighborKey)) {
          occupiedNeighbors += 1;
        }
      }

      if (occupiedNeighbors >= 3) {
        holes.push({ row, col });
      }
    }
  }

  return holes;
}

function longestBlockedRun(blockedKeys: Set<string>, width: number, height: number) {
  let longest = 0;

  for (let row = 0; row < height; row += 1) {
    let run = 0;

    for (let col = 0; col < width; col += 1) {
      if (blockedKeys.has(cellKey(row, col))) {
        run += 1;
        longest = Math.max(longest, run);
      } else {
        run = 0;
      }
    }
  }

  for (let col = 0; col < width; col += 1) {
    let run = 0;

    for (let row = 0; row < height; row += 1) {
      if (blockedKeys.has(cellKey(row, col))) {
        run += 1;
        longest = Math.max(longest, run);
      } else {
        run = 0;
      }
    }
  }

  return longest;
}

function countFullBlockedLines(blockedKeys: Set<string>, width: number, height: number) {
  let count = 0;

  for (let row = 0; row < height; row += 1) {
    let blockedInRow = 0;

    for (let col = 0; col < width; col += 1) {
      if (blockedKeys.has(cellKey(row, col))) {
        blockedInRow += 1;
      }
    }

    if (blockedInRow === width) {
      count += 1;
    }
  }

  for (let col = 0; col < width; col += 1) {
    let blockedInCol = 0;

    for (let row = 0; row < height; row += 1) {
      if (blockedKeys.has(cellKey(row, col))) {
        blockedInCol += 1;
      }
    }

    if (blockedInCol === height) {
      count += 1;
    }
  }

  return count;
}

export function countBlockedClusters(blockedKeys: Set<string>, width: number, height: number) {
  const visited = new Set<string>();
  let clusters = 0;

  for (const key of blockedKeys) {
    if (visited.has(key)) {
      continue;
    }

    clusters += 1;
    const queue = [key];
    visited.add(key);

    while (queue.length > 0) {
      const current = queue.pop() ?? "";
      const { row, col } = parseKey(current);
      const neighbors = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 },
      ];

      for (const neighbor of neighbors) {
        if (neighbor.row < 0 || neighbor.row >= height || neighbor.col < 0 || neighbor.col >= width) {
          continue;
        }

        const neighborKey = cellKey(neighbor.row, neighbor.col);

        if (!blockedKeys.has(neighborKey) || visited.has(neighborKey)) {
          continue;
        }

        visited.add(neighborKey);
        queue.push(neighborKey);
      }
    }
  }

  return clusters;
}

function largestBlockedClusterSize(blockedKeys: Set<string>, width: number, height: number) {
  const visited = new Set<string>();
  let largest = 0;

  for (const key of blockedKeys) {
    if (visited.has(key)) {
      continue;
    }

    let size = 0;
    const queue = [key];
    visited.add(key);

    while (queue.length > 0) {
      size += 1;
      const current = queue.pop() ?? "";
      const { row, col } = parseKey(current);
      const neighbors = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 },
      ];

      for (const neighbor of neighbors) {
        if (neighbor.row < 0 || neighbor.row >= height || neighbor.col < 0 || neighbor.col >= width) {
          continue;
        }

        const neighborKey = cellKey(neighbor.row, neighbor.col);

        if (!blockedKeys.has(neighborKey) || visited.has(neighborKey)) {
          continue;
        }

        visited.add(neighborKey);
        queue.push(neighborKey);
      }
    }

    largest = Math.max(largest, size);
  }

  return largest;
}

function countLetterIslands(entries: PuzzlePlacementInput[], width: number, height: number) {
  const letterKeys = getOccupiedCells(entries);
  const visited = new Set<string>();
  let islands = 0;

  for (const key of letterKeys) {
    if (visited.has(key)) {
      continue;
    }

    islands += 1;
    const queue = [key];
    visited.add(key);

    while (queue.length > 0) {
      const current = queue.pop() ?? "";
      const { row, col } = parseKey(current);
      const neighbors = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 },
      ];

      for (const neighbor of neighbors) {
        if (neighbor.row < 0 || neighbor.row >= height || neighbor.col < 0 || neighbor.col >= width) {
          continue;
        }

        const neighborKey = cellKey(neighbor.row, neighbor.col);

        if (!letterKeys.has(neighborKey) || visited.has(neighborKey)) {
          continue;
        }

        visited.add(neighborKey);
        queue.push(neighborKey);
      }
    }
  }

  return islands;
}

function countEdgeBlocks(blockedKeys: Set<string>, width: number, height: number) {
  let count = 0;

  for (const key of blockedKeys) {
    const { row, col } = parseKey(key);

    if (row === 0 || col === 0 || row === height - 1 || col === width - 1) {
      count += 1;
    }
  }

  return count;
}

export function isWordCapBlock(
  cell: BlockedCell,
  entries: PuzzlePlacementInput[],
) {
  for (const entry of entries) {
    const length = getAnswerLength(entry.answerSnapshot);

    if (entry.direction === "ACROSS") {
      if (cell.row === entry.row && cell.col === entry.col - 1) {
        return true;
      }

      if (cell.row === entry.row && cell.col === entry.col + length) {
        return true;
      }
    } else {
      if (cell.col === entry.col && cell.row === entry.row - 1) {
        return true;
      }

      if (cell.col === entry.col && cell.row === entry.row + length) {
        return true;
      }
    }
  }

  return false;
}

export function hasUnacceptableBlockPattern(
  blockedCells: BlockedCell[],
  width: number,
  height: number,
) {
  const blockedKeys = new Set(blockedCells.map((cell) => cellKey(cell.row, cell.col)));

  if (countFullBlockedLines(blockedKeys, width, height) > 0) {
    return true;
  }

  if (longestBlockedRun(blockedKeys, width, height) >= 3) {
    return true;
  }

  if (largestBlockedClusterSize(blockedKeys, width, height) > Math.max(6, Math.floor((width * height) * 0.12))) {
    return true;
  }

  return false;
}

export function scoreBlockPattern(options: {
  blockedCells: BlockedCell[];
  entries: PuzzlePlacementInput[];
  width: number;
  height: number;
}): BlockPatternScore {
  const { blockedCells, entries, width, height } = options;
  const blockedKeys = new Set(blockedCells.map((cell) => cellKey(cell.row, cell.col)));

  let capBonus = 0;

  for (const cell of blockedCells) {
    if (isWordCapBlock(cell, entries)) {
      capBonus += 12;
    }
  }

  const longestRun = longestBlockedRun(blockedKeys, width, height);
  const runPenalty = longestRun >= 3 ? (longestRun - 2) * 95 : 0;
  const fullLinePenalty = countFullBlockedLines(blockedKeys, width, height) * 280;
  const largestCluster = largestBlockedClusterSize(blockedKeys, width, height);
  const clusterPenalty =
    largestCluster > 2 ? (largestCluster - 2) * 48 : 0;
  const clusters = countBlockedClusters(blockedKeys, width, height);
  const spreadBonus = clusters > 0 ? Math.min(clusters * 4, 24) : 0;
  const edgeBlocks = countEdgeBlocks(blockedKeys, width, height);
  const wallPenalty =
    edgeBlocks > blockedCells.length * 0.55
      ? (edgeBlocks - blockedCells.length * 0.45) * 14
      : 0;
  const islands = countLetterIslands(entries, width, height);
  const islandPenalty = islands > 1 ? (islands - 1) * 60 : 0;

  const total =
    capBonus +
    spreadBonus -
    runPenalty -
    fullLinePenalty -
    clusterPenalty -
    wallPenalty -
    islandPenalty;

  return {
    total,
    capBonus,
    spreadBonus,
    runPenalty,
    fullLinePenalty,
    clusterPenalty,
    wallPenalty,
    islandPenalty,
  };
}

export function countBlockedClustersForCells(
  blockedCells: BlockedCell[],
  width: number,
  height: number,
) {
  const blockedKeys = new Set(blockedCells.map((cell) => cellKey(cell.row, cell.col)));
  return countBlockedClusters(blockedKeys, width, height);
}

export function proposeWordCapBlocks(
  entries: PuzzlePlacementInput[],
  width: number,
  height: number,
): ProposeBlockedCellsResult {
  if (entries.length === 0) {
    return { cells: [], rejectedBlockPatterns: 0 };
  }

  const letterKeys = getOccupiedCells(entries);
  const bounds = getClusterBounds(entries, width, height, 1);
  const accepted = new Map<string, BlockedCell>();

  for (const cap of collectWordCapCandidates(entries, letterKeys, width, height)) {
    const key = cellKey(cap.row, cap.col);

    if (
      cap.row < 0 ||
      cap.row >= height ||
      cap.col < 0 ||
      cap.col >= width ||
      letterKeys.has(key) ||
      accepted.has(key) ||
      !isInsideBounds(cap.row, cap.col, bounds)
    ) {
      continue;
    }

    accepted.set(key, cap);
  }

  return {
    cells: [...accepted.values()],
    rejectedBlockPatterns: 0,
  };
}

export function proposeBlockedCells(
  entries: PuzzlePlacementInput[],
  width: number,
  height: number,
): ProposeBlockedCellsResult {
  if (entries.length === 0) {
    return { cells: [], rejectedBlockPatterns: 0 };
  }

  const letterKeys = getOccupiedCells(entries);
  const bounds = getClusterBounds(entries, width, height, 1);
  const accepted = new Map<string, BlockedCell>();
  let rejectedBlockPatterns = 0;

  function tryAdd(cell: BlockedCell, required = false) {
    const key = cellKey(cell.row, cell.col);

    if (
      cell.row < 0 ||
      cell.row >= height ||
      cell.col < 0 ||
      cell.col >= width ||
      letterKeys.has(key) ||
      accepted.has(key) ||
      !isInsideBounds(cell.row, cell.col, bounds)
    ) {
      return;
    }

    const candidate = [...accepted.values(), cell];

    if (hasUnacceptableBlockPattern(candidate, width, height)) {
      if (!required) {
        rejectedBlockPatterns += 1;
      }

      return;
    }

    accepted.set(key, cell);
  }

  for (const cap of collectWordCapCandidates(entries, letterKeys, width, height)) {
    tryAdd(cap, true);
  }

  const holePasses = 2;

  for (let pass = 0; pass < holePasses; pass += 1) {
    const blockedKeys = new Set(accepted.keys());
    const holes = collectSmallHoleCandidates(
      entries,
      blockedKeys,
      letterKeys,
      width,
      height,
    );

    for (const hole of holes) {
      tryAdd(hole);
    }
  }

  return {
    cells: [...accepted.values()],
    rejectedBlockPatterns,
  };
}

export function finalizeBlockedCells(
  entries: PuzzlePlacementInput[],
  strategicBlocks: BlockedCell[],
  width: number,
  height: number,
): {
  cells: BlockedCell[];
  blockedEmptyCount: number;
  remainingEmptyCount: number;
  activeRegionEmptyCount: number;
  rejectedBlockPatterns: number;
} {
  const letterKeys = getOccupiedCells(entries);
  const bounds = getActiveRegionBounds(entries, width, height, 1);
  const accepted = new Map<string, BlockedCell>();
  let rejectedBlockPatterns = 0;

  for (const cell of strategicBlocks) {
    const key = cellKey(cell.row, cell.col);

    if (!letterKeys.has(key)) {
      accepted.set(key, cell);
    }
  }

  const emptyCandidates: BlockedCell[] = [];

  for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
      const key = cellKey(row, col);

      if (!letterKeys.has(key) && !accepted.has(key)) {
        emptyCandidates.push({ row, col });
      }
    }
  }

  emptyCandidates.sort((left, right) => {
    const leftScore =
      (rowHasLetters(left.row, letterKeys, width) ? 0 : 1) +
      (colHasLetters(left.col, letterKeys, height) ? 0 : 1);
    const rightScore =
      (rowHasLetters(right.row, letterKeys, width) ? 0 : 1) +
      (colHasLetters(right.col, letterKeys, height) ? 0 : 1);

    return leftScore - rightScore;
  });

  let blockedEmptyCount = 0;

  for (const cell of emptyCandidates) {
    const key = cellKey(cell.row, cell.col);
    const candidate = [...accepted.values(), cell];

    if (
      hasUnacceptableBlockPatternForFinalize(
        candidate,
        letterKeys,
        width,
        height,
      )
    ) {
      rejectedBlockPatterns += 1;
      continue;
    }

    accepted.set(key, cell);
    blockedEmptyCount += 1;
  }

  const blockedKeys = new Set(accepted.keys());
  const activeRegionEmptyCount = countEmptyInRegion(letterKeys, blockedKeys, bounds);

  let remainingEmptyCount = 0;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const key = cellKey(row, col);

      if (!letterKeys.has(key) && !accepted.has(key)) {
        remainingEmptyCount += 1;
      }
    }
  }

  return {
    cells: [...accepted.values()],
    blockedEmptyCount,
    remainingEmptyCount,
    activeRegionEmptyCount,
    rejectedBlockPatterns,
  };
}

export function computeGridUtilization(
  entries: PuzzlePlacementInput[],
  width: number,
  height: number,
) {
  const letterCells = getOccupiedCells(entries).size;
  const totalCells = width * height;

  return {
    letterCells,
    totalCells,
    rate: totalCells > 0 ? letterCells / totalCells : 0,
  };
}

export function countGridCrossings(entries: PuzzlePlacementInput[]) {
  const acrossKeys = new Set<string>();
  const downKeys = new Set<string>();

  for (const entry of entries) {
    const target = entry.direction === "ACROSS" ? acrossKeys : downKeys;

    for (const cell of getPlacementCells(entry)) {
      target.add(cellKey(cell.row, cell.col));
    }
  }

  let crossings = 0;

  for (const key of acrossKeys) {
    if (downKeys.has(key)) {
      crossings += 1;
    }
  }

  return crossings;
}

export function buildBlockedSet(blockedCells: BlockedCell[]) {
  return new Set(blockedCells.map((cell) => cellKey(cell.row, cell.col)));
}
