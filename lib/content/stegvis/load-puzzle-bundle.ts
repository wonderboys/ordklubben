import type { StegvisPuzzle } from '@/data/stegvis/puzzles';
import { normalizeAnswer } from '@/lib/content/normalize-answer';
import { formatStegvisEndpointClue } from '@/lib/content/stegvis/clue-display';
import type {
  StegvisChainStep,
  StegvisPuzzleBundle,
  StegvisWordEndpoint,
} from '@/lib/content/stegvis/types';
import {
  getWordWithClues,
  getWordWithCluesByNormalizedAnswer,
  isWordBankAvailable,
} from '@/lib/content/word-bank';
import { normalizeStegvisWord } from '@/lib/game/stegvis';

function displayStegvisAnswer(answer: string): string {
  return normalizeStegvisWord(answer).toLocaleUpperCase('sv-SE');
}

function createFallbackEndpoint(answer: string, wordId?: string): StegvisWordEndpoint {
  const displayAnswer = displayStegvisAnswer(answer);

  return {
    wordId: wordId ?? null,
    answer: displayAnswer,
    clueText: displayAnswer,
  };
}

async function resolveStegvisWordEndpoint(
  answer: string,
  wordId?: string,
): Promise<StegvisWordEndpoint> {
  const displayAnswer = displayStegvisAnswer(answer);
  const fallback = createFallbackEndpoint(answer, wordId);

  if (!isWordBankAvailable()) {
    return fallback;
  }

  try {
    let wordWithClues = wordId ? await getWordWithClues(wordId) : null;

    if (!wordWithClues) {
      const { normalizedAnswer } = normalizeAnswer(answer);
      wordWithClues = await getWordWithCluesByNormalizedAnswer(normalizedAnswer);
    }

    if (!wordWithClues) {
      return fallback;
    }

    return {
      wordId: wordWithClues.id,
      answer: displayAnswer,
      clueText: formatStegvisEndpointClue({
        answer: displayAnswer,
        wordId: wordWithClues.id,
        clues: wordWithClues.clues,
      }),
    };
  } catch {
    return fallback;
  }
}

async function buildChainFromSolution(
  puzzle: StegvisPuzzle,
  start: StegvisWordEndpoint,
  target: StegvisWordEndpoint,
): Promise<StegvisChainStep[]> {
  const solutionWords =
    puzzle.sampleSolution && puzzle.sampleSolution.length >= 2
      ? puzzle.sampleSolution
      : [puzzle.start, puzzle.target];

  const endpoints = await Promise.all(
    solutionWords.map((word, index) => {
      if (index === 0) {
        return Promise.resolve(start);
      }

      if (index === solutionWords.length - 1) {
        return Promise.resolve(target);
      }

      return resolveStegvisWordEndpoint(word);
    }),
  );

  return solutionWords.map((word, index) => {
    const answer = normalizeStegvisWord(word);
    const endpoint = endpoints[index];

    return {
      answer,
      displayAnswer: answer.toLocaleUpperCase('sv-SE'),
      clueText: endpoint.clueText,
      wordId: endpoint.wordId,
      role: index === 0 ? 'start' : index === solutionWords.length - 1 ? 'target' : 'middle',
    };
  });
}

export async function loadStegvisPuzzleBundle(puzzle: StegvisPuzzle): Promise<StegvisPuzzleBundle> {
  const [start, target] = await Promise.all([
    resolveStegvisWordEndpoint(puzzle.start, puzzle.startWordId),
    resolveStegvisWordEndpoint(puzzle.target, puzzle.targetWordId),
  ]);

  const chain = await buildChainFromSolution(puzzle, start, target);

  return { puzzle, start, target, chain };
}
