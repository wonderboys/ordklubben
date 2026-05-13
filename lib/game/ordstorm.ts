import { allowedSvWords } from "@/data/words/allowed-sv";
import { commonSvWords } from "@/data/words/common-sv";
import { seedWordsSv } from "@/data/words/seed-words-sv";
import { canBuildWord } from "@/lib/dictionary/can-build-word";
import { normalizeSwedish } from "@/lib/dictionary/normalize-swedish";
import { shuffleLetters } from "@/lib/dictionary/letter-pool";

export const GAME_DURATION_SECONDS = 60;
export const ORDSTORM_MIN_WORD_LENGTH = 3;
export const ORDSTORM_MAX_WORD_LENGTH = 6;
export const ORDSTORM_FULL_WORD_BONUS = 300;

export type OrdstormRound = {
  seedWord: string;
  letters: string[];
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
    (word) =>
      word.length >= ORDSTORM_MIN_WORD_LENGTH &&
      word.length <= ORDSTORM_MAX_WORD_LENGTH,
  )
  .sort((a, b) => a.localeCompare(b, "sv-SE"));

export const ORDSTORM_WORD_SET = new Set(ORDSTORM_WORDS);

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

export function createRoundFromSeedWord(
  seedWord: string,
  options?: { shuffleLetters?: boolean },
): OrdstormRound {
  const normalizedSeedWord = normalizeSwedish(seedWord);
  const baseLetters = normalizedSeedWord.toLocaleUpperCase("sv-SE").split("");
  const letters =
    options?.shuffleLetters === false
      ? baseLetters
      : shuffleLetters(baseLetters);
  const validWords = ORDSTORM_WORDS.filter((word) =>
    canBuildWord(word, letters),
  ).sort((a, b) => b.length - a.length || a.localeCompare(b, "sv-SE"));

  return {
    seedWord: normalizedSeedWord,
    letters,
    validWords,
    validWordSet: new Set(validWords),
  };
}

export function createInitialRound(): OrdstormRound {
  return createRoundFromSeedWord(seedWordsSv[0] ?? "spelar", {
    shuffleLetters: false,
  });
}

export function createRound(): OrdstormRound {
  const seedWord =
    seedWordsSv[Math.floor(Math.random() * seedWordsSv.length)] ?? "spelar";

  return createRoundFromSeedWord(seedWord);
}
