import { createDailyRound, isDagensOrdLost, isDagensOrdWon } from '@/lib/games/dagens-ord/rules';
import type {
  DagensOrdGuess,
  DagensOrdRound,
  DagensOrdWordCatalog,
} from '@/lib/games/dagens-ord/types';

const STORAGE_KEY = 'ordklubben:dagens-ord:daily';

export function loadSavedRound(catalog: DagensOrdWordCatalog): DagensOrdRound {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return createDailyRound(catalog);
  }

  try {
    const saved = JSON.parse(raw) as {
      dayKey?: string;
      targetWord?: string;
      guesses?: DagensOrdGuess[];
    };

    if (
      saved.dayKey === catalog.dayKey &&
      saved.targetWord === catalog.targetWord &&
      Array.isArray(saved.guesses)
    ) {
      return {
        dayKey: saved.dayKey,
        targetWord: saved.targetWord,
        guesses: saved.guesses,
        currentInput: '',
      };
    }
  } catch {
    // Ignore malformed saved state.
  }

  return createDailyRound(catalog);
}

export function persistRound(round: DagensOrdRound) {
  const status = isDagensOrdWon(round.guesses, round.targetWord)
    ? 'won'
    : isDagensOrdLost(round.guesses, round.targetWord)
      ? 'lost'
      : 'playing';

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      dayKey: round.dayKey,
      targetWord: round.targetWord,
      guesses: round.guesses,
      status,
    }),
  );
}
