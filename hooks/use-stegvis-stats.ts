"use client";

import { useSyncExternalStore } from "react";
import {
  defaultStegvisStats,
  loadStegvisStats,
  subscribeToStegvisStats,
  type StegvisStats,
} from "@/lib/storage/stegvis-stats";

export function useStegvisStats(): StegvisStats {
  return useSyncExternalStore(
    subscribeToStegvisStats,
    loadStegvisStats,
    () => defaultStegvisStats,
  );
}
