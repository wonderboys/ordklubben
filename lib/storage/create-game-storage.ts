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

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createGameStorage<T extends object>({
  storageKey,
  changeEvent,
  defaultValue,
  logLabel,
  debugEnvKey,
}: CreateGameStorageOptions<T>) {
  let cachedRawValue: string | null = null;
  let cachedValue: T = defaultValue;

  function logStorageWarning(action: "load" | "save", error: unknown) {
    if (!shouldLogStorageWarning(debugEnvKey)) {
      return;
    }

    console.error(`[${logLabel}][localStorage][${action}]`, error);
  }

  function parseValue(rawValue: string | null): T {
    if (!rawValue) {
      return defaultValue;
    }

    try {
      return { ...defaultValue, ...JSON.parse(rawValue) };
    } catch {
      return defaultValue;
    }
  }

  function load(): T {
    const storage = getStorage();

    if (!storage) {
      return defaultValue;
    }

    try {
      const rawValue = storage.getItem(storageKey);

      if (rawValue === cachedRawValue) {
        return cachedValue;
      }

      cachedRawValue = rawValue;
      cachedValue = parseValue(rawValue);
      return cachedValue;
    } catch (error) {
      logStorageWarning("load", error);
      cachedRawValue = null;
      cachedValue = defaultValue;
      return defaultValue;
    }
  }

  function save(value: T) {
    const storage = getStorage();

    if (!storage) {
      return;
    }

    const rawValue = JSON.stringify(value);
    cachedRawValue = rawValue;
    cachedValue = value;

    try {
      storage.setItem(storageKey, rawValue);
    } catch (error) {
      logStorageWarning("save", error);
      return;
    }

    window.dispatchEvent(new Event(changeEvent));
  }

  function subscribe(onStoreChange: () => void) {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const listener = () => onStoreChange();

    window.addEventListener("storage", listener);
    window.addEventListener(changeEvent, listener);

    return () => {
      window.removeEventListener("storage", listener);
      window.removeEventListener(changeEvent, listener);
    };
  }

  return {
    defaultValue,
    load,
    save,
    subscribe,
  };
}
