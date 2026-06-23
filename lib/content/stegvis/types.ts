import type { StegvisPuzzle } from '@/lib/games/stegvis/types';

export type StegvisWordEndpoint = {
  wordId: string | null;
  answer: string;
  clueText: string;
};

export type StegvisChainStepRole = 'start' | 'middle' | 'target';

export type StegvisChainStep = {
  answer: string;
  displayAnswer: string;
  clueText: string;
  wordId: string | null;
  role: StegvisChainStepRole;
};

export type StegvisPuzzleBundle = {
  puzzle: StegvisPuzzle;
  start: StegvisWordEndpoint;
  target: StegvisWordEndpoint;
  chain: StegvisChainStep[];
};
