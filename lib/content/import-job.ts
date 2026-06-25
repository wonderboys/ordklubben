import type { Prisma } from '@prisma/client';
import { normalizeWordSource } from './normalize-word-source';

export const IMPORT_ROW_OUTCOMES = ['IMPORTED', 'REUSED', 'IGNORED', 'ERROR'] as const;
export type ImportRowOutcome = (typeof IMPORT_ROW_OUTCOMES)[number];

export const IMPORT_ROW_ENTITY_TYPES = ['WORD', 'HINT', 'LEXICON'] as const;
export type ImportRowEntityType = (typeof IMPORT_ROW_ENTITY_TYPES)[number];

export type ImportSourceMetadata = {
  sourceName: string;
  sourceVersion?: string;
  sourceLicense?: string;
  sourceUrl?: string;
  sourceReference?: string;
  sourceComment?: string;
  importedBy?: string;
};

export type LoggedImportRow = {
  rowNumber: number;
  outcome: ImportRowOutcome;
  entityType: ImportRowEntityType;
  answer?: string;
  hint?: string;
  value?: string;
  reason?: string;
  wordId?: string;
  hintId?: string;
  lexicalEntryId?: string;
  metadata?: Prisma.InputJsonValue;
};

export function trimImportMetadata(metadata: ImportSourceMetadata): ImportSourceMetadata {
  return {
    sourceName: metadata.sourceName.trim(),
    sourceVersion: metadata.sourceVersion?.trim() || undefined,
    sourceLicense: metadata.sourceLicense?.trim() || undefined,
    sourceUrl: metadata.sourceUrl?.trim() || undefined,
    sourceReference: metadata.sourceReference?.trim() || undefined,
    sourceComment: metadata.sourceComment?.trim() || undefined,
    importedBy: metadata.importedBy?.trim() || undefined,
  };
}

export function buildImportBatchSourceLabel(metadata: ImportSourceMetadata) {
  const normalized = trimImportMetadata(metadata);
  return normalizeWordSource(normalized.sourceName || 'import');
}

export function buildImportSourceKey(metadata: ImportSourceMetadata) {
  const base = metadata.sourceName
    .trim()
    .toLocaleLowerCase('sv-SE')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base || 'import';
}

export function buildImportSourceReference(metadata: ImportSourceMetadata, filename?: string) {
  const parts = [metadata.sourceVersion, metadata.sourceReference, filename]
    .map((value) => value?.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function formatImportBatchSource(metadata: {
  sourceName: string | null;
  sourceVersion: string | null;
}) {
  if (!metadata.sourceName) {
    return 'Okand kalla';
  }

  return metadata.sourceVersion
    ? `${metadata.sourceName} ${metadata.sourceVersion}`
    : metadata.sourceName;
}
