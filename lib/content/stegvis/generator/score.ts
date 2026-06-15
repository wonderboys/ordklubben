import { pickPrimaryClue } from '../clue-display';
import type { WordBankWordWithClues } from '@/lib/content/word-bank/types';
import type {
  StegvisGeneratedPuzzle,
  StegvisGeneratedWordSlot,
  StegvisGeneratorCorpus,
} from './types';

export function toWordSlot(word: WordBankWordWithClues): StegvisGeneratedWordSlot {
  const primary = pickPrimaryClue(word.clues);
  const clueText = primary?.text ?? null;

  return {
    wordId: word.id,
    answer: word.normalizedAnswer,
    clue: clueText,
    hasClue: Boolean(clueText),
  };
}

export function hasDefinitionClue(word: WordBankWordWithClues): boolean {
  return word.clues.some((clue) => clue.type === 'DEFINITION' && clue.text.trim().length > 0);
}

export function countSamePrefixSteps(path: string[]): number {
  let count = 0;

  for (let index = 0; index < path.length - 1; index += 1) {
    const left = path[index];
    const right = path[index + 1];

    if (
      left.length === right.length &&
      left.length > 1 &&
      left.slice(0, -1) === right.slice(0, -1)
    ) {
      count += 1;
    }
  }

  return count;
}

export function scoreStegvisPuzzle(options: {
  puzzle: StegvisGeneratedPuzzle;
  corpus: StegvisGeneratorCorpus;
  minSteps: number;
  maxSteps: number;
}): number {
  const { puzzle, corpus, minSteps, maxSteps } = options;
  const { path, stats } = puzzle;

  let score = 0;
  const missingClues = path.filter((slot) => !slot.hasClue).length;

  score -= missingClues * 15;

  if (missingClues === 0) {
    score += 25;
  }

  const targetSteps = (minSteps + maxSteps) / 2;
  score -= Math.abs(stats.steps - targetSteps) * 4;

  const startWord = corpus.wordsByAnswer.get(path[0]?.answer ?? '');
  const targetWord = corpus.wordsByAnswer.get(path[path.length - 1]?.answer ?? '');

  if (startWord && hasDefinitionClue(startWord)) {
    score += 12;
  }

  if (targetWord && hasDefinitionClue(targetWord)) {
    score += 12;
  }

  for (const slot of path) {
    const word = corpus.wordsByAnswer.get(slot.answer);

    if (!word) {
      continue;
    }

    if (word.frequency != null) {
      if (word.frequency >= 0.5) {
        score += 5;
      } else if (word.frequency < 0.2) {
        score -= 10;
      }
    } else if (word.crosswordScore != null && word.crosswordScore < 30) {
      score -= 6;
    } else {
      score -= 4;
    }
  }

  score -= countSamePrefixSteps(path.map((slot) => slot.answer)) * 6;

  if (stats.steps <= minSteps) {
    score -= 8;
  }

  return score;
}
