import type { Prisma } from "@prisma/client";

export type BatchSummary = {
  totalRows: number;
  createdWords: number;
  reusedWords: number;
  skippedWords: number;
  createdHints: number;
  skippedHints: number;
  failedRows: number;
  createdThemes: number;
  reusedThemes: number;
  createdThemeLinks: number;
  reusedThemeLinks: number;
  createdLexicalEntries: number;
  skippedDuplicateLexicalEntries: number;
  skippedMissingWords: number;
};

export type BatchErrorRow = {
  rowNumber: number;
  reason: string;
  answer?: string | null;
  hint?: string | null;
};

export function parseBatchSummary(value: Prisma.JsonValue | null): BatchSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  return {
    totalRows: Number(record.totalRows ?? 0),
    createdWords: Number(record.createdWords ?? 0),
    reusedWords: Number(record.reusedWords ?? 0),
    skippedWords: Number(record.skippedWords ?? 0),
    createdHints: Number(record.createdHints ?? 0),
    skippedHints: Number(record.skippedHints ?? 0),
    failedRows: Number(record.failedRows ?? 0),
    createdThemes: Number(record.createdThemes ?? 0),
    reusedThemes: Number(record.reusedThemes ?? 0),
    createdThemeLinks: Number(record.createdThemeLinks ?? 0),
    reusedThemeLinks: Number(record.reusedThemeLinks ?? 0),
    createdLexicalEntries: Number(record.createdLexicalEntries ?? 0),
    skippedDuplicateLexicalEntries: Number(record.skippedDuplicateLexicalEntries ?? 0),
    skippedMissingWords: Number(record.skippedMissingWords ?? 0),
  };
}

export function isLexiconBatchSummary(summary: BatchSummary) {
  return (
    summary.createdLexicalEntries > 0 ||
    summary.skippedDuplicateLexicalEntries > 0 ||
    summary.skippedMissingWords > 0
  );
}

export function parseBatchErrorRows(value: Prisma.JsonValue | null): BatchErrorRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return [];
    }

    const record = entry as Record<string, unknown>;

    return [
      {
        rowNumber: Number(record.rowNumber ?? 0),
        reason: String(record.reason ?? ""),
        answer:
          record.answer === null || record.answer === undefined
            ? null
            : String(record.answer),
        hint:
          record.hint === null || record.hint === undefined
            ? null
            : String(record.hint),
      },
    ];
  });
}
