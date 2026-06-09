import { type OrdstormStats } from "@/lib/game/ordstorm";
import { createGameStorage } from "@/lib/storage/create-game-storage";

export const defaultOrdstormStats: OrdstormStats = {
  roundsPlayed: 0,
  bestScore: 0,
  totalScore: 0,
  totalWordsFound: 0,
  bestWords: [],
};

const ordstormStatsStorage = createGameStorage({
  storageKey: "ordklubben:ordstorm:stats",
  changeEvent: "ordklubben:stats-changed",
  defaultValue: defaultOrdstormStats,
  logLabel: "Ordstorm",
  debugEnvKey: "NEXT_PUBLIC_ORDSTORM_DEBUG",
});

export const defaultStats = defaultOrdstormStats;
export const loadStats = ordstormStatsStorage.load;
export const saveStats = ordstormStatsStorage.save;
export const subscribeToStats = ordstormStatsStorage.subscribe;

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
