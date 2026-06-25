import type { StegvisGeneratedPuzzle } from '@/lib/content/stegvis/generator/types';
import type { StegvisChainStep, StegvisPuzzleBundle } from '@/lib/games/stegvis/types';
import { normalizeStegvisWord } from '@/lib/games/stegvis/rules';

function toPlayAnswer(answer: string): string {
  return normalizeStegvisWord(answer);
}

function toDisplayClue(clue: string | null): string {
  if (clue && clue.trim().length > 0) {
    return clue.trim();
  }

  return 'Nyckel saknas';
}

export function generatedPuzzleToBundle(puzzle: StegvisGeneratedPuzzle): StegvisPuzzleBundle {
  const start = toPlayAnswer(puzzle.start.answer);
  const target = toPlayAnswer(puzzle.target.answer);
  const sampleSolution = puzzle.path.map((slot) => toPlayAnswer(slot.answer));

  const chain: StegvisChainStep[] = puzzle.path.map((slot, index) => {
    const answer = toPlayAnswer(slot.answer);
    const role = index === 0 ? 'start' : index === puzzle.path.length - 1 ? 'target' : 'middle';

    return {
      answer,
      displayAnswer: answer.toLocaleUpperCase('sv-SE'),
      clueText: toDisplayClue(slot.clue),
      wordId: slot.wordId,
      role,
    };
  });

  return {
    puzzle: {
      id: `generated-${start}-${target}`,
      start,
      target,
      title: `${start} till ${target}`,
      minimumSteps: puzzle.stats.steps,
      sampleSolution,
      startWordId: puzzle.start.wordId,
      targetWordId: puzzle.target.wordId,
    },
    start: {
      wordId: puzzle.start.wordId,
      answer: puzzle.start.answer,
      clueText: toDisplayClue(puzzle.start.clue),
    },
    target: {
      wordId: puzzle.target.wordId,
      answer: puzzle.target.answer,
      clueText: toDisplayClue(puzzle.target.clue),
    },
    chain,
  };
}
