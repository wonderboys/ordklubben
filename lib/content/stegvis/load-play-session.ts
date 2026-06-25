import type { StegvisPuzzleBundle } from '@/lib/content/stegvis/types';
import { loadStegvisPlaySessionFromDb } from '@/lib/games/stegvis/content-provider';

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

export async function loadStegvisPlaySession(): Promise<StegvisPlaySession | null> {
  return loadStegvisPlaySessionFromDb();
}

export { STEGVIS_MIDDLE_STEP_COUNT } from '@/lib/content/stegvis/play-chain';
