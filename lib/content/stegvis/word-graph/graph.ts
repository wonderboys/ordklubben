import type { WordGraph } from '@/lib/content/stegvis/word-graph/types';
import { isOneLetterApart, normalizeGraphWord } from '@/lib/content/stegvis/word-graph/utils';

function uniqueNormalizedWords(words: string[]): string[] {
  const seen = new Set<string>();

  for (const word of words) {
    const normalized = normalizeGraphWord(word);

    if (normalized.length > 0) {
      seen.add(normalized);
    }
  }

  return [...seen];
}

export function groupWordsByLength(words: string[]): Map<number, string[]> {
  const groups = new Map<number, string[]>();

  for (const word of uniqueNormalizedWords(words)) {
    const length = word.length;
    const bucket = groups.get(length) ?? [];
    bucket.push(word);
    groups.set(length, bucket);
  }

  for (const bucket of groups.values()) {
    bucket.sort((left, right) => left.localeCompare(right, 'sv'));
  }

  return groups;
}

/**
 * Returns all words in `words` that are one letter apart from `word`.
 */
export function getNeighbors(word: string, words: string[]): string[] {
  const normalized = normalizeGraphWord(word);

  if (normalized.length === 0) {
    return [];
  }

  const neighbors: string[] = [];

  for (const candidate of words) {
    const normalizedCandidate = normalizeGraphWord(candidate);

    if (normalizedCandidate.length !== normalized.length || normalizedCandidate === normalized) {
      continue;
    }

    if (isOneLetterApart(normalized, normalizedCandidate)) {
      neighbors.push(normalizedCandidate);
    }
  }

  return neighbors.sort((left, right) => left.localeCompare(right, 'sv'));
}

/**
 * Builds an undirected adjacency map. Words are grouped by length so only
 * same-length pairs are compared.
 */
export function buildWordGraph(words: string[]): WordGraph {
  const graph: WordGraph = new Map();
  const groups = groupWordsByLength(words);

  for (const lengthWords of groups.values()) {
    for (const word of lengthWords) {
      if (!graph.has(word)) {
        graph.set(word, new Set());
      }
    }

    for (let leftIndex = 0; leftIndex < lengthWords.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < lengthWords.length; rightIndex += 1) {
        const left = lengthWords[leftIndex];
        const right = lengthWords[rightIndex];

        if (!isOneLetterApart(left, right)) {
          continue;
        }

        graph.get(left)?.add(right);
        graph.get(right)?.add(left);
      }
    }
  }

  return graph;
}

export function buildWordGraphForLength(words: string[], length: number): WordGraph {
  const filtered = uniqueNormalizedWords(words).filter((word) => word.length === length);

  return buildWordGraph(filtered);
}
