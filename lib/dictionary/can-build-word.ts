import { createLetterPool } from "./letter-pool";
import { normalizeSwedish } from "./normalize-swedish";

export function canBuildWord(word: string, letters: string[]) {
  const normalizedWord = normalizeSwedish(word);
  const pool = createLetterPool(letters);

  for (const letter of normalizedWord) {
    if (!pool[letter]) {
      return false;
    }

    pool[letter] -= 1;
  }

  return true;
}
