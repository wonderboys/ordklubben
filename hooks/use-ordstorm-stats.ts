"use client";

import { useSyncExternalStore } from "react";
import { type OrdstormStats } from "@/lib/game/ordstorm";
import {
  defaultStats,
  loadStats,
  subscribeToStats,
} from "@/lib/storage/ordstorm-stats";

export function useOrdstormStats(): OrdstormStats {
  return useSyncExternalStore(
    subscribeToStats,
    loadStats,
    () => defaultStats,
  );
}
