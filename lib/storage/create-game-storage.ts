import { createLocalStorageStore } from "@/lib/storage/create-local-storage-store";

type CreateGameStorageOptions<T extends object> = {
  storageKey: string;
  changeEvent: string;
  defaultValue: T;
  logLabel: string;
  debugEnvKey?: string;
};

function shouldLogStorageWarning(debugEnvKey?: string) {
  return (
    process.env.NODE_ENV !== "production" ||
    (debugEnvKey !== undefined && process.env[debugEnvKey] === "true")
  );
}

export function createGameStorage<T extends object>({
  storageKey,
  changeEvent,
  defaultValue,
  logLabel,
  debugEnvKey,
}: CreateGameStorageOptions<T>) {
  return createLocalStorageStore<T>({
    storageKey,
    changeEvent,
    defaultValue,
    parse(rawValue, fallbackValue) {
      if (!rawValue) {
        return fallbackValue;
      }

      try {
        return { ...fallbackValue, ...JSON.parse(rawValue) };
      } catch {
        return fallbackValue;
      }
    },
    shouldLogWarning: shouldLogStorageWarning(debugEnvKey),
    logLabel,
  });
}
