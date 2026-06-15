import { allowedSvWords, commonSvWords } from '@/data/words';
import { seedWordsSv } from '@/data/words/ordstorm-wordlists';
import { canBuildWord } from '@/lib/dictionary/can-build-word';
import { normalizeSwedish } from '@/lib/dictionary/normalize-swedish';

export const GAME_DURATION_SECONDS = 60;
export const ORDSTORM_MIN_WORD_LENGTH = 3;
export const ORDSTORM_MAX_WORD_LENGTH = 6;
export const ORDSTORM_FULL_WORD_BONUS = 300;
export const ORDSTORM_RECENT_SEED_LIMIT = 10;
const MINIMUM_SHUFFLE_DISTANCE = 3;
const MAX_SHUFFLE_ATTEMPTS = 12;
const MINIMUM_VALID_WORDS = 8;
const MAX_SEED_SELECTION_ATTEMPTS = 24;

export type OrdstormRound = {
  seedWord: string;
  originalLetters: string[];
  letters: string[];
  shuffleAttempts: number;
  validWords: string[];
  validWordSet: Set<string>;
};

export type OrdstormStats = {
  roundsPlayed: number;
  bestScore: number;
  totalScore: number;
  totalWordsFound: number;
  bestWords: string[];
};

export const ORDSTORM_WORDS = [...new Set([...commonSvWords, ...allowedSvWords])]
  .map((word) => normalizeSwedish(word))
  .filter(
    (word) => word.length >= ORDSTORM_MIN_WORD_LENGTH && word.length <= ORDSTORM_MAX_WORD_LENGTH,
  )
  .sort((a, b) => a.localeCompare(b, 'sv-SE'));

export const ORDSTORM_WORD_SET = new Set(ORDSTORM_WORDS);

export const ORDSTORM_COMMON_WORD_SET = new Set(
  commonSvWords.map((word) => normalizeSwedish(word)),
);

export function isOrdstormCommonWord(word: string) {
  return ORDSTORM_COMMON_WORD_SET.has(normalizeSwedish(word));
}

export function splitOrdstormWordsByCategory(words: string[]) {
  const commonWords: string[] = [];
  const otherAcceptedWords: string[] = [];

  for (const word of words) {
    if (isOrdstormCommonWord(word)) {
      commonWords.push(word);
      continue;
    }

    otherAcceptedWords.push(word);
  }

  return { commonWords, otherAcceptedWords };
}

export function getWordScore(word: string) {
  const length = word.length;

  if (length === 3) return 100;
  if (length === 4) return 200;
  if (length === 5) return 400;
  if (length === 6) return 700 + ORDSTORM_FULL_WORD_BONUS;

  return 0;
}

export function getRoundPotentialScore(words: string[]) {
  return words.reduce((total, word) => total + getWordScore(word), 0);
}

function shuffleArray<T>(values: T[], randomValue = Math.random) {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomValue() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function getShuffleDistance(original: string[], shuffled: string[]) {
  return original.reduce((count, letter, index) => {
    return count + Number(letter !== shuffled[index]);
  }, 0);
}

function createStrongShuffle(letters: string[], randomValue = Math.random) {
  let attempts = 0;
  let shuffled = [...letters];

  while (attempts < MAX_SHUFFLE_ATTEMPTS) {
    attempts += 1;
    shuffled = shuffleArray(letters, randomValue);

    if (getShuffleDistance(letters, shuffled) >= MINIMUM_SHUFFLE_DISTANCE) {
      break;
    }
  }

  return {
    letters: shuffled,
    attempts,
  };
}

export function selectSeedWord(recentSeedWords: string[] = [], randomValue = Math.random()) {
  const normalizedRecentSeedWords = recentSeedWords.map((seedWord) => normalizeSwedish(seedWord));
  const availableSeedWords = seedWordsSv.filter(
    (seedWord) => !normalizedRecentSeedWords.includes(normalizeSwedish(seedWord)),
  );
  const source = availableSeedWords.length ? availableSeedWords : seedWordsSv;
  const index = Math.floor(randomValue * source.length);

  return source[index] ?? source[0] ?? 'spelar';
}

function getValidRoundWords(letters: string[]) {
  return ORDSTORM_WORDS.filter((word) => canBuildWord(word, letters)).sort(
    (a, b) => b.length - a.length || a.localeCompare(b, 'sv-SE'),
  );
}

export function createRoundFromSeedWord(
  seedWord: string,
  options?: { shuffleLetters?: boolean },
): OrdstormRound {
  const normalizedSeedWord = normalizeSwedish(seedWord);
  const baseLetters = normalizedSeedWord.toLocaleUpperCase('sv-SE').split('');
  const shuffleResult =
    options?.shuffleLetters === false
      ? { letters: baseLetters, attempts: 0 }
      : createStrongShuffle(baseLetters);
  const letters = shuffleResult.letters;
  const validWords = getValidRoundWords(letters);

  return {
    seedWord: normalizedSeedWord,
    originalLetters: baseLetters,
    letters,
    shuffleAttempts: shuffleResult.attempts,
    validWords,
    validWordSet: new Set(validWords),
  };
}

export function createRound(recentSeedWords: string[] = []): OrdstormRound {
  let bestRound: OrdstormRound | null = null;

  for (let attempt = 0; attempt < MAX_SEED_SELECTION_ATTEMPTS; attempt += 1) {
    const candidateSeedWord = selectSeedWord(recentSeedWords);
    const candidateRound = createRoundFromSeedWord(candidateSeedWord);

    if (!bestRound || candidateRound.validWords.length > bestRound.validWords.length) {
      bestRound = candidateRound;
    }

    if (candidateRound.validWords.length >= MINIMUM_VALID_WORDS) {
      return candidateRound;
    }
  }

  return bestRound ?? createRoundFromSeedWord(selectSeedWord([]));
}
