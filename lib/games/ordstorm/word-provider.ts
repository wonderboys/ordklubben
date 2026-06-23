import { isWordBankAvailable, listActiveWords } from '@/lib/server/words/provider';
import type { OrdstormWordCatalog } from '@/lib/games/ordstorm/types';

const SEED_WORD_LENGTH = 6;

export async function loadOrdstormWordCatalog(): Promise<OrdstormWordCatalog | null> {
  if (!isWordBankAvailable()) {
    return null;
  }

  const words = await listActiveWords({
    minLength: 3,
    maxLength: 6,
  });

  if (words.length === 0) {
    return null;
  }

  const allowedWords = words.map((word) => word.normalizedAnswer);
  const commonWords = words
    .filter((word) => {
      if (word.difficulty !== null && word.difficulty <= 2) {
        return true;
      }

      return word.frequency !== null && word.frequency <= 5000;
    })
    .map((word) => word.normalizedAnswer);
  const seedWords = words
    .filter((word) => word.length === SEED_WORD_LENGTH)
    .sort((left, right) => {
      const difficultyOrder = (left.difficulty ?? 99) - (right.difficulty ?? 99);

      if (difficultyOrder !== 0) {
        return difficultyOrder;
      }

      const frequencyOrder =
        (left.frequency ?? Number.MAX_SAFE_INTEGER) - (right.frequency ?? Number.MAX_SAFE_INTEGER);

      if (frequencyOrder !== 0) {
        return frequencyOrder;
      }

      return left.answer.localeCompare(right.answer, 'sv-SE');
    })
    .map((word) => word.normalizedAnswer);

  return {
    allowedWords: [...new Set(allowedWords)],
    commonWords: [...new Set(commonWords.length > 0 ? commonWords : allowedWords)],
    seedWords: [
      ...new Set(
        seedWords.length > 0
          ? seedWords
          : allowedWords.filter((word) => word.length === SEED_WORD_LENGTH),
      ),
    ],
  };
}
