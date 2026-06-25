import { type OrdstormStats } from '@/lib/games/ordstorm/types';
import { createGameStorage } from '@/lib/storage/create-game-storage';

export const defaultOrdstormStats: OrdstormStats = {
  roundsPlayed: 0,
  bestScore: 0,
  totalScore: 0,
  totalWordsFound: 0,
  bestWords: [],
};

export const ordstormStatsStore = createGameStorage({
  storageKey: 'ordklubben:ordstorm:stats',
  changeEvent: 'ordklubben:stats-changed',
  defaultValue: defaultOrdstormStats,
  logLabel: 'Ordstorm',
  debugEnvKey: 'NEXT_PUBLIC_ORDSTORM_DEBUG',
});

export const defaultStats = ordstormStatsStore.defaultValue;
export const loadStats = ordstormStatsStore.load;
export const saveStats = ordstormStatsStore.save;
export const subscribeToStats = ordstormStatsStore.subscribe;

export function updateStatsAfterRound(
  stats: OrdstormStats,
  round: { score: number; wordsFound: number; bestWord: string },
) {
  const bestWords = round.bestWord
    ? [...new Set([round.bestWord, ...stats.bestWords])].sort(
        (a, b) => b.length - a.length || a.localeCompare(b),
      )
    : stats.bestWords;

  return {
    roundsPlayed: stats.roundsPlayed + 1,
    bestScore: Math.max(stats.bestScore, round.score),
    totalScore: stats.totalScore + round.score,
    totalWordsFound: stats.totalWordsFound + round.wordsFound,
    bestWords: bestWords.slice(0, 8),
  };
}
