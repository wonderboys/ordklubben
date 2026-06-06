import { type OrdstormStats } from "@/lib/game/ordstorm";

const STORAGE_KEY = "ordklubben:ordstorm:stats";
const STORAGE_EVENT = "ordklubben:stats-changed";

function shouldLogStorageWarning() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ORDSTORM_DEBUG === "true"
  );
}

function logStorageWarning(action: "loadStats" | "saveStats", error: unknown) {
  if (!shouldLogStorageWarning()) {
    return;
  }

  console.error(`[Ordstorm][localStorage][${action}]`, error);
}

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage ?? null;
  } catch (error) {
    logStorageWarning("loadStats", error);
    return null;
  }
}

export const defaultStats: OrdstormStats = {
  roundsPlayed: 0,
  bestScore: 0,
  totalScore: 0,
  totalWordsFound: 0,
  bestWords: [],
};

let cachedRawValue: string | null = null;
let cachedStats: OrdstormStats = defaultStats;

function parseStats(rawValue: string | null): OrdstormStats {
  if (!rawValue) {
    return defaultStats;
  }

  try {
    return { ...defaultStats, ...JSON.parse(rawValue) };
  } catch {
    return defaultStats;
  }
}

export function loadStats(): OrdstormStats {
  const storage = getStorage();

  if (!storage) {
    return defaultStats;
  }

  try {
    const rawValue = storage.getItem(STORAGE_KEY);

    if (rawValue === cachedRawValue) {
      return cachedStats;
    }

    cachedRawValue = rawValue;
    cachedStats = parseStats(rawValue);
    return cachedStats;
  } catch (error) {
    logStorageWarning("loadStats", error);
    cachedRawValue = null;
    cachedStats = defaultStats;
    return defaultStats;
  }
}

export function saveStats(stats: OrdstormStats) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const rawValue = JSON.stringify(stats);
  cachedRawValue = rawValue;
  cachedStats = stats;

  try {
    storage.setItem(STORAGE_KEY, rawValue);
  } catch (error) {
    logStorageWarning("saveStats", error);
    return;
  }

  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function subscribeToStats(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = () => onStoreChange();

  window.addEventListener("storage", listener);
  window.addEventListener(STORAGE_EVENT, listener);

  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(STORAGE_EVENT, listener);
  };
}

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
