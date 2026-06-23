import { hasOnlySwedishLetters, normalizeSwedish } from '@/lib/dictionary/normalize-swedish';
import type {
  DagensOrdGuess,
  DagensOrdLetterFeedback,
  DagensOrdRound,
} from '@/lib/games/dagens-ord/types';

export const DAGENS_ORD_WORD_LENGTH = 5;
export const DAGENS_ORD_MAX_GUESSES = 6;
export const DAGENS_ORD_REVEAL_STEP_MS = 150;
export const DAGENS_ORD_REVEAL_ANIMATION_MS = 140;

export function createDailyRound(input: { targetWord: string; dayKey: string }): DagensOrdRound {
  return {
    targetWord: normalizeSwedish(input.targetWord),
    dayKey: input.dayKey,
    guesses: [],
    currentInput: '',
  };
}

export function isValidDagensOrdGuess(word: string, allowedWords: Set<string>) {
  const normalized = normalizeSwedish(word);

  return (
    normalized.length === DAGENS_ORD_WORD_LENGTH &&
    hasOnlySwedishLetters(normalized) &&
    allowedWords.has(normalized)
  );
}

export function evaluateGuess(guess: string, target: string): DagensOrdLetterFeedback[] {
  const normalizedGuess = normalizeSwedish(guess);
  const normalizedTarget = normalizeSwedish(target);

  if (normalizedGuess.length !== normalizedTarget.length) {
    return Array<DagensOrdLetterFeedback>(normalizedGuess.length).fill('absent');
  }

  const feedback = Array<DagensOrdLetterFeedback>(normalizedGuess.length).fill('absent');
  const remainingLetters = new Map<string, number>();

  for (const letter of normalizedTarget) {
    remainingLetters.set(letter, (remainingLetters.get(letter) ?? 0) + 1);
  }

  for (let index = 0; index < normalizedGuess.length; index += 1) {
    if (normalizedGuess[index] !== normalizedTarget[index]) {
      continue;
    }

    feedback[index] = 'correct';
    const letter = normalizedGuess[index];
    remainingLetters.set(letter, (remainingLetters.get(letter) ?? 0) - 1);
  }

  for (let index = 0; index < normalizedGuess.length; index += 1) {
    if (feedback[index] === 'correct') {
      continue;
    }

    const letter = normalizedGuess[index];
    const remaining = remainingLetters.get(letter) ?? 0;

    if (remaining > 0) {
      feedback[index] = 'present';
      remainingLetters.set(letter, remaining - 1);
    }
  }

  return feedback;
}

export function isSolved(guess: string, target: string) {
  return normalizeSwedish(guess) === normalizeSwedish(target);
}

export function isDagensOrdWon(guesses: DagensOrdGuess[], target: string) {
  return guesses.some((guess) => isSolved(guess.word, target));
}

export function isDagensOrdLost(guesses: DagensOrdGuess[], target: string) {
  return guesses.length >= DAGENS_ORD_MAX_GUESSES && !isDagensOrdWon(guesses, target);
}

const FEEDBACK_PRIORITY: Record<DagensOrdLetterFeedback, number> = {
  correct: 3,
  present: 2,
  absent: 1,
};

export function getKeyboardLetterStates(guesses: DagensOrdGuess[]) {
  const states = new Map<string, DagensOrdLetterFeedback>();

  for (const guess of guesses) {
    for (let index = 0; index < guess.word.length; index += 1) {
      const letter = guess.word[index];
      const feedback = guess.feedback[index];
      const current = states.get(letter);

      if (!current || FEEDBACK_PRIORITY[feedback] > FEEDBACK_PRIORITY[current]) {
        states.set(letter, feedback);
      }
    }
  }

  return states;
}
