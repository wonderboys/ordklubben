import type { StegvisPuzzleBundle } from '@/lib/content/stegvis/types';

/**
 * Stegvis play sessions load from GameEdition via lib/games/stegvis/content-provider.ts.
 * The generator in lib/content/stegvis/generator/ is Content Pipeline only.
 */
export async function loadStegvisPuzzleBundles(): Promise<StegvisPuzzleBundle[]> {
  return [];
}
