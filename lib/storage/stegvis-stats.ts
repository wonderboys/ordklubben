import { createGameStorage } from '@/lib/storage/create-game-storage';

export type StegvisStats = {
  puzzlesSolved: number;
  bestSteps: number | null;
  totalSteps: number;
  currentStreak: number;
};

export const defaultStegvisStats: StegvisStats = {
  puzzlesSolved: 0,
  bestSteps: null,
  totalSteps: 0,
  currentStreak: 0,
};

export const stegvisStatsStore = createGameStorage({
  storageKey: 'ordklubben:stegvis:stats',
  changeEvent: 'ordklubben:stegvis:stats-changed',
  defaultValue: defaultStegvisStats,
  logLabel: 'Stegvis',
});

export const loadStegvisStats = stegvisStatsStore.load;
export const saveStegvisStats = stegvisStatsStore.save;
export const subscribeToStegvisStats = stegvisStatsStore.subscribe;

export function updateStegvisStatsAfterSolve(stats: StegvisStats, steps: number): StegvisStats {
  return {
    puzzlesSolved: stats.puzzlesSolved + 1,
    bestSteps: stats.bestSteps === null ? steps : Math.min(stats.bestSteps, steps),
    totalSteps: stats.totalSteps + steps,
    currentStreak: stats.currentStreak + 1,
  };
}
