"use client";

import { useSyncExternalStore } from "react";

type BrowserStore<T> = {
  defaultValue: T;
  load: () => T;
  subscribe: (onStoreChange: () => void) => () => void;
};

export function useBrowserStore<T>(store: BrowserStore<T>): T {
  return useSyncExternalStore(
    store.subscribe,
    store.load,
    () => store.defaultValue,
  );
}
