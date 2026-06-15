import {
  computeGridUtilization,
  countBlockedClustersForCells,
  countGridCrossings,
  scoreBlockPattern,
  type BlockedCell,
} from '@/lib/content/puzzle/grid-generator-blocks';
import { computeGridConnectivityMetrics } from '@/lib/content/puzzle/grid-generator-connectivity';
import {
  computeLayoutCompactness,
  computeWordLengthStats,
  scoreLengthDistribution,
  type GridSizeProfile,
} from '@/lib/content/puzzle/grid-generator-scoring';
import { scoreGridThemeQuality } from '@/lib/content/puzzle/grid-generator-quality';
import { getAnswerLength } from '@/lib/content/puzzle/grid';

export type GridAttemptScore = {
  total: number;
  wordScore: number;
  crossingScore: number;
  blockScore: number;
  utilizationScore: number;
  compactnessScore: number;
  gapFillScore: number;
  lengthMixScore: number;
  openConnectionScore: number;
  isolatedRegionPenalty: number;
  blockRatioPenalty: number;
  validityPenalty: number;
  crossingCount: number;
  utilizationRate: number;
  blockRatio: number;
  openConnections: number;
  blockClusters: number;
  isolatedRegions: number;
  themeQualityScore: number;
  gapsFilled: number;
  emptyCellsBlocked: number;
  remainingEmptyCount: number;
  finalValidationOk: boolean;
};

export function scoreGridAttempt(options: {
  entries: import('@/lib/content/puzzle/grid').PuzzlePlacementInput[];
  blockedCells: BlockedCell[];
  width: number;
  height: number;
  profile: GridSizeProfile;
  gapsFilled: number;
  emptyCellsBlocked: number;
  remainingEmptyCount: number;
  finalValidationOk: boolean;
  themeSelected?: boolean;
  themeHitCount?: number;
  emergencyWordCount?: number;
}): GridAttemptScore {
  const {
    entries,
    blockedCells,
    width,
    height,
    profile,
    gapsFilled,
    emptyCellsBlocked,
    remainingEmptyCount,
    finalValidationOk,
    themeSelected = false,
    themeHitCount = 0,
    emergencyWordCount = 0,
  } = options;
  const totalCells = width * height;
  const utilization = computeGridUtilization(entries, width, height);
  const crossingCount = countGridCrossings(entries);
  const lengthStats = computeWordLengthStats(entries, profile);
  const blockRatio = totalCells > 0 ? blockedCells.length / totalCells : 0;
  const connectivity = computeGridConnectivityMetrics(entries, blockedCells, width, height);
  const blockClusters = countBlockedClustersForCells(blockedCells, width, height);
  const blockPattern = scoreBlockPattern({
    blockedCells,
    entries,
    width,
    height,
  });

  let validityPenalty = 0;

  if (!finalValidationOk) {
    validityPenalty += 1000;
  }

  if (remainingEmptyCount > 0) {
    validityPenalty += remainingEmptyCount * 8;
  }

  for (const entry of entries) {
    const length = getAnswerLength(entry.answerSnapshot);

    if (length < 2) {
      validityPenalty += 200;
    }
  }

  let blockRatioPenalty = 0;

  if (blockRatio > profile.blockRatioMax) {
    blockRatioPenalty = (blockRatio - profile.blockRatioMax) * 880;
  } else {
    blockRatioPenalty = (profile.blockRatioMax - blockRatio) * 85;
  }

  const clusterPenalty = blockClusters > 4 ? (blockClusters - 4) * 35 : 0;

  const wordScore = entries.length * 36;
  const crossingScore = crossingCount * 56;
  const compactness = computeLayoutCompactness(entries);
  const compactnessScore = Math.max(0, 160 - compactness * 2.2);
  const gapFillScore = gapsFilled * 32;
  const lengthMixScore = scoreLengthDistribution(lengthStats, profile, entries.length);
  const openConnectionScore = connectivity.openConnections * 10;
  const isolatedRegionPenalty = connectivity.isolatedEmptyRegions * 110 + clusterPenalty;
  const themeQualityScore = scoreGridThemeQuality({
    themeHitCount,
    themeSelected,
    wordCount: entries.length,
    emergencyWordCount,
    averageWordLength: lengthStats.averageWordLength,
    longestWord: lengthStats.longestWord,
  });

  let utilizationScore = 0;
  const rate = utilization.rate;

  if (rate >= profile.utilizationMin && rate <= profile.utilizationMax) {
    utilizationScore = 130;
  } else if (rate < profile.utilizationMin) {
    utilizationScore = Math.max(0, 70 - (profile.utilizationMin - rate) * 240);
  } else {
    utilizationScore = Math.max(0, 70 - (rate - profile.utilizationMax) * 180);
  }

  let qualityBonus = 0;

  if (entries.length >= profile.targetWordMin) {
    qualityBonus += 40;
  }

  if (crossingCount >= profile.targetCrossingMin) {
    qualityBonus += 45;
  }

  const total =
    wordScore +
    crossingScore +
    blockPattern.total +
    utilizationScore +
    compactnessScore +
    gapFillScore +
    lengthMixScore +
    openConnectionScore +
    themeQualityScore +
    qualityBonus -
    isolatedRegionPenalty -
    blockRatioPenalty -
    validityPenalty;

  return {
    total,
    wordScore,
    crossingScore,
    blockScore: blockPattern.total,
    utilizationScore,
    compactnessScore,
    gapFillScore,
    lengthMixScore,
    openConnectionScore,
    isolatedRegionPenalty,
    blockRatioPenalty,
    validityPenalty,
    crossingCount,
    utilizationRate: rate,
    blockRatio,
    openConnections: connectivity.openConnections,
    blockClusters,
    isolatedRegions: connectivity.isolatedEmptyRegions,
    themeQualityScore,
    gapsFilled,
    emptyCellsBlocked,
    remainingEmptyCount,
    finalValidationOk,
  };
}

export function compareGridAttempts(left: GridAttemptScore, right: GridAttemptScore) {
  if (left.finalValidationOk !== right.finalValidationOk) {
    return left.finalValidationOk ? -1 : 1;
  }

  if (left.remainingEmptyCount !== right.remainingEmptyCount) {
    return left.remainingEmptyCount - right.remainingEmptyCount;
  }

  if (left.validityPenalty !== right.validityPenalty) {
    return left.validityPenalty - right.validityPenalty;
  }

  if (left.lengthMixScore !== right.lengthMixScore) {
    return right.lengthMixScore - left.lengthMixScore;
  }

  if (left.blockRatioPenalty !== right.blockRatioPenalty) {
    return left.blockRatioPenalty - right.blockRatioPenalty;
  }

  if (left.crossingCount !== right.crossingCount) {
    return right.crossingCount - left.crossingCount;
  }

  return right.total - left.total;
}

export { getAnswerLetters } from '@/lib/content/puzzle/grid-generator-scoring';
