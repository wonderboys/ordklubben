import {
  getAnswerLength,
  getPlacementCells,
  type PuzzlePlacementInput,
} from '@/lib/content/puzzle/grid';
import { computeOpenConnectionDelta } from '@/lib/content/puzzle/grid-generator-connectivity';
import type { BlockedCell } from '@/lib/content/puzzle/grid-generator-blocks';
import {
  scoreEmergencyWordPenalty,
  scoreThemeWordBonus,
  scoreWordLengthBonus,
} from '@/lib/content/puzzle/grid-generator-quality';

const VOWEL_PATTERN = /[AEIOUYÅÄÖ]/u;

export type ScoringWordCandidate = {
  id: string;
  answer: string;
  hasThemeMatch?: boolean;
  hints: Array<{
    id: string;
    text: string;
    status: 'DRAFT' | 'APPROVED';
  }>;
};

export type WordSelectionPhase = 'anchor' | 'crossing' | 'gap';

export type GridSizeProfile = {
  idealMin: number;
  idealMax: number;
  allowMin: number;
  allowMax: number;
  anchorMin: number;
  anchorMax: number;
  firstWordMin: number;
  firstWordMax: number;
  targetWordMin: number;
  targetWordMax: number;
  targetCrossingMin: number;
  utilizationMin: number;
  utilizationMax: number;
  blockRatioMax: number;
  shortMin: number;
  shortMax: number;
  mediumMin: number;
  mediumMax: number;
  longMin: number;
  longMax: number;
  targetLongMin: number;
  targetLongMax: number;
  targetMediumMin: number;
  targetMediumMax: number;
  targetShortMin: number;
  targetShortMax: number;
  longRatioMax: number;
  mediumRatioMin: number;
};

export type WordLengthStats = {
  longestWord: number;
  averageWordLength: number;
  shortCount: number;
  mediumCount: number;
  longCount: number;
};

export function getGridSizeProfile(width: number, height: number): GridSizeProfile {
  const size = Math.max(width, height);

  if (size <= 5) {
    return {
      idealMin: 3,
      idealMax: 5,
      allowMin: 2,
      allowMax: 6,
      anchorMin: 4,
      anchorMax: 5,
      firstWordMin: 4,
      firstWordMax: 5,
      targetWordMin: 4,
      targetWordMax: 8,
      targetCrossingMin: 4,
      utilizationMin: 0.4,
      utilizationMax: 0.65,
      blockRatioMax: 0.55,
      shortMin: 2,
      shortMax: 3,
      mediumMin: 4,
      mediumMax: 5,
      longMin: 6,
      longMax: 6,
      targetLongMin: 0,
      targetLongMax: 1,
      targetMediumMin: 2,
      targetMediumMax: 4,
      targetShortMin: 2,
      targetShortMax: 4,
      longRatioMax: 0.3,
      mediumRatioMin: 0.35,
    };
  }

  if (size <= 7) {
    return {
      idealMin: 4,
      idealMax: 5,
      allowMin: 2,
      allowMax: 7,
      anchorMin: 6,
      anchorMax: 7,
      firstWordMin: 6,
      firstWordMax: 7,
      targetWordMin: 8,
      targetWordMax: 14,
      targetCrossingMin: 8,
      utilizationMin: 0.45,
      utilizationMax: 0.65,
      blockRatioMax: 0.4,
      shortMin: 2,
      shortMax: 3,
      mediumMin: 4,
      mediumMax: 5,
      longMin: 6,
      longMax: 7,
      targetLongMin: 1,
      targetLongMax: 2,
      targetMediumMin: 3,
      targetMediumMax: 6,
      targetShortMin: 2,
      targetShortMax: 5,
      longRatioMax: 0.3,
      mediumRatioMin: 0.4,
    };
  }

  if (size <= 9) {
    return {
      idealMin: 4,
      idealMax: 6,
      allowMin: 2,
      allowMax: 11,
      anchorMin: 6,
      anchorMax: 9,
      firstWordMin: 6,
      firstWordMax: 9,
      targetWordMin: 10,
      targetWordMax: 16,
      targetCrossingMin: 10,
      utilizationMin: 0.5,
      utilizationMax: 0.68,
      blockRatioMax: 0.35,
      shortMin: 2,
      shortMax: 3,
      mediumMin: 4,
      mediumMax: 7,
      longMin: 8,
      longMax: 11,
      targetLongMin: 1,
      targetLongMax: 2,
      targetMediumMin: 4,
      targetMediumMax: 7,
      targetShortMin: 3,
      targetShortMax: 6,
      longRatioMax: 0.3,
      mediumRatioMin: 0.4,
    };
  }

  return {
    idealMin: 4,
    idealMax: 6,
    allowMin: 2,
    allowMax: 11,
    anchorMin: 7,
    anchorMax: 10,
    firstWordMin: 7,
    firstWordMax: 10,
    targetWordMin: 14,
    targetWordMax: 22,
    targetCrossingMin: 14,
    utilizationMin: 0.5,
    utilizationMax: 0.68,
    blockRatioMax: 0.3,
    shortMin: 2,
    shortMax: 3,
    mediumMin: 4,
    mediumMax: 7,
    longMin: 8,
    longMax: 11,
    targetLongMin: 2,
    targetLongMax: 3,
    targetMediumMin: 6,
    targetMediumMax: 10,
    targetShortMin: 4,
    targetShortMax: 8,
    longRatioMax: 0.3,
    mediumRatioMin: 0.4,
  };
}

export function getAnswerLetters(answerSnapshot: string) {
  return answerSnapshot
    .trim()
    .toLocaleUpperCase('sv-SE')
    .replace(/[\s'’\-‐‑‒–—]+/g, '')
    .split('');
}

export function hasVowel(answerSnapshot: string) {
  return VOWEL_PATTERN.test(answerSnapshot.trim().toLocaleUpperCase('sv-SE'));
}

export function buildLetterFrequency(entries: PuzzlePlacementInput[]) {
  const frequency = new Map<string, number>();

  for (const entry of entries) {
    for (const letter of getAnswerLetters(entry.answerSnapshot)) {
      frequency.set(letter, (frequency.get(letter) ?? 0) + 1);
    }
  }

  return frequency;
}

export function countLetterOverlapPotential(
  answerSnapshot: string,
  letterFrequency: Map<string, number>,
) {
  const uniqueLetters = new Set(getAnswerLetters(answerSnapshot));

  let score = 0;

  for (const letter of uniqueLetters) {
    score += letterFrequency.get(letter) ?? 0;
  }

  return score;
}

export function isUsableCandidate(
  candidate: ScoringWordCandidate,
  profile: GridSizeProfile,
  gridLimit: number,
) {
  const length = getAnswerLength(candidate.answer);

  if (length < profile.allowMin || length > Math.min(profile.allowMax, gridLimit)) {
    return false;
  }

  if (length < 2) {
    return false;
  }

  if (!hasVowel(candidate.answer)) {
    return false;
  }

  return true;
}

export function getLengthBucket(length: number, profile: GridSizeProfile) {
  if (length >= profile.longMin && length <= profile.longMax) {
    return 'long' as const;
  }

  if (length >= profile.mediumMin && length <= profile.mediumMax) {
    return 'medium' as const;
  }

  if (length >= profile.shortMin && length <= profile.shortMax) {
    return 'short' as const;
  }

  return 'other' as const;
}

export function computeWordLengthStats(
  entries: PuzzlePlacementInput[],
  profile: GridSizeProfile,
): WordLengthStats {
  if (entries.length === 0) {
    return {
      longestWord: 0,
      averageWordLength: 0,
      shortCount: 0,
      mediumCount: 0,
      longCount: 0,
    };
  }

  const lengths = entries.map((entry) => getAnswerLength(entry.answerSnapshot));
  let shortCount = 0;
  let mediumCount = 0;
  let longCount = 0;

  for (const length of lengths) {
    const bucket = getLengthBucket(length, profile);

    if (bucket === 'short') {
      shortCount += 1;
    } else if (bucket === 'medium') {
      mediumCount += 1;
    } else if (bucket === 'long') {
      longCount += 1;
    }
  }

  return {
    longestWord: Math.max(...lengths),
    averageWordLength: lengths.reduce((sum, value) => sum + value, 0) / lengths.length,
    shortCount,
    mediumCount,
    longCount,
  };
}

export function countShortWords(entries: PuzzlePlacementInput[], profile: GridSizeProfile) {
  return computeWordLengthStats(entries, profile).shortCount;
}

function countBucketInLengths(
  placedLengths: number[],
  profile: GridSizeProfile,
  bucket: 'short' | 'medium' | 'long',
) {
  return placedLengths.filter((length) => getLengthBucket(length, profile) === bucket).length;
}

function isWithinTargetBand(value: number, min: number, max: number) {
  return value >= min && value <= max;
}

export function scoreLengthMix(
  placedLengths: number[],
  length: number,
  profile: GridSizeProfile,
  phase: WordSelectionPhase,
) {
  const nextLengths = [...placedLengths, length];
  const total = nextLengths.length;

  if (total === 0) {
    return 0;
  }

  const shortCount = countBucketInLengths(nextLengths, profile, 'short');
  const mediumCount = countBucketInLengths(nextLengths, profile, 'medium');
  const longCount = countBucketInLengths(nextLengths, profile, 'long');
  const placedLongCount = countBucketInLengths(placedLengths, profile, 'long');
  const shortRate = shortCount / total;
  const mediumRate = mediumCount / total;
  const longRate = longCount / total;
  const bucket = getLengthBucket(length, profile);
  let score = 0;

  if (longRate > profile.longRatioMax) {
    score -= (longRate - profile.longRatioMax) * 320;

    if (bucket === 'long') {
      score -= 55;
    }
  }

  if (mediumRate < profile.mediumRatioMin) {
    score -= (profile.mediumRatioMin - mediumRate) * 240;
  }

  if (
    isWithinTargetBand(longCount, profile.targetLongMin, profile.targetLongMax) &&
    isWithinTargetBand(mediumCount, profile.targetMediumMin, profile.targetMediumMax) &&
    isWithinTargetBand(shortCount, profile.targetShortMin, profile.targetShortMax)
  ) {
    score += 48;
  } else if (
    isWithinTargetBand(longCount, profile.targetLongMin, profile.targetLongMax + 1) &&
    mediumRate >= profile.mediumRatioMin
  ) {
    score += 24;
  }

  if (phase === 'anchor') {
    if (bucket === 'long' && longCount <= profile.targetLongMax) {
      score += 22;
    } else if (bucket === 'medium') {
      score += 28;
    } else if (bucket === 'short') {
      score -= 18;
    }

    if (bucket === 'long' && length >= profile.anchorMax) {
      score -= 20;
    }

    return score;
  }

  if (phase === 'gap') {
    if (bucket === 'short' && shortCount <= profile.targetShortMax) {
      score += 16;
    } else if (bucket === 'medium') {
      score += 20;
    } else if (bucket === 'long') {
      score -= 36;
    }

    return score;
  }

  if (bucket === 'medium') {
    score += 34;
  } else if (bucket === 'short') {
    score += shortCount <= profile.targetShortMax ? 14 : -10;
  } else if (bucket === 'long') {
    if (placedLongCount >= profile.targetLongMax) {
      score -= 85;
    } else if (placedLongCount === 0) {
      score += 6;
    } else {
      score -= 42;
    }
  }

  if (mediumRate >= 0.4 && mediumRate <= 0.55) {
    score += 28;
  }

  if (shortRate > 0.45) {
    score -= (shortRate - 0.45) * 120;
  }

  return score;
}

export function scoreWordCandidate(options: {
  candidate: ScoringWordCandidate;
  profile: GridSizeProfile;
  placedLengths: number[];
  letterFrequency: Map<string, number>;
  themeSelected: boolean;
  phase?: WordSelectionPhase;
  slotLength?: number;
}) {
  const {
    candidate,
    profile,
    placedLengths,
    letterFrequency,
    themeSelected,
    phase = 'crossing',
    slotLength,
  } = options;
  const length = getAnswerLength(candidate.answer);
  const bucket = getLengthBucket(length, profile);
  const longCount = countBucketInLengths(placedLengths, profile, 'long');
  let score = scoreWordLengthBonus(length);

  if (phase === 'anchor') {
    const anchorTarget = (profile.anchorMin + profile.anchorMax) / 2;

    if (length >= profile.anchorMin && length <= profile.anchorMax) {
      score += 52 - Math.abs(length - anchorTarget) * 5;
    } else if (bucket === 'medium') {
      score += 24;
    } else {
      score -= 40;
    }
  } else if (phase === 'crossing') {
    if (bucket === 'long' && longCount >= profile.targetLongMax) {
      score -= 120;
    }
  } else if (phase === 'gap') {
    if (slotLength !== undefined && length === slotLength) {
      score += 44;
    } else if (slotLength !== undefined && length !== slotLength) {
      score -= 24;
    }
  }

  score += scoreLengthMix(placedLengths, length, profile, phase);
  score += countLetterOverlapPotential(candidate.answer, letterFrequency) * 3;
  score += new Set(getAnswerLetters(candidate.answer)).size;
  score += scoreThemeWordBonus(themeSelected, candidate.hasThemeMatch ?? false);
  score += scoreEmergencyWordPenalty(candidate.answer, phase);

  if (candidate.hints.some((hint) => hint.status === 'APPROVED')) {
    score += 10;
  } else if (candidate.hints.length > 0) {
    score += 3;
  }

  const sameLengthCount = placedLengths.filter((value) => value === length).length;
  score -= sameLengthCount * 5;

  return score;
}

export function combineWordAndPlacementScore(wordScore: number, placementScore: number) {
  return placementScore + wordScore * 1.1;
}

export function isLongPlacementViable(
  placement: PuzzlePlacementInput,
  scored: Pick<ScoredPlacement, 'crossings' | 'openConnectionDelta'>,
  profile: GridSizeProfile,
) {
  const length = getAnswerLength(placement.answerSnapshot);

  if (getLengthBucket(length, profile) !== 'long') {
    return true;
  }

  return scored.crossings >= 1 || scored.openConnectionDelta >= 2;
}

export function scoreLengthDistribution(
  stats: WordLengthStats,
  profile: GridSizeProfile,
  wordCount: number,
) {
  if (wordCount === 0) {
    return 0;
  }

  let score = 0;
  const shortRate = stats.shortCount / wordCount;
  const mediumRate = stats.mediumCount / wordCount;
  const longRate = stats.longCount / wordCount;

  if (longRate > profile.longRatioMax) {
    score -= (longRate - profile.longRatioMax) * 420;
  }

  if (mediumRate < profile.mediumRatioMin) {
    score -= (profile.mediumRatioMin - mediumRate) * 360;
  }

  if (
    isWithinTargetBand(stats.longCount, profile.targetLongMin, profile.targetLongMax) &&
    isWithinTargetBand(stats.mediumCount, profile.targetMediumMin, profile.targetMediumMax) &&
    isWithinTargetBand(stats.shortCount, profile.targetShortMin, profile.targetShortMax)
  ) {
    score += 120;
  } else {
    if (isWithinTargetBand(stats.longCount, profile.targetLongMin, profile.targetLongMax + 1)) {
      score += 30;
    } else {
      score -= Math.abs(stats.longCount - profile.targetLongMax) * 28;
    }

    if (isWithinTargetBand(stats.mediumCount, profile.targetMediumMin, profile.targetMediumMax)) {
      score += 45;
    } else {
      score -= Math.abs(stats.mediumCount - profile.targetMediumMax) * 12;
    }

    if (isWithinTargetBand(stats.shortCount, profile.targetShortMin, profile.targetShortMax)) {
      score += 30;
    }
  }

  if (mediumRate >= 0.4 && mediumRate <= 0.55) {
    score += 40;
  }

  if (stats.averageWordLength >= profile.idealMin && stats.averageWordLength <= profile.idealMax) {
    score += 35;
  } else if (stats.averageWordLength > profile.idealMax + 1) {
    score -= (stats.averageWordLength - profile.idealMax - 1) * 35;
  }

  if (shortRate > 0.45) {
    score -= (shortRate - 0.45) * 140;
  }

  return score;
}

export type ScoredPlacement = {
  placement: PuzzlePlacementInput;
  crossings: number;
  centerDistance: number;
  compactness: number;
  utilizationAfter: number;
  directionBalance: number;
  openConnectionDelta: number;
  totalScore: number;
};

function getBoundingBox(keys: Set<string>) {
  let minRow = Number.POSITIVE_INFINITY;
  let maxRow = Number.NEGATIVE_INFINITY;
  let minCol = Number.POSITIVE_INFINITY;
  let maxCol = Number.NEGATIVE_INFINITY;

  for (const key of keys) {
    const [row, col] = key.split(':').map(Number);
    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
  }

  if (keys.size === 0) {
    return { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0, area: 0 };
  }

  const area = (maxRow - minRow + 1) * (maxCol - minCol + 1);

  return { minRow, maxRow, minCol, maxCol, area };
}

export function computeLayoutCompactness(entries: PuzzlePlacementInput[]) {
  const keys = occupiedCellKeys(entries);
  return getBoundingBox(keys).area;
}

function occupiedCellKeys(entries: PuzzlePlacementInput[]) {
  return new Set(
    entries.flatMap((entry) => getPlacementCells(entry).map((cell) => `${cell.row}:${cell.col}`)),
  );
}

export function scorePlacement(
  placement: PuzzlePlacementInput,
  existing: PuzzlePlacementInput[],
  width: number,
  height: number,
  blockedCells: BlockedCell[] = [],
  options?: {
    themeSelected?: boolean;
    hasThemeMatch?: boolean;
    phase?: WordSelectionPhase;
    profile?: GridSizeProfile;
  },
): ScoredPlacement {
  const existingKeys = occupiedCellKeys(existing);
  const newCells = getPlacementCells(placement);
  const combinedKeys = new Set(existingKeys);

  let crossings = 0;

  for (const cell of newCells) {
    const key = `${cell.row}:${cell.col}`;

    if (existingKeys.has(key)) {
      crossings += 1;
    }

    combinedKeys.add(key);
  }

  const bbox = getBoundingBox(combinedKeys);
  const compactness = bbox.area;
  const totalCells = width * height;
  const utilizationAfter = combinedKeys.size / totalCells;

  const centerRow = (height - 1) / 2;
  const centerCol = (width - 1) / 2;
  const centerDistance = Math.abs(placement.row - centerRow) + Math.abs(placement.col - centerCol);

  const acrossCount = existing.filter((entry) => entry.direction === 'ACROSS').length;
  const downCount = existing.filter((entry) => entry.direction === 'DOWN').length;
  let directionBalance = 0;

  if (placement.direction === 'ACROSS' && downCount > acrossCount) {
    directionBalance += 8;
  } else if (placement.direction === 'DOWN' && acrossCount > downCount) {
    directionBalance += 8;
  } else if (placement.direction === 'ACROSS' && acrossCount > downCount) {
    directionBalance -= 4;
  } else if (placement.direction === 'DOWN' && downCount > acrossCount) {
    directionBalance -= 4;
  }

  const openConnectionDelta = computeOpenConnectionDelta(
    placement,
    existing,
    blockedCells,
    width,
    height,
  );
  const wordLength = getAnswerLength(placement.answerSnapshot);
  const phase = options?.phase ?? 'crossing';
  const profile = options?.profile;
  const bucket = profile ? getLengthBucket(wordLength, profile) : 'other';
  const wordQuality =
    scoreThemeWordBonus(options?.themeSelected ?? false, options?.hasThemeMatch ?? false) * 0.45 +
    scoreEmergencyWordPenalty(placement.answerSnapshot, phase) * 0.5;
  const newLetterCells = newCells.filter(
    (cell) => !existingKeys.has(`${cell.row}:${cell.col}`),
  ).length;
  let longPlacementPenalty = 0;

  if (profile && bucket === 'long') {
    if (crossings < 1 && openConnectionDelta < 2) {
      longPlacementPenalty += 200;
    } else if (crossings < 2 && openConnectionDelta < 3) {
      longPlacementPenalty += 90;
    }

    longPlacementPenalty += Math.max(0, wordLength - profile.mediumMax) * 8;
    longPlacementPenalty += Math.max(0, compactness - totalCells * 0.45) * 0.8;
  }

  const newCellBonus = bucket === 'long' ? newLetterCells * 4 : newLetterCells * 10;

  const totalScore =
    crossings * 120 +
    openConnectionDelta * 22 -
    compactness * 3.4 +
    utilizationAfter * 130 +
    newCellBonus -
    centerDistance * 2 +
    directionBalance +
    wordQuality -
    longPlacementPenalty;

  return {
    placement,
    crossings,
    centerDistance,
    compactness,
    utilizationAfter,
    directionBalance,
    openConnectionDelta,
    totalScore,
  };
}

export function comparePlacements(
  left: ScoredPlacement,
  right: ScoredPlacement,
  existing: PuzzlePlacementInput[],
) {
  if (left.crossings !== right.crossings) {
    return right.crossings - left.crossings;
  }

  if (left.openConnectionDelta !== right.openConnectionDelta) {
    return right.openConnectionDelta - left.openConnectionDelta;
  }

  if (left.utilizationAfter !== right.utilizationAfter) {
    return right.utilizationAfter - left.utilizationAfter;
  }

  if (left.compactness !== right.compactness) {
    return left.compactness - right.compactness;
  }

  if (left.centerDistance !== right.centerDistance) {
    return left.centerDistance - right.centerDistance;
  }

  const leftBalance = scoreDirectionBalance(left.placement, existing);
  const rightBalance = scoreDirectionBalance(right.placement, existing);

  return rightBalance - leftBalance;
}

function scoreDirectionBalance(placement: PuzzlePlacementInput, existing: PuzzlePlacementInput[]) {
  const acrossCount = existing.filter((entry) => entry.direction === 'ACROSS').length;
  const downCount = existing.filter((entry) => entry.direction === 'DOWN').length;

  if (placement.direction === 'ACROSS' && downCount > acrossCount) {
    return 1;
  }

  if (placement.direction === 'DOWN' && acrossCount > downCount) {
    return 1;
  }

  return 0;
}

export function buildCandidatePool(
  candidates: ScoringWordCandidate[],
  profile: GridSizeProfile,
  gridLimit: number,
) {
  return candidates.filter((candidate) => isUsableCandidate(candidate, profile, gridLimit));
}
