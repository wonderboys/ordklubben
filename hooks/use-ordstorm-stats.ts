"use client";

import { type OrdstormStats } from "@/lib/game/ordstorm";
import * as ordstormStatsStore from "@/lib/storage/ordstorm-stats";
import { useBrowserStore } from "@/hooks/use-browser-store";

export function useOrdstormStats(): OrdstormStats {
  return useBrowserStore({
    defaultValue: ordstormStatsStore.defaultStats,
    load: ordstormStatsStore.loadStats,
    subscribe: ordstormStatsStore.subscribeToStats,
  });
}
