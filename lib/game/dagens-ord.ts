import { dagensOrdSolutionWords } from '@/data/dagens-ord/solution-words';
import { allowedSvWords } from '@/data/words';
import { hasOnlySwedishLetters, normalizeSwedish } from '@/lib/dictionary/normalize-swedish';

export const DAGENS_ORD_WORD_LENGTH = 5;
export const DAGENS_ORD_MAX_GUESSES = 6;
export const DAGENS_ORD_REVEAL_STEP_MS = 150;
export const DAGENS_ORD_REVEAL_ANIMATION_MS = 140;

export type DagensOrdLetterFeedback = 'correct' | 'present' | 'absent';

export type DagensOrdGuess = {
  word: string;
  feedback: DagensOrdLetterFeedback[];
};

export type DagensOrdRound = {
  targetWord: string;
  dayKey: string;
  guesses: DagensOrdGuess[];
  currentInput: string;
};

function uniqueFiveLetterWords(words: readonly string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const word of words) {
    const normalized = normalizeSwedish(word);

    if (
      normalized.length !== DAGENS_ORD_WORD_LENGTH ||
      !hasOnlySwedishLetters(normalized) ||
      seen.has(normalized)
    ) {
      continue;
    }

    seen.add(normalized);
    result.push(normalized);
  }

  return result.sort((left, right) => left.localeCompare(right, 'sv'));
}

const solutionWordCandidates = uniqueFiveLetterWords(dagensOrdSolutionWords);
const allowedFiveLetterWords = new Set(uniqueFiveLetterWords(allowedSvWords));

export function getSolutionWordCandidates() {
  return solutionWordCandidates;
}

export function getDayKey(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return start.toISOString().slice(0, 10);
}

export function getDailyWordIndex(words: string[] = solutionWordCandidates, date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNumber = Math.floor(start.getTime() / (24 * 60 * 60 * 1000));

  return dayNumber % words.length;
}

export function pickDailyWord(date = new Date()) {
  const words = solutionWordCandidates;

  if (words.length === 0) {
    return [...allowedFiveLetterWords][0] ?? '';
  }

  return words[getDailyWordIndex(words, date)] ?? words[0];
}

/** Dev/test helper — not used in primary Dagens Ord UI. */
export function pickRandomSolutionWord(exclude?: string) {
  const normalizedExclude = exclude ? normalizeSwedish(exclude) : undefined;
  const candidates = normalizedExclude
    ? solutionWordCandidates.filter((word) => word !== normalizedExclude)
    : solutionWordCandidates;

  if (candidates.length === 0) {
    return pickDailyWord();
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function createDailyRound(date = new Date()): DagensOrdRound {
  const targetWord = pickDailyWord(date);

  return {
    targetWord,
    dayKey: getDayKey(date),
    guesses: [],
    currentInput: '',
  };
}

export function restartDailyRound(targetWord: string, date = new Date()): DagensOrdRound {
  return {
    targetWord: normalizeSwedish(targetWord),
    dayKey: getDayKey(date),
    guesses: [],
    currentInput: '',
  };
}

export function isValidDagensOrdGuess(word: string) {
  const normalized = normalizeSwedish(word);

  return (
    normalized.length === DAGENS_ORD_WORD_LENGTH &&
    hasOnlySwedishLetters(normalized) &&
    allowedFiveLetterWords.has(normalized)
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

export function isGameOver(guesses: DagensOrdGuess[], target: string) {
  return isDagensOrdWon(guesses, target) || guesses.length >= DAGENS_ORD_MAX_GUESSES;
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
