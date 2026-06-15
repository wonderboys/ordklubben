import { createLetterPool } from '@/lib/dictionary/letter-pool';
import { canBuildWord } from '@/lib/dictionary/can-build-word';
import { normalizeSwedish } from '@/lib/dictionary/normalize-swedish';
import { ORDSTORM_MIN_WORD_LENGTH } from '@/lib/game/ordstorm';

export type LetterTilePlayState = 'idle' | 'selected' | 'depleted' | 'used';

export type TypingHint = {
  message: string;
} | null;

export function indicesToWord(indices: number[], letters: string[]) {
  return indices.map((index) => normalizeSwedish(letters[index])).join('');
}

export function wordToSelectedIndices(word: string, letters: string[]) {
  const normalizedWord = normalizeSwedish(word);
  const indices: number[] = [];
  const usedIndices = new Set<number>();

  for (const character of normalizedWord) {
    const index = letters.findIndex(
      (letter, letterIndex) =>
        !usedIndices.has(letterIndex) && normalizeSwedish(letter) === character,
    );

    if (index === -1) {
      break;
    }

    usedIndices.add(index);
    indices.push(index);
  }

  return indices;
}

export function getLetterTilePlayState(options: {
  index: number;
  selectedIndices: number[];
  isStarting: boolean;
}): LetterTilePlayState {
  const { index, selectedIndices, isStarting } = options;

  if (isStarting) {
    return 'used';
  }

  if (selectedIndices.includes(index)) {
    return 'depleted';
  }

  return 'idle';
}

export function getTypingHint(
  attemptedValue: string,
  acceptedValue: string,
  letters: string[],
): TypingHint {
  if (attemptedValue.length <= acceptedValue.length) {
    return null;
  }

  const roundPool = createLetterPool(letters);
  let built = acceptedValue;

  for (const character of normalizeSwedish(attemptedValue).slice(built.length)) {
    const candidate = `${built}${character}`;

    if (canBuildWord(candidate, letters)) {
      built = candidate;
      continue;
    }

    if (!roundPool[character]) {
      return { message: 'Bokstaven finns inte i rundan.' };
    }

    return { message: 'Bokstaven används redan.' };
  }

  return null;
}

export function getSubmitLengthHint(length: number) {
  if (length === 0) {
    return null;
  }

  if (length < ORDSTORM_MIN_WORD_LENGTH) {
    return { message: 'Minst tre bokstäver.' };
  }

  return null;
}

export function getPlayingIdleMessage(options: {
  wordsFound: number;
  timeLeft: number;
  inputLength: number;
}) {
  const { wordsFound, timeLeft, inputLength } = options;

  if (inputLength > 0 && inputLength < ORDSTORM_MIN_WORD_LENGTH) {
    return 'Minst tre bokstäver.';
  }

  if (timeLeft <= 10) {
    return 'Sista sekunderna.';
  }

  if (wordsFound === 0) {
    return 'Hitta första ordet.';
  }

  return 'Fortsätt bygga.';
}

export type RoundResultCopy = {
  headline: string;
  subline: string;
};

export function getRoundResultCopy(options: {
  score: number;
  wordsFound: number;
  commonFoundPercentage: number;
  bestScore: number;
  isNewRecord: boolean;
}): RoundResultCopy {
  const { score, wordsFound, commonFoundPercentage, bestScore, isNewRecord } = options;

  if (wordsFound === 0) {
    return {
      headline: 'Inga ord den här gången.',
      subline: 'Nästa runda är en ny chans.',
    };
  }

  if (isNewRecord) {
    return {
      headline: 'Nytt rekord.',
      subline: 'Stark runda.',
    };
  }

  if (score >= bestScore && bestScore > 0) {
    return {
      headline: 'Du matchade ditt rekord.',
      subline: 'Stabil runda.',
    };
  }

  if (commonFoundPercentage >= 70) {
    return {
      headline: 'Starkt hittat.',
      subline: 'Många vanliga ord i rundan.',
    };
  }

  if (commonFoundPercentage >= 45) {
    return {
      headline: 'Bra jobbat.',
      subline: 'Nära hälften av de vanliga orden.',
    };
  }

  if (wordsFound >= 6) {
    return {
      headline: 'Bra tempo.',
      subline: 'Fortsätt bygga rytmen.',
    };
  }

  return {
    headline: 'Bra start.',
    subline: 'En runda till?',
  };
}

export function getSuccessMessage(word: string) {
  if (word.length === 6) {
    return 'Fullträff.';
  }

  if (word.length === 5) {
    return 'Långt ord.';
  }

  if (word.length === 4) {
    return 'Bra hittat.';
  }

  return 'Bra hittat.';
}
