import { canBuildWord } from "@/lib/dictionary/can-build-word";
import {
  hasOnlySwedishLetters,
  normalizeSwedish,
} from "@/lib/dictionary/normalize-swedish";

export type WordValidationReason =
  | "empty"
  | "invalid_characters"
  | "invalid_length"
  | "already_found"
  | "not_allowed"
  | "cannot_build";

export type WordValidationResult =
  | { ok: true; word: string }
  | { ok: false; word: string; reason: WordValidationReason };

type ValidateWordInput = {
  value: string;
  letters: string[];
  allowedWords: Set<string>;
  blockedWords?: Iterable<string>;
  minLength?: number;
  maxLength?: number;
};

export function validateWord({
  value,
  letters,
  allowedWords,
  blockedWords = [],
  minLength = 3,
  maxLength = 6,
}: ValidateWordInput): WordValidationResult {
  const word = normalizeSwedish(value);

  if (!word.length) {
    return { ok: false, word, reason: "empty" };
  }

  if (!hasOnlySwedishLetters(word)) {
    return { ok: false, word, reason: "invalid_characters" };
  }

  if (word.length < minLength || word.length > maxLength) {
    return { ok: false, word, reason: "invalid_length" };
  }

  const blockedWordSet = new Set(
    Array.from(blockedWords, (candidate) => normalizeSwedish(candidate)),
  );

  if (blockedWordSet.has(word)) {
    return { ok: false, word, reason: "already_found" };
  }

  if (!allowedWords.has(word)) {
    return { ok: false, word, reason: "not_allowed" };
  }

  if (!canBuildWord(word, letters)) {
    return { ok: false, word, reason: "cannot_build" };
  }

  return { ok: true, word };
}
