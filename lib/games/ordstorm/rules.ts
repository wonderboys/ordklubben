import { canBuildWord } from '@/lib/dictionary/can-build-word';
import { normalizeSwedish } from '@/lib/dictionary/normalize-swedish';
import type { OrdstormRound, OrdstormWordCatalog } from '@/lib/games/ordstorm/types';

export const GAME_DURATION_SECONDS = 60;
export const ORDSTORM_MIN_WORD_LENGTH = 3;
export const ORDSTORM_MAX_WORD_LENGTH = 6;
export const ORDSTORM_FULL_WORD_BONUS = 300;
export const ORDSTORM_RECENT_SEED_LIMIT = 10;
const MINIMUM_SHUFFLE_DISTANCE = 3;
const MAX_SHUFFLE_ATTEMPTS = 12;
const MINIMUM_VALID_WORDS = 8;
const MAX_SEED_SELECTION_ATTEMPTS = 24;

export function createOrdstormLexicon(catalog: OrdstormWordCatalog) {
  const normalizedAllowed = catalog.allowedWords
    .map((word) => normalizeSwedish(word))
    .filter(
      (word) => word.length >= ORDSTORM_MIN_WORD_LENGTH && word.length <= ORDSTORM_MAX_WORD_LENGTH,
    );
  const normalizedCommon = catalog.commonWords.map((word) => normalizeSwedish(word));
  const normalizedSeeds = catalog.seedWords
    .map((word) => normalizeSwedish(word))
    .filter((word) => word.length === ORDSTORM_MAX_WORD_LENGTH);

  const words = [...new Set([...normalizedCommon, ...normalizedAllowed])].sort((a, b) =>
    a.localeCompare(b, 'sv-SE'),
  );

  return {
    words,
    wordSet: new Set(words),
    commonWordSet: new Set(normalizedCommon),
    seedWords: [...new Set(normalizedSeeds)],
  };
}

export function isOrdstormCommonWord(word: string, commonWordSet: Set<string>) {
  return commonWordSet.has(normalizeSwedish(word));
}

export function splitOrdstormWordsByCategory(words: string[], commonWordSet: Set<string>) {
  const commonWords: string[] = [];
  const otherAcceptedWords: string[] = [];

  for (const word of words) {
    if (isOrdstormCommonWord(word, commonWordSet)) {
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
  return original.reduce((count, letter, index) => count + Number(letter !== shuffled[index]), 0);
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

  return { letters: shuffled, attempts };
}

export function selectSeedWord(
  lexicon: ReturnType<typeof createOrdstormLexicon>,
  recentSeedWords: string[] = [],
  randomValue = Math.random(),
) {
  const normalizedRecentSeedWords = recentSeedWords.map((seedWord) => normalizeSwedish(seedWord));
  const availableSeedWords = lexicon.seedWords.filter(
    (seedWord) => !normalizedRecentSeedWords.includes(normalizeSwedish(seedWord)),
  );
  const source = availableSeedWords.length ? availableSeedWords : lexicon.seedWords;
  const index = Math.floor(randomValue * source.length);

  return source[index] ?? source[0] ?? 'spelar';
}

function getValidRoundWords(words: string[], letters: string[]) {
  return words
    .filter((word) => canBuildWord(word, letters))
    .sort((a, b) => b.length - a.length || a.localeCompare(b, 'sv-SE'));
}

export function createRoundFromSeedWord(
  lexicon: ReturnType<typeof createOrdstormLexicon>,
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
  const validWords = getValidRoundWords(lexicon.words, letters);

  return {
    seedWord: normalizedSeedWord,
    originalLetters: baseLetters,
    letters,
    shuffleAttempts: shuffleResult.attempts,
    validWords,
    validWordSet: new Set(validWords),
  };
}

export function createRound(
  lexicon: ReturnType<typeof createOrdstormLexicon>,
  recentSeedWords: string[] = [],
): OrdstormRound {
  let bestRound: OrdstormRound | null = null;

  for (let attempt = 0; attempt < MAX_SEED_SELECTION_ATTEMPTS; attempt += 1) {
    const candidateSeedWord = selectSeedWord(lexicon, recentSeedWords);
    const candidateRound = createRoundFromSeedWord(lexicon, candidateSeedWord);

    if (!bestRound || candidateRound.validWords.length > bestRound.validWords.length) {
      bestRound = candidateRound;
    }

    if (candidateRound.validWords.length >= MINIMUM_VALID_WORDS) {
      return candidateRound;
    }
  }

  return bestRound ?? createRoundFromSeedWord(lexicon, selectSeedWord(lexicon, []));
}
