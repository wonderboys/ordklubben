import { pickPrimaryClue } from '@/lib/content/stegvis/clue-display';
import type { StegvisGeneratorCorpus } from '@/lib/content/stegvis/generator/types';
import type { StegvisChainStep, StegvisPuzzleBundle } from '@/lib/content/stegvis/types';
import { findPathWithWordCount } from '@/lib/content/stegvis/word-graph/search';
import { normalizeGraphWord } from '@/lib/content/stegvis/word-graph/utils';
import { normalizeStegvisWord } from '@/lib/game/stegvis';

export const STEGVIS_MIDDLE_STEP_COUNT = 5;
export const STEGVIS_CHAIN_WORD_COUNT = STEGVIS_MIDDLE_STEP_COUNT + 2;

function toDisplayClue(clue: string | null): string {
  if (clue && clue.trim().length > 0) {
    return clue.trim();
  }

  return 'Nyckel saknas';
}

export function countMiddleSteps(chain: StegvisChainStep[]): number {
  return chain.filter((step) => step.role === 'middle').length;
}

export function chainMeetsPlayRequirement(chain: StegvisChainStep[]): boolean {
  return countMiddleSteps(chain) === STEGVIS_MIDDLE_STEP_COUNT;
}

export function buildChainStepsFromPath(
  path: string[],
  corpus: StegvisGeneratorCorpus,
): StegvisChainStep[] {
  return path.map((answer, index) => {
    const normalized = normalizeStegvisWord(answer);
    const graphAnswer = normalizeGraphWord(answer);
    const word = corpus.wordsByAnswer.get(graphAnswer);
    const primary = word ? pickPrimaryClue(word.clues) : null;
    const role = index === 0 ? 'start' : index === path.length - 1 ? 'target' : 'middle';

    return {
      answer: normalized,
      displayAnswer: normalized.toLocaleUpperCase('sv-SE'),
      clueText: word ? toDisplayClue(primary?.text ?? null) : normalized.toLocaleUpperCase('sv-SE'),
      wordId: word?.id ?? null,
      role,
    };
  });
}

export function extendBundleToPlayChain(
  bundle: StegvisPuzzleBundle,
  corpus: StegvisGeneratorCorpus,
): StegvisPuzzleBundle | null {
  if (chainMeetsPlayRequirement(bundle.chain)) {
    return bundle;
  }

  const start = bundle.chain[0];
  const target = bundle.chain[bundle.chain.length - 1];

  if (!start || !target) {
    return null;
  }

  const path = findPathWithWordCount(
    start.answer,
    target.answer,
    STEGVIS_CHAIN_WORD_COUNT,
    corpus.graph,
  );

  if (!path) {
    return null;
  }

  const chain = buildChainStepsFromPath(path, corpus);
  const sampleSolution = chain.map((step) => step.answer);

  return {
    ...bundle,
    puzzle: {
      ...bundle.puzzle,
      minimumSteps: STEGVIS_MIDDLE_STEP_COUNT,
      sampleSolution,
    },
    start: {
      wordId: chain[0].wordId,
      answer: chain[0].displayAnswer,
      clueText: chain[0].clueText,
    },
    target: {
      wordId: chain[chain.length - 1].wordId,
      answer: chain[chain.length - 1].displayAnswer,
      clueText: chain[chain.length - 1].clueText,
    },
    chain,
  };
}
