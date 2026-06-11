import { normalizeAnswer } from "@/lib/content/normalize-answer";

/**
 * Normalizes a word for graph comparisons: trim, NFC, uppercase, no whitespace.
 * Example: `horn` → `HORN`
 */
export function normalizeGraphWord(word: string): string {
  const { normalizedAnswer } = normalizeAnswer(word.trim());
  return normalizedAnswer;
}

/**
 * Returns true when two words have the same length and differ in exactly one letter.
 * Same word or different lengths return false.
 */
export function isOneLetterApart(a: string, b: string): boolean {
  const left = normalizeGraphWord(a);
  const right = normalizeGraphWord(b);

  if (left.length === 0 || right.length === 0) {
    return false;
  }

  if (left === right || left.length !== right.length) {
    return false;
  }

  let differences = 0;

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      differences += 1;

      if (differences > 1) {
        return false;
      }
    }
  }

  return differences === 1;
}
