// Node-runnable mirror of lib/content/stegvis/word-graph (relative imports, no @/ alias).
import { normalizeAnswer } from '../lib/content/normalize-answer.ts';

export type WordGraph = Map<string, Set<string>>;

export function normalizeGraphWord(word: string): string {
  const { normalizedAnswer } = normalizeAnswer(word.trim());
  return normalizedAnswer;
}

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
