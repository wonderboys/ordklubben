import { WORD_SOURCES, type WordSource } from "@/lib/content/constants";

const LEGACY_IMPORT_SOURCES = new Set(["stegvis_seed", "fotboll_seed"]);

export function normalizeWordSource(value: string | null | undefined): WordSource {
  const trimmed = value?.trim().toLowerCase();

  if (!trimmed) {
    return "manual";
  }

  if (LEGACY_IMPORT_SOURCES.has(trimmed)) {
    return "import";
  }

  if ((WORD_SOURCES as readonly string[]).includes(trimmed)) {
    return trimmed as WordSource;
  }

  if (trimmed === "admin_csv" || trimmed === "csv") {
    return "import";
  }

  return "manual";
}

/** Resolves optional import provenance separate from generic `source`. */
export function resolveWordSourceReference(options: {
  source: WordSource;
  explicitReference?: string | null;
  rawSourceInput?: string | null;
  importFilename?: string | null;
}): string | undefined {
  const explicit = options.explicitReference?.trim();
  if (explicit) {
    return explicit;
  }

  const raw = options.rawSourceInput?.trim().toLowerCase();
  if (raw && LEGACY_IMPORT_SOURCES.has(raw)) {
    return raw;
  }

  if (options.source === "import" && options.importFilename?.trim()) {
    return options.importFilename.trim();
  }

  return undefined;
}
