"use client";

import * as stegvisStatsStore from "@/lib/storage/stegvis-stats";
import { useBrowserStore } from "@/hooks/use-browser-store";
import { type StegvisStats } from "@/lib/storage/stegvis-stats";

export function useStegvisStats(): StegvisStats {
  return useBrowserStore({
    defaultValue: stegvisStatsStore.defaultStegvisStats,
    load: stegvisStatsStore.loadStegvisStats,
    subscribe: stegvisStatsStore.subscribeToStegvisStats,
  });
}
