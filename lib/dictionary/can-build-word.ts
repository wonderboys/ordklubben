import { createLetterPool } from "@/lib/dictionary/letter-pool";
import { normalizeSwedish } from "@/lib/dictionary/normalize-swedish";

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
