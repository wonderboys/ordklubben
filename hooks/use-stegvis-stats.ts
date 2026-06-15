'use client';

import { useBrowserStore } from '@/hooks/use-browser-store';
import { stegvisStatsStore, type StegvisStats } from '@/lib/storage/stegvis-stats';

export function useStegvisStats(): StegvisStats {
  return useBrowserStore(stegvisStatsStore);
}
