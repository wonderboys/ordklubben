import { buildWordGraphForLength } from '@/lib/content/stegvis/word-graph/graph';
import type { WordGraph, WordGraphLoadOptions } from '@/lib/content/stegvis/word-graph/types';
import { DEFAULT_WORD_GRAPH_LENGTH } from '@/lib/content/stegvis/word-graph/types';
import { isWordBankAvailable, listActiveWords } from '@/lib/server/words';

/**
 * Loads normalized answers for approved words from ordbanken.
 * Returns an empty list when the database is unavailable.
 */
export async function loadApprovedWordsForGraph(
  options: WordGraphLoadOptions = {},
): Promise<string[]> {
  if (!isWordBankAvailable()) {
    return [];
  }

  const length = options.length ?? DEFAULT_WORD_GRAPH_LENGTH;

  const words = await listActiveWords({
    minLength: length,
    maxLength: length,
  });

  return words.map((word) => word.normalizedAnswer);
}

/**
 * Builds a word graph from approved ordbanksord.
 * Defaults to 4-letter words.
 */
export async function loadWordGraphFromBank(
  options: WordGraphLoadOptions = {},
): Promise<WordGraph> {
  const length = options.length ?? DEFAULT_WORD_GRAPH_LENGTH;
  const words = await loadApprovedWordsForGraph({ length });

  return buildWordGraphForLength(words, length);
}
