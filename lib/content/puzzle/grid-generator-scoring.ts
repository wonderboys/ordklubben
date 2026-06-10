import { getAnswerLength, getPlacementCells, type PuzzlePlacementInput } from "@/lib/content/puzzle/grid";
import { computeOpenConnectionDelta } from "@/lib/content/puzzle/grid-generator-connectivity";
import type { BlockedCell } from "@/lib/content/puzzle/grid-generator-blocks";

const VOWEL_PATTERN = /[AEIOUYÅÄÖ]/u;

export type ScoringWordCandidate = {
  id: string;
  answer: string;
  hints: Array<{
    id: string;
    text: string;
    status: "DRAFT" | "APPROVED";
  }>;
};

export type WordSelectionPhase = "anchor" | "crossing" | "gap";

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
    };
  }

  if (size <= 9) {
    return {
      idealMin: 4,
      idealMax: 6,
      allowMin: 2,
      allowMax: 9,
      anchorMin: 7,
      anchorMax: 9,
      firstWordMin: 7,
      firstWordMax: 9,
      targetWordMin: 12,
      targetWordMax: 20,
      targetCrossingMin: 12,
      utilizationMin: 0.5,
      utilizationMax: 0.68,
      blockRatioMax: 0.35,
      shortMin: 2,
      shortMax: 3,
      mediumMin: 4,
      mediumMax: 6,
      longMin: 7,
      longMax: 9,
    };
  }

  return {
    idealMin: 5,
    idealMax: 8,
    allowMin: 2,
    allowMax: 11,
    anchorMin: 8,
    anchorMax: 11,
    firstWordMin: 8,
    firstWordMax: 11,
    targetWordMin: 18,
    targetWordMax: 30,
    targetCrossingMin: 20,
    utilizationMin: 0.5,
    utilizationMax: 0.72,
    blockRatioMax: 0.3,
    shortMin: 2,
    shortMax: 3,
    mediumMin: 4,
    mediumMax: 7,
    longMin: 8,
    longMax: 11,
  };
}

export function getAnswerLetters(answerSnapshot: string) {
  return answerSnapshot
    .trim()
    .toLocaleUpperCase("sv-SE")
    .replace(/[\s'’\-‐‑‒–—]+/g, "")
    .split("");
}

export function hasVowel(answerSnapshot: string) {
  return VOWEL_PATTERN.test(
    answerSnapshot.trim().toLocaleUpperCase("sv-SE"),
  );
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
    return "long" as const;
  }

  if (length >= profile.mediumMin && length <= profile.mediumMax) {
    return "medium" as const;
  }

  if (length >= profile.shortMin && length <= profile.shortMax) {
    return "short" as const;
  }

  return "other" as const;
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

    if (bucket === "short") {
      shortCount += 1;
    } else if (bucket === "medium") {
      mediumCount += 1;
    } else if (bucket === "long") {
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

export function countShortWords(
  entries: PuzzlePlacementInput[],
  profile: GridSizeProfile,
) {
  return computeWordLengthStats(entries, profile).shortCount;
}

function countBucketInLengths(
  placedLengths: number[],
  profile: GridSizeProfile,
  bucket: "short" | "medium" | "long",
) {
  return placedLengths.filter((length) => getLengthBucket(length, profile) === bucket).length;
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

  const shortCount = countBucketInLengths(nextLengths, profile, "short");
  const mediumCount = countBucketInLengths(nextLengths, profile, "medium");
  const longCount = countBucketInLengths(nextLengths, profile, "long");
  const shortRate = shortCount / total;
  const mediumRate = mediumCount / total;
  const longRate = longCount / total;
  let score = 0;

  if (phase === "gap") {
    if (getLengthBucket(length, profile) === "short") {
      score += 18;
    } else if (getLengthBucket(length, profile) === "medium") {
      score += 6;
    } else {
      score -= 16;
    }

    return score;
  }

  if (longCount >= 1) {
    score += 24;
  } else if (phase === "crossing" && getLengthBucket(length, profile) === "long") {
    score += 30;
  }

  if (mediumRate >= 0.25 && mediumRate <= 0.5) {
    score += 22;
  } else if (getLengthBucket(length, profile) === "medium") {
    score += 12;
  }

  if (shortRate > 0.55) {
    score -= (shortRate - 0.55) * 120;
  }

  if (shortRate <= 0.35 && mediumRate >= 0.2) {
    score += 16;
  }

  if (profile.targetWordMax >= 8) {
    if (longRate >= 0.08 && longRate <= 0.25) {
      score += 18;
    }

    if (shortRate >= 0.15 && shortRate <= 0.35) {
      score += 10;
    }
  } else if (longRate >= 0.12 && longRate <= 0.3) {
    score += 14;
  }

  return score;
}

export function scoreWordCandidate(options: {
  candidate: ScoringWordCandidate;
  profile: GridSizeProfile;
  placedLengths: number[];
  letterFrequency: Map<string, number>;
  hasTheme: boolean;
  phase?: WordSelectionPhase;
  slotLength?: number;
}) {
  const {
    candidate,
    profile,
    placedLengths,
    letterFrequency,
    hasTheme,
    phase = "crossing",
    slotLength,
  } = options;
  const length = getAnswerLength(candidate.answer);
  const bucket = getLengthBucket(length, profile);
  let score = 0;

  if (phase === "anchor") {
    if (length >= profile.anchorMin && length <= profile.anchorMax) {
      score += 80 - Math.abs(length - (profile.anchorMin + profile.anchorMax) / 2) * 4;
    } else if (length >= profile.mediumMin) {
      score += 20;
    } else {
      score -= 40;
    }
  } else if (phase === "crossing") {
    if (bucket === "medium") {
      score += 36;
    } else if (bucket === "long") {
      score += countBucketInLengths(placedLengths, profile, "long") === 0 ? 28 : 12;
    } else if (bucket === "short") {
      score += countBucketInLengths(placedLengths, profile, "short") >= 2 ? -24 : 4;
    }
  } else if (phase === "gap") {
    if (bucket === "short") {
      score += 28;
    } else if (bucket === "medium") {
      score += 10;
    } else {
      score -= 20;
    }

    if (slotLength !== undefined && length === slotLength) {
      score += 45;
    }
  }

  score += scoreLengthMix(placedLengths, length, profile, phase);
  score += countLetterOverlapPotential(candidate.answer, letterFrequency) * 3;
  score += new Set(getAnswerLetters(candidate.answer)).size;

  if (candidate.hints.some((hint) => hint.status === "APPROVED")) {
    score += 10;
  } else if (candidate.hints.length > 0) {
    score += 3;
  }

  if (hasTheme) {
    score += 2;
  }

  const sameLengthCount = placedLengths.filter((value) => value === length).length;
  score -= sameLengthCount * 5;

  return score;
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

  if (stats.longCount >= 1) {
    score += 60;
  } else {
    score -= 80;
  }

  if (mediumRate >= 0.2) {
    score += 40;
  }

  if (shortRate <= 0.45) {
    score += 30;
  } else {
    score -= (shortRate - 0.45) * 160;
  }

  if (stats.averageWordLength >= profile.idealMin && stats.averageWordLength <= profile.idealMax + 1) {
    score += 35;
  }

  if (profile.targetWordMax >= 8) {
    if (longRate >= 0.08 && longRate <= 0.22) {
      score += 25;
    }

    if (mediumRate >= 0.3 && mediumRate <= 0.55) {
      score += 25;
    }
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
    const [row, col] = key.split(":").map(Number);
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
    entries.flatMap((entry) =>
      getPlacementCells(entry).map((cell) => `${cell.row}:${cell.col}`),
    ),
  );
}

export function scorePlacement(
  placement: PuzzlePlacementInput,
  existing: PuzzlePlacementInput[],
  width: number,
  height: number,
  blockedCells: BlockedCell[] = [],
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
  const centerDistance =
    Math.abs(placement.row - centerRow) + Math.abs(placement.col - centerCol);

  const acrossCount = existing.filter((entry) => entry.direction === "ACROSS").length;
  const downCount = existing.filter((entry) => entry.direction === "DOWN").length;
  let directionBalance = 0;

  if (placement.direction === "ACROSS" && downCount > acrossCount) {
    directionBalance += 8;
  } else if (placement.direction === "DOWN" && acrossCount > downCount) {
    directionBalance += 8;
  } else if (placement.direction === "ACROSS" && acrossCount > downCount) {
    directionBalance -= 4;
  } else if (placement.direction === "DOWN" && downCount > acrossCount) {
    directionBalance -= 4;
  }

  const openConnectionDelta = computeOpenConnectionDelta(
    placement,
    existing,
    blockedCells,
    width,
    height,
  );

  const totalScore =
    crossings * 120 +
    openConnectionDelta * 18 -
    compactness * 3.5 +
    utilizationAfter * 140 -
    centerDistance * 2 +
    directionBalance;

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
  if (left.utilizationAfter !== right.utilizationAfter) {
    return right.utilizationAfter - left.utilizationAfter;
  }

  if (left.crossings !== right.crossings) {
    return right.crossings - left.crossings;
  }

  if (left.openConnectionDelta !== right.openConnectionDelta) {
    return right.openConnectionDelta - left.openConnectionDelta;
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

function scoreDirectionBalance(
  placement: PuzzlePlacementInput,
  existing: PuzzlePlacementInput[],
) {
  const acrossCount = existing.filter((entry) => entry.direction === "ACROSS").length;
  const downCount = existing.filter((entry) => entry.direction === "DOWN").length;

  if (placement.direction === "ACROSS" && downCount > acrossCount) {
    return 1;
  }

  if (placement.direction === "DOWN" && acrossCount > downCount) {
    return 1;
  }

  return 0;
}

export function buildCandidatePool(
  candidates: ScoringWordCandidate[],
  profile: GridSizeProfile,
  gridLimit: number,
) {
  return candidates.filter((candidate) =>
    isUsableCandidate(candidate, profile, gridLimit),
  );
}
