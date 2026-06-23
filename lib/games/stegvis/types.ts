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
