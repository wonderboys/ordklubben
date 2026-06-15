import type { WordBankWordWithClues } from '@/lib/content/word-bank/types';
import { buildWordGraph, findShortestPath } from '../word-graph';
import { scoreStegvisPuzzle, toWordSlot } from './score';
import {
  DEFAULT_STEGVIS_GENERATOR_OPTIONS,
  type GenerateStegvisPuzzleOptions,
  type GenerateStegvisPuzzleResult,
  type StegvisGeneratedPuzzle,
  type StegvisGeneratorCorpus,
} from './types';

function createRandom(seed?: number) {
  if (seed === undefined) {
    return Math.random;
  }

  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export function buildStegvisGeneratorCorpus(
  words: WordBankWordWithClues[],
): StegvisGeneratorCorpus {
  const graph = buildWordGraph(words.map((word) => word.normalizedAnswer));
  const wordsByAnswer = new Map(words.map((word) => [word.normalizedAnswer, word]));

  const connectedWords = words.filter((word) => graph.has(word.normalizedAnswer));

  return {
    words: connectedWords,
    graph,
    wordsByAnswer,
  };
}

function getEligibleWords(corpus: StegvisGeneratorCorpus): WordBankWordWithClues[] {
  return corpus.words.filter((word) => {
    const neighbors = corpus.graph.get(word.normalizedAnswer);
    return neighbors !== undefined && neighbors.size > 0;
  });
}

function orderCandidates(
  words: WordBankWordWithClues[],
  random: () => number,
): WordBankWordWithClues[] {
  const withClues = words.filter((word) => word.clues.length > 0);
  const withoutClues = words.filter((word) => word.clues.length === 0);

  return [...shuffle(withClues, random), ...shuffle(withoutClues, random)];
}

function buildPuzzleFromPath(
  path: string[],
  corpus: StegvisGeneratorCorpus,
  length: number,
  pathsTried: number,
  candidates: number,
): StegvisGeneratedPuzzle | null {
  const slots = path.map((answer) => {
    const word = corpus.wordsByAnswer.get(answer);
    return word ? toWordSlot(word) : null;
  });

  if (slots.some((slot) => slot === null)) {
    return null;
  }

  const resolvedSlots = slots as NonNullable<(typeof slots)[number]>[];
  const steps = resolvedSlots.length - 1;
  const missingClues = resolvedSlots.filter((slot) => !slot.hasClue).length;

  const puzzle: StegvisGeneratedPuzzle = {
    start: resolvedSlots[0],
    target: resolvedSlots[resolvedSlots.length - 1],
    path: resolvedSlots,
    stats: {
      length,
      steps,
      candidates,
      pathsTried,
      missingClues,
      score: 0,
    },
  };

  return puzzle;
}

export function generateStegvisPuzzleFromCorpus(
  corpus: StegvisGeneratorCorpus,
  options: GenerateStegvisPuzzleOptions = {},
): GenerateStegvisPuzzleResult {
  const length = options.length ?? DEFAULT_STEGVIS_GENERATOR_OPTIONS.length;
  const minSteps = options.minSteps ?? DEFAULT_STEGVIS_GENERATOR_OPTIONS.minSteps;
  const maxSteps = options.maxSteps ?? DEFAULT_STEGVIS_GENERATOR_OPTIONS.maxSteps;
  const requiredMiddleCount = options.requiredMiddleCount;
  const maxAttempts = options.maxAttempts ?? DEFAULT_STEGVIS_GENERATOR_OPTIONS.maxAttempts;
  const random = createRandom(options.seed);

  const eligible = orderCandidates(getEligibleWords(corpus), random);

  if (eligible.length < 2) {
    return {
      ok: false,
      reason: 'För få ord med giltiga grannar i ordgrafen.',
      stats: {
        length,
        candidates: eligible.length,
        pathsTried: 0,
      },
    };
  }

  let pathsTried = 0;
  let bestPuzzle: StegvisGeneratedPuzzle | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  const starts = shuffle(eligible, random);

  outer: for (const startWord of starts) {
    const targets = shuffle(
      eligible.filter((word) => word.id !== startWord.id),
      random,
    );

    for (const targetWord of targets) {
      if (pathsTried >= maxAttempts) {
        break outer;
      }

      pathsTried += 1;

      const path = findShortestPath(
        startWord.normalizedAnswer,
        targetWord.normalizedAnswer,
        corpus.graph,
      );

      if (!path) {
        continue;
      }

      const steps = path.length - 1;
      const middleCount = path.length - 2;

      if (requiredMiddleCount !== undefined && middleCount !== requiredMiddleCount) {
        continue;
      }

      if (steps < minSteps || steps > maxSteps) {
        continue;
      }

      const puzzle = buildPuzzleFromPath(path, corpus, length, pathsTried, eligible.length);

      if (!puzzle) {
        continue;
      }

      const score = scoreStegvisPuzzle({
        puzzle,
        corpus,
        minSteps,
        maxSteps,
      });

      puzzle.stats.score = score;

      if (score > bestScore) {
        bestScore = score;
        bestPuzzle = puzzle;
      }

      if (score >= 45 && puzzle.stats.missingClues === 0) {
        break outer;
      }
    }
  }

  if (!bestPuzzle) {
    return {
      ok: false,
      reason: 'Ingen kedja hittades inom steg-intervallet.',
      stats: {
        length,
        candidates: eligible.length,
        pathsTried,
      },
    };
  }

  return {
    ok: true,
    puzzle: bestPuzzle,
  };
}
