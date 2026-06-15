'use client';

import { type OrdstormStats } from '@/lib/game/ordstorm';
import { useBrowserStore } from '@/hooks/use-browser-store';
import { ordstormStatsStore } from '@/lib/storage/ordstorm-stats';

export function useOrdstormStats(): OrdstormStats {
  return useBrowserStore(ordstormStatsStore);
}
