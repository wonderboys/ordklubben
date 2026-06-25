import type { StegvisPlaySession } from '@/lib/games/stegvis/types';
import { loadStegvisPlaySessionFromDb } from '@/lib/games/stegvis/content-provider';

export type {
  StegvisGeneratorDebugInfo,
  StegvisPlaySession,
  StegvisPuzzleSource,
} from '@/lib/games/stegvis/types';

export async function loadStegvisPlaySession(): Promise<StegvisPlaySession | null> {
  return loadStegvisPlaySessionFromDb();
}

export { STEGVIS_MIDDLE_STEP_COUNT } from '@/lib/games/stegvis/rules';
