import type { WordGraph } from '@/lib/content/stegvis/word-graph/types';
import { normalizeGraphWord } from '@/lib/content/stegvis/word-graph/utils';

/**
 * Finds the shortest path between start and target using BFS.
 * Returns normalized uppercase words, or null when no path exists.
 */
export function findShortestPath(start: string, target: string, graph: WordGraph): string[] | null {
  const startWord = normalizeGraphWord(start);
  const targetWord = normalizeGraphWord(target);

  if (startWord.length === 0 || targetWord.length === 0) {
    return null;
  }

  if (startWord === targetWord) {
    return [startWord];
  }

  if (startWord.length !== targetWord.length) {
    return null;
  }

  if (!graph.has(startWord) || !graph.has(targetWord)) {
    return null;
  }

  const queue: string[] = [startWord];
  const visited = new Set<string>([startWord]);
  const parent = new Map<string, string | null>([[startWord, null]]);

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      break;
    }

    if (current === targetWord) {
      const path: string[] = [];
      let node: string | null | undefined = targetWord;

      while (node) {
        path.unshift(node);
        node = parent.get(node) ?? null;
      }

      return path;
    }

    const neighbors = graph.get(current);

    if (!neighbors) {
      continue;
    }

    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) {
        continue;
      }

      visited.add(neighbor);
      parent.set(neighbor, current);
      queue.push(neighbor);
    }
  }

  return null;
}

/**
 * Finds a path with an exact number of words (including start and target).
 * Uses BFS and returns the first valid path found.
 */
export function findPathWithWordCount(
  start: string,
  target: string,
  wordCount: number,
  graph: WordGraph,
): string[] | null {
  const startWord = normalizeGraphWord(start);
  const targetWord = normalizeGraphWord(target);

  if (startWord.length === 0 || targetWord.length === 0 || wordCount < 2) {
    return null;
  }

  if (startWord.length !== targetWord.length) {
    return null;
  }

  if (!graph.has(startWord) || !graph.has(targetWord)) {
    return null;
  }

  if (wordCount === 2) {
    return startWord === targetWord ? [startWord] : null;
  }

  const queue: string[][] = [[startWord]];

  while (queue.length > 0) {
    const path = queue.shift();

    if (!path) {
      break;
    }

    const current = path[path.length - 1];

    if (path.length === wordCount) {
      if (current === targetWord) {
        return path;
      }

      continue;
    }

    const neighbors = graph.get(current);

    if (!neighbors) {
      continue;
    }

    for (const neighbor of neighbors) {
      if (path.includes(neighbor)) {
        continue;
      }

      queue.push([...path, neighbor]);
    }
  }

  return null;
}
