import { getAnswerLength, type PuzzlePlacementInput } from "@/lib/content/puzzle/grid";
import {
  countGridCrossings,
  finalizeBlockedCells,
  isWordCapBlock,
  proposeWordCapBlocks,
  type BlockedCell,
} from "@/lib/content/puzzle/grid-generator-blocks";
import { fillGapSlots } from "@/lib/content/puzzle/grid-generator-gaps";
import {
  buildLetterFrequency,
  getGridSizeProfile,
  scoreWordCandidate,
  type GridSizeProfile,
} from "@/lib/content/puzzle/grid-generator-scoring";
import { validateFinalGrid, validateGeneratorPlacement } from "@/lib/content/puzzle/grid-generator-validation";

export type OptimizationImprovement = {
  wordsAdded: number;
  blocksRemoved: number;
  crossingsAdded: number;
};

type OptimizeCandidate = {
  id: string;
  answer: string;
  hasThemeMatch?: boolean;
  hints: Array<{
    id: string;
    text: string;
    status: "DRAFT" | "APPROVED";
  }>;
};

type OptimizePlacedEntry = {
  wordId: string;
  answerSnapshot: string;
  row: number;
  col: number;
  direction: "ACROSS" | "DOWN";
  hintId: string | null;
  hintSnapshot: string | null;
};

function cellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function buildPlacedEntryFromCandidate(
  candidate: OptimizeCandidate,
  placement: PuzzlePlacementInput,
): OptimizePlacedEntry {
  return {
    wordId: candidate.id,
    answerSnapshot: candidate.answer,
    row: placement.row,
    col: placement.col,
    direction: placement.direction,
    hintId: null,
    hintSnapshot: null,
  };
}

function tryPlaceAdditionalCrossings(options: {
  pool: OptimizeCandidate[];
  placementInputs: PuzzlePlacementInput[];
  placedIds: Set<string>;
  blockedCells: BlockedCell[];
  profile: GridSizeProfile;
  width: number;
  height: number;
  themeSelected: boolean;
  maxAdds: number;
}) {
  const {
    pool,
    placementInputs,
    placedIds,
    blockedCells,
    profile,
    width,
    height,
    themeSelected,
    maxAdds,
  } = options;
  const additions: Array<{ candidate: OptimizeCandidate; placement: PuzzlePlacementInput }> = [];
  const localIds = new Set(placedIds);
  const localInputs = [...placementInputs];

  for (let attempt = 0; attempt < maxAdds; attempt += 1) {
    let best:
      | { candidate: OptimizeCandidate; placement: PuzzlePlacementInput; score: number }
      | null = null;

    for (const candidate of pool) {
      if (localIds.has(candidate.id)) {
        continue;
      }

      const candidateLetters = candidate.answer
        .trim()
        .toLocaleUpperCase("sv-SE")
        .replace(/[\s'’\-‐‑‒–—]+/g, "")
        .split("");

      for (const placed of placementInputs) {
        const placedLetters = placed.answerSnapshot
          .trim()
          .toLocaleUpperCase("sv-SE")
          .replace(/[\s'’\-‐‑‒–—]+/g, "")
          .split("");

        for (let candidateIndex = 0; candidateIndex < candidateLetters.length; candidateIndex += 1) {
          for (let placedIndex = 0; placedIndex < placedLetters.length; placedIndex += 1) {
            if (candidateLetters[candidateIndex] !== placedLetters[placedIndex]) {
              continue;
            }

            const placement: PuzzlePlacementInput =
              placed.direction === "ACROSS"
                ? {
                    answerSnapshot: candidate.answer,
                    row: placed.row - candidateIndex,
                    col: placed.col + placedIndex,
                    direction: "DOWN",
                  }
                : {
                    answerSnapshot: candidate.answer,
                    row: placed.row + placedIndex,
                    col: placed.col - candidateIndex,
                    direction: "ACROSS",
                  };

            const validation = validateGeneratorPlacement({
              placement,
              existing: localInputs,
              blockedCells,
              width,
              height,
            });

            if (!validation.ok) {
              continue;
            }

            const score = scoreWordCandidate({
              candidate,
              profile,
              placedLengths: localInputs.map((entry) => getAnswerLength(entry.answerSnapshot)),
              letterFrequency: buildLetterFrequency(localInputs),
              themeSelected,
              phase: "crossing",
            });

            if (!best || score > best.score) {
              best = { candidate, placement, score };
            }
          }
        }
      }
    }

    if (!best) {
      break;
    }

    additions.push({ candidate: best.candidate, placement: best.placement });
    localIds.add(best.candidate.id);
    localInputs.push(best.placement);
  }

  return additions;
}

export function optimizeGridLayout(options: {
  pool: OptimizeCandidate[];
  placed: OptimizePlacedEntry[];
  placementInputs: PuzzlePlacementInput[];
  blockedCells: BlockedCell[];
  width: number;
  height: number;
  themeSelected: boolean;
  placedIds: Set<string>;
  maxBlockRemovals?: number;
  deadlineMs?: number;
}): {
  placed: OptimizePlacedEntry[];
  placementInputs: PuzzlePlacementInput[];
  blockedCells: BlockedCell[];
  improvement: OptimizationImprovement;
  finalValidationOk: boolean;
} {
  const {
    pool,
    placed,
    placementInputs,
    blockedCells,
    width,
    height,
    themeSelected,
    placedIds,
    maxBlockRemovals = 10,
    deadlineMs,
  } = options;
  const profile = getGridSizeProfile(width, height);
  const startWordCount = placementInputs.length;
  const startCrossings = countGridCrossings(placementInputs);
  const startBlockCount = blockedCells.length;

  let currentPlaced = [...placed];
  let currentInputs = [...placementInputs];
  let currentBlocks = [...blockedCells];
  const workingIds = new Set(placedIds);

  const removableBlocks = currentBlocks.filter(
    (cell) => !isWordCapBlock(cell, currentInputs),
  );

  const blocksToTry = removableBlocks.slice(0, maxBlockRemovals);

  for (const block of blocksToTry) {
    if (deadlineMs !== undefined && Date.now() >= deadlineMs) {
      break;
    }

    const blockKey = cellKey(block.row, block.col);
    const nextBlocks = currentBlocks.filter(
      (cell) => cellKey(cell.row, cell.col) !== blockKey,
    );
    const capBlocks = proposeWordCapBlocks(currentInputs, width, height).cells;
    const trialBlocks = [...capBlocks];
    const trialBlockKeys = new Set(trialBlocks.map((cell) => cellKey(cell.row, cell.col)));

    for (const cell of nextBlocks) {
      const key = cellKey(cell.row, cell.col);

      if (!trialBlockKeys.has(key)) {
        trialBlocks.push(cell);
        trialBlockKeys.add(key);
      }
    }

    const trialIds = new Set(workingIds);
    const trialInputs = [...currentInputs];
    const trialPlaced = [...currentPlaced];

    const crossingAdds = tryPlaceAdditionalCrossings({
      pool,
      placementInputs: trialInputs,
      placedIds: trialIds,
      blockedCells: capBlocks,
      profile,
      width,
      height,
      themeSelected,
      maxAdds: 3,
    });

    for (const add of crossingAdds) {
      trialInputs.push(add.placement);
      trialIds.add(add.candidate.id);
      trialPlaced.push(buildPlacedEntryFromCandidate(add.candidate, add.placement));
    }

    const gapFill = fillGapSlots({
      pool,
      placedIds: trialIds,
      existing: trialInputs,
      blockedCells: capBlocks,
      width,
      height,
      scoreCandidate: (candidate, slotLength) =>
        scoreWordCandidate({
          candidate,
          profile,
          placedLengths: trialInputs.map((entry) => getAnswerLength(entry.answerSnapshot)),
          letterFrequency: buildLetterFrequency(trialInputs),
          themeSelected,
          phase: "gap",
          slotLength,
        }),
      onReject: () => {},
    });

    for (const fill of gapFill.placements) {
      const fullCandidate = pool.find((item) => item.id === fill.candidate.id);

      if (!fullCandidate || trialIds.has(fullCandidate.id)) {
        continue;
      }

      trialInputs.push(fill.placement);
      trialIds.add(fullCandidate.id);
      trialPlaced.push(buildPlacedEntryFromCandidate(fullCandidate, fill.placement));
    }

    const finalized = finalizeBlockedCells(trialInputs, capBlocks, width, height);
    const validation = validateFinalGrid({
      entries: trialInputs,
      blockedCells: finalized.cells,
      width,
      height,
    });

    if (!validation.ok) {
      continue;
    }

    const nextCrossings = countGridCrossings(trialInputs);
    const improved =
      trialInputs.length > currentInputs.length ||
      nextCrossings > countGridCrossings(currentInputs) ||
      finalized.cells.length < currentBlocks.length;

    if (!improved) {
      continue;
    }

    currentInputs = trialInputs;
    currentPlaced = trialPlaced;
    currentBlocks = finalized.cells;

    for (const id of trialIds) {
      workingIds.add(id);
    }
  }

  const improvement: OptimizationImprovement = {
    wordsAdded: currentInputs.length - startWordCount,
    blocksRemoved: Math.max(0, startBlockCount - currentBlocks.length),
    crossingsAdded: countGridCrossings(currentInputs) - startCrossings,
  };

  const finalValidation = validateFinalGrid({
    entries: currentInputs,
    blockedCells: currentBlocks,
    width,
    height,
  });

  return {
    placed: currentPlaced,
    placementInputs: currentInputs,
    blockedCells: currentBlocks,
    improvement,
    finalValidationOk: finalValidation.ok,
  };
}

export function formatOptimizationImprovement(improvement: OptimizationImprovement) {
  const parts: string[] = [];

  if (improvement.wordsAdded > 0) {
    parts.push(`+${improvement.wordsAdded} ord`);
  }

  if (improvement.blocksRemoved > 0) {
    parts.push(`-${improvement.blocksRemoved} blockrutor`);
  }

  if (improvement.crossingsAdded > 0) {
    parts.push(`+${improvement.crossingsAdded} korsningar`);
  }

  if (parts.length === 0) {
    return "Inga förbättringar";
  }

  return parts.join(", ");
}
