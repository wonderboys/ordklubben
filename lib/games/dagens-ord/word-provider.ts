import { isWordBankAvailable, listActiveWords } from '@/lib/server/words/provider';
import type { DagensOrdWordCatalog } from '@/lib/games/dagens-ord/types';

function getDayKey(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return start.toISOString().slice(0, 10);
}

function getDailyWordIndex(wordCount: number, date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNumber = Math.floor(start.getTime() / (24 * 60 * 60 * 1000));

  return wordCount === 0 ? 0 : dayNumber % wordCount;
}

export async function loadDagensOrdCatalog(
  date = new Date(),
): Promise<DagensOrdWordCatalog | null> {
  if (!isWordBankAvailable()) {
    return null;
  }

  const words = await listActiveWords({
    minLength: 5,
    maxLength: 5,
  });

  const allowedWords = [...new Set(words.map((word) => word.normalizedAnswer))].sort((a, b) =>
    a.localeCompare(b, 'sv-SE'),
  );

  if (allowedWords.length === 0) {
    return null;
  }

  const targetWord = allowedWords[getDailyWordIndex(allowedWords.length, date)] ?? allowedWords[0];

  return {
    dayKey: getDayKey(date),
    targetWord,
    allowedWords,
  };
}
