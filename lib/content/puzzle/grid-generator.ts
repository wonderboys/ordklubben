import type { PuzzleDirection } from '@prisma/client';
import { getAnswerLength, type PuzzlePlacementInput } from '@/lib/content/puzzle/grid';
import {
  computeGridUtilization,
  countGridCrossings,
  finalizeBlockedCells,
  proposeWordCapBlocks,
  type BlockedCell,
} from '@/lib/content/puzzle/grid-generator-blocks';
import { fillGapSlots } from '@/lib/content/puzzle/grid-generator-gaps';
import {
  formatOptimizationImprovement,
  optimizeGridLayout,
} from '@/lib/content/puzzle/grid-generator-optimize';
import {
  scoreGridAttempt,
  compareGridAttempts,
} from '@/lib/content/puzzle/grid-generator-result-scoring';
import { computeThemeMetrics } from '@/lib/content/puzzle/grid-generator-quality';
import {
  buildCandidatePool,
  buildLetterFrequency,
  combineWordAndPlacementScore,
  comparePlacements,
  computeWordLengthStats,
  getAnswerLetters,
  getGridSizeProfile,
  getLengthBucket,
  isLongPlacementViable,
  scorePlacement,
  scoreWordCandidate,
  type GridSizeProfile,
  type ScoredPlacement,
  type WordLengthStats,
} from '@/lib/content/puzzle/grid-generator-scoring';
import {
  validateFinalGrid,
  validateGeneratorPlacement,
} from '@/lib/content/puzzle/grid-generator-validation';

export type GeneratorCandidate = {
  id: string;
  answer: string;
  hasThemeMatch?: boolean;
  hints: Array<{
    id: string;
    text: string;
    status: 'DRAFT' | 'APPROVED';
  }>;
};

export type GeneratorPlacedEntry = {
  wordId: string;
  answerSnapshot: string;
  row: number;
  col: number;
  direction: PuzzleDirection;
  hintId: string | null;
  hintSnapshot: string | null;
};

export type GeneratorResult = {
  placed: GeneratorPlacedEntry[];
  blockedCells: BlockedCell[];
  candidateCount: number;
  failedCount: number;
  skippedCount: number;
  rejectedCollisions: number;
  rejectedSideWords: number;
  rejectedBlockPatterns: number;
  letterCellCount: number;
  utilizationRate: number;
  crossingCount: number;
  attemptCount: number;
  bestScore: number;
  shortWordCount: number;
  mediumWordCount: number;
  longWordCount: number;
  longestWord: number;
  averageWordLength: number;
  blockRatio: number;
  gapsFilled: number;
  openConnections: number;
  blockClusters: number;
  isolatedRegions: number;
  optimizationImprovements: string | null;
  emptyCellsBlocked: number;
  remainingEmptyCount: number;
  finalValidationOk: boolean;
  themeScore: number;
  themeHitCount: number;
  emergencyWordCount: number;
  summaryNote: string | null;
};

type RejectionCounters = {
  rejectedCollisions: number;
  rejectedSideWords: number;
  rejectedBlockPatterns: number;
};

type SingleAttemptResult = {
  placed: GeneratorPlacedEntry[];
  placementInputs: PuzzlePlacementInput[];
  blockedCells: BlockedCell[];
  skippedCount: number;
  counters: RejectionCounters;
  score: ReturnType<typeof scoreGridAttempt>;
  wordLengthStats: WordLengthStats;
  blockRatio: number;
  gapsFilled: number;
  emptyCellsBlocked: number;
  remainingEmptyCount: number;
  finalValidationOk: boolean;
};

function createRng(seed: number) {
  let state = seed | 0;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(items: T[], rng: () => number) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swapIndex] ?? current;
    copy[swapIndex] = current;
  }

  return copy;
}

/** Hard upper cap — actual attempts stop earlier on time budget or quality target. */
function computeMaxAttemptCount(width: number, height: number) {
  const size = Math.max(width, height);

  if (size <= 5) {
    return 120;
  }

  if (size <= 7) {
    return 200;
  }

  if (size <= 9) {
    return 350;
  }

  return 500;
}

const GENERATION_TIME_BUDGET_MS = 14_000;
const OPTIMIZATION_TIME_BUDGET_MS = 3_000;

function meetsQualityTarget(result: SingleAttemptResult, profile: GridSizeProfile) {
  return (
    result.placed.length >= profile.targetWordMin &&
    result.score.crossingCount >= profile.targetCrossingMin &&
    result.score.blockRatio <= profile.blockRatioMax
  );
}

function crossingCandidateLimit(width: number, height: number) {
  const size = Math.max(width, height);

  if (size <= 7) {
    return 36;
  }

  if (size <= 9) {
    return 32;
  }

  return 22;
}

function recordRejection(counters: RejectionCounters, validation: { ok: false; reason: string }) {
  if (validation.reason === 'side_word') {
    counters.rejectedSideWords += 1;
  } else {
    counters.rejectedCollisions += 1;
  }
}

function pickHint(hints: GeneratorCandidate['hints'], allowDraftHints: boolean, rng: () => number) {
  const approved = hints.filter((hint) => hint.status === 'APPROVED');

  if (approved.length > 0) {
    return approved[Math.floor(rng() * approved.length)] ?? null;
  }

  if (!allowDraftHints) {
    return null;
  }

  const draft = hints.filter((hint) => hint.status === 'DRAFT');

  if (draft.length === 0) {
    return null;
  }

  return draft[Math.floor(rng() * draft.length)] ?? null;
}

function buildPlacedEntry(
  candidate: GeneratorCandidate,
  placement: PuzzlePlacementInput,
  allowDraftHints: boolean,
  rng: () => number,
): GeneratorPlacedEntry {
  const hint = pickHint(candidate.hints, allowDraftHints, rng);

  return {
    wordId: candidate.id,
    answerSnapshot: candidate.answer,
    row: placement.row,
    col: placement.col,
    direction: placement.direction,
    hintId: hint?.id ?? null,
    hintSnapshot: hint?.text ?? null,
  };
}

function constructionBlockedCells(entries: PuzzlePlacementInput[], width: number, height: number) {
  return proposeWordCapBlocks(entries, width, height).cells;
}

function findCrossingPlacements(
  candidate: GeneratorCandidate,
  existing: PuzzlePlacementInput[],
  blockedCells: BlockedCell[],
  width: number,
  height: number,
  counters: RejectionCounters,
  themeSelected: boolean,
  profile: GridSizeProfile,
) {
  const candidateLetters = getAnswerLetters(candidate.answer);
  const options: ScoredPlacement[] = [];

  for (const placed of existing) {
    const placedLetters = getAnswerLetters(placed.answerSnapshot);

    for (let candidateIndex = 0; candidateIndex < candidateLetters.length; candidateIndex += 1) {
      for (let placedIndex = 0; placedIndex < placedLetters.length; placedIndex += 1) {
        if (candidateLetters[candidateIndex] !== placedLetters[placedIndex]) {
          continue;
        }

        const crossingOptions: PuzzlePlacementInput[] =
          placed.direction === 'ACROSS'
            ? [
                {
                  answerSnapshot: candidate.answer,
                  row: placed.row - candidateIndex,
                  col: placed.col + placedIndex,
                  direction: 'DOWN',
                },
              ]
            : [
                {
                  answerSnapshot: candidate.answer,
                  row: placed.row + placedIndex,
                  col: placed.col - candidateIndex,
                  direction: 'ACROSS',
                },
              ];

        for (const placement of crossingOptions) {
          const validation = validateGeneratorPlacement({
            placement,
            existing,
            blockedCells,
            width,
            height,
          });

          if (!validation.ok) {
            recordRejection(counters, validation);
            continue;
          }

          const scored = scorePlacement(placement, existing, width, height, blockedCells, {
            themeSelected,
            hasThemeMatch: candidate.hasThemeMatch ?? false,
            phase: 'crossing',
            profile,
          });

          if (!isLongPlacementViable(placement, scored, profile)) {
            continue;
          }

          options.push(scored);
        }
      }
    }
  }

  return options;
}

function placeAnchorWord(
  candidates: GeneratorCandidate[],
  profile: GridSizeProfile,
  width: number,
  height: number,
  counters: RejectionCounters,
  rng: () => number,
  themeSelected: boolean,
) {
  const middleRow = Math.floor(height / 2);
  const rowOptions = [middleRow, middleRow - 1, middleRow + 1].filter(
    (row) => row >= 0 && row < height,
  );

  const anchorCandidates = candidates.filter((candidate) => {
    const length = getAnswerLength(candidate.answer);
    return length >= profile.anchorMin && length <= Math.min(profile.anchorMax, width);
  });
  const fallbackCandidates = candidates.filter((candidate) => {
    const length = getAnswerLength(candidate.answer);
    return length >= profile.mediumMin && length <= Math.min(profile.mediumMax, width);
  });

  for (const pool of [anchorCandidates, fallbackCandidates]) {
    if (pool.length === 0) {
      continue;
    }

    const ranked = [...pool].sort(
      (left, right) =>
        scoreWordCandidate({
          candidate: right,
          profile,
          placedLengths: [],
          letterFrequency: new Map(),
          themeSelected,
          phase: 'anchor',
        }) -
        scoreWordCandidate({
          candidate: left,
          profile,
          placedLengths: [],
          letterFrequency: new Map(),
          themeSelected,
          phase: 'anchor',
        }),
    );

    const shortlist = shuffleWithRng(ranked.slice(0, 10), rng);

    for (const candidate of shortlist) {
      const length = getAnswerLength(candidate.answer);

      if (length > width) {
        continue;
      }

      const shuffledRows = shuffleWithRng(rowOptions, rng);

      for (const row of shuffledRows) {
        const col = Math.floor((width - length) / 2) + (rng() > 0.7 ? (rng() > 0.5 ? 1 : -1) : 0);
        const placement: PuzzlePlacementInput = {
          answerSnapshot: candidate.answer,
          row,
          col: Math.max(0, Math.min(col, width - length)),
          direction: 'ACROSS',
        };

        const validation = validateGeneratorPlacement({
          placement,
          existing: [],
          blockedCells: [],
          width,
          height,
        });

        if (validation.ok) {
          return { candidate, placement };
        }

        recordRejection(counters, validation);
      }
    }
  }

  return null;
}

function placeCrossingWords(options: {
  pool: GeneratorCandidate[];
  profile: GridSizeProfile;
  placementInputs: PuzzlePlacementInput[];
  placedEntries: GeneratorPlacedEntry[];
  placedIds: Set<string>;
  placedLengths: number[];
  width: number;
  height: number;
  wordCount: number;
  allowDraftHints: boolean;
  themeSelected: boolean;
  counters: RejectionCounters;
  rng: () => number;
}) {
  const {
    pool,
    profile,
    placementInputs,
    placedEntries,
    placedIds,
    placedLengths,
    width,
    height,
    wordCount,
    allowDraftHints,
    themeSelected,
    counters,
    rng,
  } = options;
  let skippedCount = 0;

  while (placedEntries.length < wordCount) {
    const blockedCells = constructionBlockedCells(placementInputs, width, height);
    const letterFrequency = buildLetterFrequency(placementInputs);
    const longCount = placedLengths.filter(
      (value) => getLengthBucket(value, profile) === 'long',
    ).length;
    const rankedCandidates = pool
      .filter((candidate) => !placedIds.has(candidate.id))
      .filter((candidate) => {
        if (longCount < profile.targetLongMax) {
          return true;
        }

        return getLengthBucket(getAnswerLength(candidate.answer), profile) !== 'long';
      })
      .map((candidate) => ({
        candidate,
        score: scoreWordCandidate({
          candidate,
          profile,
          placedLengths,
          letterFrequency,
          themeSelected,
          phase: 'crossing',
        }),
      }))
      .sort((left, right) => right.score - left.score);

    let bestChoice: {
      candidate: GeneratorCandidate;
      placement: PuzzlePlacementInput;
      scored: ScoredPlacement;
      wordScore: number;
    } | null = null;

    const candidateSlice = shuffleWithRng(
      rankedCandidates.slice(0, crossingCandidateLimit(width, height)),
      rng,
    );

    for (const { candidate, score: wordScore } of candidateSlice) {
      const placementOptions = findCrossingPlacements(
        candidate,
        placementInputs,
        blockedCells,
        width,
        height,
        counters,
        themeSelected,
        profile,
      ).sort((left, right) => comparePlacements(left, right, placementInputs));

      const bestPlacement = placementOptions[0];

      if (!bestPlacement || bestPlacement.crossings === 0) {
        continue;
      }

      const combinedScore = combineWordAndPlacementScore(wordScore, bestPlacement.totalScore);
      const bestCombinedScore = bestChoice
        ? combineWordAndPlacementScore(bestChoice.wordScore, bestChoice.scored.totalScore)
        : Number.NEGATIVE_INFINITY;

      if (
        !bestChoice ||
        combinedScore > bestCombinedScore ||
        (combinedScore === bestCombinedScore &&
          comparePlacements(bestPlacement, bestChoice.scored, placementInputs) < 0)
      ) {
        bestChoice = {
          candidate,
          placement: bestPlacement.placement,
          scored: bestPlacement,
          wordScore,
        };
      }
    }

    if (!bestChoice) {
      skippedCount += rankedCandidates.length;
      break;
    }

    placedEntries.push(
      buildPlacedEntry(bestChoice.candidate, bestChoice.placement, allowDraftHints, rng),
    );
    placedIds.add(bestChoice.candidate.id);
    placementInputs.push(bestChoice.placement);
    placedLengths.push(getAnswerLength(bestChoice.candidate.answer));
  }

  return skippedCount;
}

function runGapFillPass(options: {
  pool: GeneratorCandidate[];
  profile: GridSizeProfile;
  placementInputs: PuzzlePlacementInput[];
  placedEntries: GeneratorPlacedEntry[];
  placedIds: Set<string>;
  placedLengths: number[];
  width: number;
  height: number;
  allowDraftHints: boolean;
  themeSelected: boolean;
  counters: RejectionCounters;
  rng: () => number;
}) {
  const {
    pool,
    profile,
    placementInputs,
    placedEntries,
    placedIds,
    placedLengths,
    width,
    height,
    allowDraftHints,
    themeSelected,
    counters,
    rng,
  } = options;
  const capBlocks = constructionBlockedCells(placementInputs, width, height);
  const gapFill = fillGapSlots({
    pool,
    placedIds,
    existing: placementInputs,
    blockedCells: capBlocks,
    width,
    height,
    scoreCandidate: (candidate, slotLength) =>
      scoreWordCandidate({
        candidate,
        profile,
        placedLengths: placementInputs.map((entry) => getAnswerLength(entry.answerSnapshot)),
        letterFrequency: buildLetterFrequency(placementInputs),
        themeSelected,
        phase: 'gap',
        slotLength,
      }),
    onReject: (validation) => recordRejection(counters, validation),
  });

  for (const fill of gapFill.placements) {
    const fullCandidate = pool.find((item) => item.id === fill.candidate.id);

    if (!fullCandidate) {
      continue;
    }

    placedEntries.push(buildPlacedEntry(fullCandidate, fill.placement, allowDraftHints, rng));
    placementInputs.push(fill.placement);
    placedLengths.push(getAnswerLength(fill.candidate.answer));
  }

  return gapFill.filledCount;
}

function expandGridLayout(options: {
  pool: GeneratorCandidate[];
  profile: GridSizeProfile;
  placementInputs: PuzzlePlacementInput[];
  placedEntries: GeneratorPlacedEntry[];
  placedIds: Set<string>;
  placedLengths: number[];
  width: number;
  height: number;
  wordCount: number;
  allowDraftHints: boolean;
  themeSelected: boolean;
  counters: RejectionCounters;
  rng: () => number;
}) {
  let skippedCount = 0;
  let gapsFilled = 0;

  skippedCount += placeCrossingWords(options);
  gapsFilled += runGapFillPass(options);
  skippedCount += placeCrossingWords(options);
  gapsFilled += runGapFillPass(options);

  return { skippedCount, gapsFilled };
}

function buildThemeMetricsFromPlaced(
  placed: GeneratorPlacedEntry[],
  pool: GeneratorCandidate[],
  themeSelected: boolean,
) {
  const poolById = new Map(pool.map((candidate) => [candidate.id, candidate]));

  return computeThemeMetrics({
    answers: placed.map((entry) => entry.answerSnapshot),
    themeMatches: placed.map((entry) => poolById.get(entry.wordId)?.hasThemeMatch ?? false),
    themeSelected,
  });
}

function buildSummaryNote(options: {
  placedCount: number;
  targetCount: number;
  attemptCount: number;
  bestScore: number;
  wordLengthStats: WordLengthStats;
  blockRatio: number;
  gapsFilled: number;
  emptyCellsBlocked: number;
  remainingEmptyCount: number;
  finalValidationOk: boolean;
  blockedCount: number;
  letterCellCount: number;
  totalCells: number;
  utilizationRate: number;
  crossingCount: number;
  openConnections: number;
  blockClusters: number;
  isolatedRegions: number;
  optimizationImprovements: string | null;
  rejectedCollisions: number;
  rejectedSideWords: number;
  rejectedBlockPatterns: number;
  themeHitCount: number;
  emergencyWordCount: number;
  themeScore: number;
}) {
  const utilizationPercent = Math.round(options.utilizationRate * 100);
  const blockPercent = Math.round(options.blockRatio * 100);
  const avgLength = options.wordLengthStats.averageWordLength.toFixed(1);
  const parts = [
    `${options.placedCount} ord efter ${options.attemptCount} försök (score ${Math.round(options.bestScore)}).`,
    `Längsta ${options.wordLengthStats.longestWord}, snitt ${avgLength} — korta ${options.wordLengthStats.shortCount}, mellan ${options.wordLengthStats.mediumCount}, långa ${options.wordLengthStats.longCount}.`,
    `Tematräffar ${options.themeHitCount}, temapoäng ${Math.round(options.themeScore)}, nödord ${options.emergencyWordCount}.`,
    `${options.gapsFilled} luckor fyllda, ${blockPercent} % stopprutor, ${utilizationPercent} % bokstäver, ${options.crossingCount} korsningar.`,
    `Öppna anslutningar: ${options.openConnections}, blockkluster: ${options.blockClusters}, isolerade regioner: ${options.isolatedRegions}${options.optimizationImprovements ? `, optimering: ${options.optimizationImprovements}` : ''}.`,
    `Slutvalidering: ${options.finalValidationOk ? 'OK' : 'FAILED'}${options.remainingEmptyCount > 0 ? ` (${options.remainingEmptyCount} tomrutor i ytterkant)` : ''}.`,
  ];

  if (
    options.rejectedCollisions > 0 ||
    options.rejectedSideWords > 0 ||
    options.rejectedBlockPatterns > 0
  ) {
    parts.push(
      `${options.rejectedCollisions} avvisade pga krock, ${options.rejectedSideWords} pga sidord, ${options.rejectedBlockPatterns} pga blockmönster.`,
    );
  }

  return parts.join(' ');
}

function runSingleAttempt(options: {
  pool: GeneratorCandidate[];
  profile: GridSizeProfile;
  width: number;
  height: number;
  wordCount: number;
  allowDraftHints: boolean;
  themeSelected: boolean;
  seed: number;
}): SingleAttemptResult | null {
  const { pool, profile, width, height, wordCount, allowDraftHints, themeSelected, seed } = options;
  const rng = createRng(seed);
  const counters: RejectionCounters = {
    rejectedCollisions: 0,
    rejectedSideWords: 0,
    rejectedBlockPatterns: 0,
  };
  const shuffledPool = shuffleWithRng(pool, rng);
  const placedEntries: GeneratorPlacedEntry[] = [];
  const placedIds = new Set<string>();
  const placementInputs: PuzzlePlacementInput[] = [];
  const placedLengths: number[] = [];

  const anchor = placeAnchorWord(
    shuffledPool,
    profile,
    width,
    height,
    counters,
    rng,
    themeSelected,
  );

  if (!anchor) {
    return null;
  }

  placedEntries.push(buildPlacedEntry(anchor.candidate, anchor.placement, allowDraftHints, rng));
  placedIds.add(anchor.candidate.id);
  placementInputs.push(anchor.placement);
  placedLengths.push(getAnswerLength(anchor.candidate.answer));

  const expansion = expandGridLayout({
    pool: shuffledPool,
    profile,
    placementInputs,
    placedEntries,
    placedIds,
    placedLengths,
    width,
    height,
    wordCount,
    allowDraftHints,
    themeSelected,
    counters,
    rng,
  });

  const capBlocks = proposeWordCapBlocks(placementInputs, width, height);
  const finalized = finalizeBlockedCells(placementInputs, capBlocks.cells, width, height);
  counters.rejectedBlockPatterns += finalized.rejectedBlockPatterns;

  const finalValidation = validateFinalGrid({
    entries: placementInputs,
    blockedCells: finalized.cells,
    width,
    height,
  });

  const attemptThemeMetrics = buildThemeMetricsFromPlaced(placedEntries, pool, themeSelected);
  const score = scoreGridAttempt({
    entries: placementInputs,
    blockedCells: finalized.cells,
    width,
    height,
    profile,
    gapsFilled: expansion.gapsFilled,
    emptyCellsBlocked: finalized.blockedEmptyCount,
    remainingEmptyCount: finalized.remainingEmptyCount,
    finalValidationOk: finalValidation.ok,
    themeSelected,
    themeHitCount: attemptThemeMetrics.themeHitCount,
    emergencyWordCount: attemptThemeMetrics.emergencyWordCount,
  });

  if (!finalValidation.ok) {
    return null;
  }

  const wordLengthStats = computeWordLengthStats(placementInputs, profile);

  return {
    placed: placedEntries,
    placementInputs,
    blockedCells: finalized.cells,
    skippedCount: expansion.skippedCount,
    counters,
    score,
    wordLengthStats,
    blockRatio: score.blockRatio,
    gapsFilled: expansion.gapsFilled,
    emptyCellsBlocked: finalized.blockedEmptyCount,
    remainingEmptyCount: finalized.remainingEmptyCount,
    finalValidationOk: true,
  };
}

function emptyResult(summaryNote: string, candidateCount: number): GeneratorResult {
  return {
    placed: [],
    blockedCells: [],
    candidateCount,
    failedCount: candidateCount,
    skippedCount: 0,
    rejectedCollisions: 0,
    rejectedSideWords: 0,
    rejectedBlockPatterns: 0,
    letterCellCount: 0,
    utilizationRate: 0,
    crossingCount: 0,
    attemptCount: 0,
    bestScore: 0,
    shortWordCount: 0,
    mediumWordCount: 0,
    longWordCount: 0,
    longestWord: 0,
    averageWordLength: 0,
    blockRatio: 0,
    gapsFilled: 0,
    openConnections: 0,
    blockClusters: 0,
    isolatedRegions: 0,
    optimizationImprovements: null,
    emptyCellsBlocked: 0,
    remainingEmptyCount: 0,
    finalValidationOk: false,
    themeScore: 0,
    themeHitCount: 0,
    emergencyWordCount: 0,
    summaryNote,
  };
}

export function generateGridLayout(options: {
  candidates: GeneratorCandidate[];
  width: number;
  height: number;
  wordCount: number;
  allowDraftHints: boolean;
  themeSelected?: boolean;
}): GeneratorResult {
  const { candidates, width, height, wordCount, allowDraftHints, themeSelected = false } = options;
  const profile = getGridSizeProfile(width, height);
  const gridLimit = Math.max(width, height);
  const pool = buildCandidatePool(candidates, profile, gridLimit);
  const candidateCount = pool.length;
  const maxAttempts = computeMaxAttemptCount(width, height);
  const deadline = Date.now() + GENERATION_TIME_BUDGET_MS;
  const targetWordCount = Math.min(wordCount, profile.targetWordMax);

  if (candidateCount === 0) {
    return emptyResult(
      'Inga ord matchade längd- och kvalitetskraven för rutnätet.',
      candidates.length,
    );
  }

  let bestAttempt: SingleAttemptResult | null = null;
  let attemptsRun = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (Date.now() >= deadline) {
      break;
    }

    const result = runSingleAttempt({
      pool,
      profile,
      width,
      height,
      wordCount: targetWordCount,
      allowDraftHints,
      themeSelected,
      seed: attempt + 1,
    });
    attemptsRun += 1;

    if (!result) {
      continue;
    }

    if (
      !bestAttempt ||
      compareGridAttempts(result.score, bestAttempt.score) < 0 ||
      (compareGridAttempts(result.score, bestAttempt.score) === 0 &&
        result.placed.length > bestAttempt.placed.length)
    ) {
      bestAttempt = result;
    }

    if (bestAttempt && meetsQualityTarget(bestAttempt, profile)) {
      break;
    }
  }

  if (!bestAttempt || bestAttempt.placed.length === 0) {
    return emptyResult(
      'Ingen giltig fläta kunde skapas. Prova fler kandidater eller tillåt utkast.',
      candidateCount,
    );
  }

  const placedIds = new Set(bestAttempt.placed.map((entry) => entry.wordId));
  const optimized = optimizeGridLayout({
    pool,
    placed: bestAttempt.placed,
    placementInputs: bestAttempt.placementInputs,
    blockedCells: bestAttempt.blockedCells,
    width,
    height,
    themeSelected,
    placedIds,
    deadlineMs: Date.now() + OPTIMIZATION_TIME_BUDGET_MS,
    maxBlockRemovals: Math.max(6, Math.floor(Math.max(width, height) * 0.8)),
  });

  const hintByWordId = new Map(bestAttempt.placed.map((entry) => [entry.wordId, entry]));
  const optimizedPlaced = optimized.placed.map((entry) => {
    const existing = hintByWordId.get(entry.wordId);

    if (existing) {
      return existing;
    }

    const candidate = pool.find((item) => item.id === entry.wordId);

    if (!candidate) {
      return entry;
    }

    return buildPlacedEntry(
      candidate,
      {
        answerSnapshot: entry.answerSnapshot,
        row: entry.row,
        col: entry.col,
        direction: entry.direction,
      },
      allowDraftHints,
      createRng(entry.wordId.length + entry.row + entry.col),
    );
  });

  const finalPlacementInputs = optimized.placementInputs;
  const finalBlockedCells = optimized.blockedCells;
  const finalThemeMetrics = buildThemeMetricsFromPlaced(optimizedPlaced, pool, themeSelected);
  const finalScore = scoreGridAttempt({
    entries: finalPlacementInputs,
    blockedCells: finalBlockedCells,
    width,
    height,
    profile,
    gapsFilled: bestAttempt.gapsFilled,
    emptyCellsBlocked: bestAttempt.emptyCellsBlocked,
    remainingEmptyCount: bestAttempt.remainingEmptyCount,
    finalValidationOk: optimized.finalValidationOk,
    themeSelected,
    themeHitCount: finalThemeMetrics.themeHitCount,
    emergencyWordCount: finalThemeMetrics.emergencyWordCount,
  });
  const wordLengthStats = computeWordLengthStats(finalPlacementInputs, profile);
  const utilization = computeGridUtilization(finalPlacementInputs, width, height);
  const crossingCount = countGridCrossings(finalPlacementInputs);
  const aggregatedCounters = bestAttempt.counters;
  const optimizationImprovements = formatOptimizationImprovement(optimized.improvement);

  return {
    placed: optimizedPlaced,
    blockedCells: finalBlockedCells,
    candidateCount,
    failedCount: candidateCount - optimizedPlaced.length,
    skippedCount: bestAttempt.skippedCount,
    rejectedCollisions: aggregatedCounters.rejectedCollisions,
    rejectedSideWords: aggregatedCounters.rejectedSideWords,
    rejectedBlockPatterns: aggregatedCounters.rejectedBlockPatterns,
    letterCellCount: utilization.letterCells,
    utilizationRate: utilization.rate,
    crossingCount,
    attemptCount: attemptsRun,
    bestScore: finalScore.total,
    shortWordCount: wordLengthStats.shortCount,
    mediumWordCount: wordLengthStats.mediumCount,
    longWordCount: wordLengthStats.longCount,
    longestWord: wordLengthStats.longestWord,
    averageWordLength: wordLengthStats.averageWordLength,
    blockRatio: finalScore.blockRatio,
    gapsFilled: bestAttempt.gapsFilled,
    openConnections: finalScore.openConnections,
    blockClusters: finalScore.blockClusters,
    isolatedRegions: finalScore.isolatedRegions,
    optimizationImprovements,
    emptyCellsBlocked: bestAttempt.emptyCellsBlocked,
    remainingEmptyCount: bestAttempt.remainingEmptyCount,
    finalValidationOk: optimized.finalValidationOk,
    themeScore: finalThemeMetrics.themeScore,
    themeHitCount: finalThemeMetrics.themeHitCount,
    emergencyWordCount: finalThemeMetrics.emergencyWordCount,
    summaryNote: buildSummaryNote({
      placedCount: optimizedPlaced.length,
      targetCount: targetWordCount,
      attemptCount: attemptsRun,
      bestScore: finalScore.total,
      wordLengthStats,
      blockRatio: finalScore.blockRatio,
      gapsFilled: bestAttempt.gapsFilled,
      emptyCellsBlocked: bestAttempt.emptyCellsBlocked,
      remainingEmptyCount: bestAttempt.remainingEmptyCount,
      finalValidationOk: optimized.finalValidationOk,
      blockedCount: finalBlockedCells.length,
      letterCellCount: utilization.letterCells,
      totalCells: utilization.totalCells,
      utilizationRate: utilization.rate,
      crossingCount,
      openConnections: finalScore.openConnections,
      blockClusters: finalScore.blockClusters,
      isolatedRegions: finalScore.isolatedRegions,
      optimizationImprovements,
      rejectedCollisions: aggregatedCounters.rejectedCollisions,
      rejectedSideWords: aggregatedCounters.rejectedSideWords,
      rejectedBlockPatterns: aggregatedCounters.rejectedBlockPatterns,
      themeHitCount: finalThemeMetrics.themeHitCount,
      emergencyWordCount: finalThemeMetrics.emergencyWordCount,
      themeScore: finalThemeMetrics.themeScore,
    }),
  };
}

export { getAnswerLetters };
