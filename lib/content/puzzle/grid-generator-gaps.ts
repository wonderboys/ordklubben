import {
  buildLetterMap,
  getAnswerLength,
  type PuzzlePlacementInput,
} from '@/lib/content/puzzle/grid';
import { buildBlockedSet, type BlockedCell } from '@/lib/content/puzzle/grid-generator-blocks';
import { getAnswerLetters } from '@/lib/content/puzzle/grid-generator-scoring';
import { validateGeneratorPlacement } from '@/lib/content/puzzle/grid-generator-validation';

export type GridSlot = {
  row: number;
  col: number;
  direction: 'ACROSS' | 'DOWN';
  length: number;
  /** Known letters at slot indices from existing crossings. */
  knownLetters: Map<number, string>;
};

export type GapFillResult<
  T extends { id: string; answer: string } = { id: string; answer: string },
> = {
  filledCount: number;
  placements: Array<{
    candidate: T;
    placement: PuzzlePlacementInput;
  }>;
};

function cellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function isBlocked(row: number, col: number, blocked: Set<string>, width: number, height: number) {
  if (row < 0 || row >= height || col < 0 || col >= width) {
    return true;
  }

  return blocked.has(cellKey(row, col));
}

function findHorizontalSlots(
  letterMap: Map<string, string>,
  blocked: Set<string>,
  width: number,
  height: number,
): GridSlot[] {
  const slots: GridSlot[] = [];

  for (let row = 0; row < height; row += 1) {
    let col = 0;

    while (col < width) {
      while (col < width && isBlocked(row, col, blocked, width, height)) {
        col += 1;
      }

      const startCol = col;
      const knownLetters = new Map<number, string>();
      let length = 0;

      while (col < width && !isBlocked(row, col, blocked, width, height)) {
        const key = cellKey(row, col);
        const letter = letterMap.get(key);

        if (letter) {
          knownLetters.set(length, letter);
        }

        length += 1;
        col += 1;
      }

      if (length >= 2) {
        slots.push({
          row,
          col: startCol,
          direction: 'ACROSS',
          length,
          knownLetters,
        });
      }
    }
  }

  return slots;
}

function findVerticalSlots(
  letterMap: Map<string, string>,
  blocked: Set<string>,
  width: number,
  height: number,
): GridSlot[] {
  const slots: GridSlot[] = [];

  for (let col = 0; col < width; col += 1) {
    let row = 0;

    while (row < height) {
      while (row < height && isBlocked(row, col, blocked, width, height)) {
        row += 1;
      }

      const startRow = row;
      const knownLetters = new Map<number, string>();
      let length = 0;

      while (row < height && !isBlocked(row, col, blocked, width, height)) {
        const key = cellKey(row, col);
        const letter = letterMap.get(key);

        if (letter) {
          knownLetters.set(length, letter);
        }

        length += 1;
        row += 1;
      }

      if (length >= 2) {
        slots.push({
          row: startRow,
          col,
          direction: 'DOWN',
          length,
          knownLetters,
        });
      }
    }
  }

  return slots;
}

export function findFillableSlots(
  entries: PuzzlePlacementInput[],
  blockedCells: BlockedCell[],
  width: number,
  height: number,
): GridSlot[] {
  const letterMap = buildLetterMap(entries);
  const blocked = buildBlockedSet(blockedCells);

  const horizontal = findHorizontalSlots(letterMap, blocked, width, height);
  const vertical = findVerticalSlots(letterMap, blocked, width, height);

  return [...horizontal, ...vertical].filter((slot) => {
    let emptyCells = 0;

    for (let index = 0; index < slot.length; index += 1) {
      if (!slot.knownLetters.has(index)) {
        emptyCells += 1;
      }
    }

    return emptyCells >= 1;
  });
}

function candidateMatchesSlot(answer: string, slot: GridSlot) {
  const letters = getAnswerLetters(answer);

  if (letters.length !== slot.length) {
    return false;
  }

  for (const [index, letter] of slot.knownLetters.entries()) {
    if (letters[index] !== letter) {
      return false;
    }
  }

  return true;
}

export function buildCandidatesByLength<T extends { answer: string }>(candidates: T[]) {
  const byLength = new Map<number, T[]>();

  for (const candidate of candidates) {
    const length = getAnswerLength(candidate.answer);
    const bucket = byLength.get(length) ?? [];
    bucket.push(candidate);
    byLength.set(length, bucket);
  }

  return byLength;
}

export function fillGapSlots<T extends { id: string; answer: string }>(options: {
  pool: T[];
  placedIds: Set<string>;
  existing: PuzzlePlacementInput[];
  blockedCells: BlockedCell[];
  width: number;
  height: number;
  scoreCandidate: (candidate: T, slotLength: number) => number;
  onReject: (validation: { ok: false; reason: string }) => void;
}): GapFillResult {
  const { pool, placedIds, existing, blockedCells, width, height, scoreCandidate, onReject } =
    options;

  const available = pool.filter((candidate) => !placedIds.has(candidate.id));
  const byLength = buildCandidatesByLength(available);
  const placements: GapFillResult['placements'] = [];
  let filledCount = 0;
  const placementInputs = [...existing];
  const blocked = [...blockedCells];
  let changed = true;

  while (changed) {
    changed = false;
    const slots = findFillableSlots(placementInputs, blocked, width, height).sort(
      (left, right) => left.length - right.length,
    );

    for (const slot of slots) {
      const candidates = (byLength.get(slot.length) ?? [])
        .filter((candidate) => !placedIds.has(candidate.id))
        .filter((candidate) => candidateMatchesSlot(candidate.answer, slot))
        .sort(
          (left, right) => scoreCandidate(right, slot.length) - scoreCandidate(left, slot.length),
        );

      for (const candidate of candidates.slice(0, 12)) {
        const placement: PuzzlePlacementInput = {
          answerSnapshot: candidate.answer,
          row: slot.row,
          col: slot.col,
          direction: slot.direction,
        };

        const validation = validateGeneratorPlacement({
          placement,
          existing: placementInputs,
          blockedCells: blocked,
          width,
          height,
        });

        if (!validation.ok) {
          onReject(validation);
          continue;
        }

        placements.push({ candidate, placement });
        placedIds.add(candidate.id);
        placementInputs.push(placement);
        filledCount += 1;
        changed = true;
        break;
      }

      if (changed) {
        break;
      }
    }
  }

  return { filledCount, placements };
}

export function countEmptyCells(
  entries: PuzzlePlacementInput[],
  blockedCells: BlockedCell[],
  width: number,
  height: number,
) {
  const letterMap = buildLetterMap(entries);
  const blocked = buildBlockedSet(blockedCells);
  let count = 0;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const key = cellKey(row, col);

      if (!letterMap.has(key) && !blocked.has(key)) {
        count += 1;
      }
    }
  }

  return count;
}
