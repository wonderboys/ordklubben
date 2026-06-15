import { stegvisPuzzles } from '@/data/stegvis/puzzles';
import { loadStegvisPuzzleBundle } from '@/lib/content/stegvis/load-puzzle-bundle';
import type { StegvisPuzzleBundle } from '@/lib/content/stegvis/types';

export async function loadStegvisPuzzleBundles(): Promise<StegvisPuzzleBundle[]> {
  return Promise.all(stegvisPuzzles.map(loadStegvisPuzzleBundle));
}
