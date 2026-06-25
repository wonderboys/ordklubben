export type StegvisPuzzle = {
  id: string;
  start: string;
  target: string;
  title: string;
  minimumSteps?: number;
  sampleSolution?: string[];
  startWordId?: string;
  targetWordId?: string;
};

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

export type StegvisPuzzleSource = 'edition';

export type StegvisGeneratorDebugInfo = {
  start: string;
  target: string;
  steps: number;
  score: number;
  chain: string[];
  missingClues: number;
};

export type StegvisPlaySession = {
  initialBundle: StegvisPuzzleBundle;
  fallbackBundles: StegvisPuzzleBundle[];
  source: StegvisPuzzleSource;
  allowedWords?: string[];
  generatorDebug?: StegvisGeneratorDebugInfo;
};
