import { isWordBankAvailable, listActiveWordsWithClues } from '@/lib/server/words/provider';
import type { SkrapetPuzzle } from '@/lib/games/skrapet/types';

export async function loadSkrapetPuzzles(): Promise<SkrapetPuzzle[]> {
  if (!isWordBankAvailable()) {
    return [];
  }

  const words = await listActiveWordsWithClues({
    minLength: 4,
    maxLength: 10,
  });

  return words
    .filter((word) => word.clues.length >= 4)
    .map((word) => ({
      word: word.answer.toLocaleUpperCase('sv-SE'),
      clues: word.clues.slice(0, 6).map((clue) => clue.text),
    }))
    .filter((puzzle) => puzzle.clues.length >= 4);
}
