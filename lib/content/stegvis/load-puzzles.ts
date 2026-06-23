import type { StegvisPuzzleBundle } from '@/lib/content/stegvis/types';

/**
 * Legacy static puzzle loading has been removed from runtime.
 * Stegvis should now be sourced from DB-backed providers/generators.
 */
export async function loadStegvisPuzzleBundles(): Promise<StegvisPuzzleBundle[]> {
  return [];
}
