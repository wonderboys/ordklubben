type CreateLocalStorageStoreOptions<T> = {
  storageKey: string;
  changeEvent: string;
  defaultValue: T;
  parse?: (rawValue: string | null, defaultValue: T) => T;
  serialize?: (value: T) => string;
  shouldLogWarning?: boolean;
  logLabel?: string;
};

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

function defaultParse<T>(rawValue: string | null, defaultValue: T): T {
  if (!rawValue) {
    return defaultValue;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return defaultValue;
  }
}

function defaultSerialize<T>(value: T): string {
  return JSON.stringify(value);
}

export function createLocalStorageStore<T>({
  storageKey,
  changeEvent,
  defaultValue,
  parse = defaultParse,
  serialize = defaultSerialize,
  shouldLogWarning = false,
  logLabel = "LocalStorageStore",
}: CreateLocalStorageStoreOptions<T>) {
  let cachedRawValue: string | null = null;
  let cachedValue: T = defaultValue;

  function logStorageWarning(action: "load" | "save", error: unknown) {
    if (!shouldLogWarning) {
      return;
    }

    console.error(`[${logLabel}][localStorage][${action}]`, error);
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
      cachedValue = parse(rawValue, defaultValue);
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

    const rawValue = serialize(value);
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

    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === storageKey) {
        onStoreChange();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(changeEvent, onStoreChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(changeEvent, onStoreChange);
    };
  }

  return {
    defaultValue,
    load,
    save,
    subscribe,
  };
}
