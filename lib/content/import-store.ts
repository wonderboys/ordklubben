import type { ImportBatch, ImportBatchType, Prisma, PrismaClient } from '@prisma/client';
import type { BatchSummary } from '@/lib/content/import-batch';
import type { ImportErrorRow } from '@/lib/content/import-content';
import {
  buildImportBatchSourceLabel,
  buildImportSourceKey,
  buildImportSourceReference,
  trimImportMetadata,
  type ImportSourceMetadata,
  type LoggedImportRow,
} from '@/lib/content/import-job';

function isJsonObject(value: Prisma.InputJsonValue | undefined): value is Prisma.InputJsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export type ImportBatchContext = {
  batch: ImportBatch;
  batchSource: string;
  batchSourceKey: string;
  batchSourceReference: string | null;
  metadata: ImportSourceMetadata;
};

export function createEmptyBatchSummary(totalRows = 0): BatchSummary {
  return {
    totalRows,
    createdWords: 0,
    reusedWords: 0,
    skippedWords: 0,
    createdHints: 0,
    skippedHints: 0,
    failedRows: 0,
    createdThemes: 0,
    reusedThemes: 0,
    createdThemeLinks: 0,
    reusedThemeLinks: 0,
    createdLexicalEntries: 0,
    skippedDuplicateLexicalEntries: 0,
    skippedMissingWords: 0,
  };
}

export function buildBatchSummaryJson(
  summary: BatchSummary,
  extras?: Prisma.InputJsonObject,
): Prisma.InputJsonObject {
  return {
    totalRows: summary.totalRows,
    createdWords: summary.createdWords,
    reusedWords: summary.reusedWords,
    skippedWords: summary.skippedWords,
    createdHints: summary.createdHints,
    skippedHints: summary.skippedHints,
    failedRows: summary.failedRows,
    createdThemes: summary.createdThemes,
    reusedThemes: summary.reusedThemes,
    createdThemeLinks: summary.createdThemeLinks,
    reusedThemeLinks: summary.reusedThemeLinks,
    createdLexicalEntries: summary.createdLexicalEntries,
    skippedDuplicateLexicalEntries: summary.skippedDuplicateLexicalEntries,
    skippedMissingWords: summary.skippedMissingWords,
    ...(extras ?? {}),
  };
}

export function buildErrorRowsJson(errorRows: ImportErrorRow[]): Prisma.InputJsonArray {
  return errorRows.map((errorRow) => ({
    rowNumber: errorRow.rowNumber,
    reason: errorRow.reason,
    answer: errorRow.answer ?? null,
    hint: errorRow.hint ?? null,
  }));
}

export async function createImportBatchRows(
  prisma: PrismaClient,
  batchId: string,
  rows: LoggedImportRow[],
) {
  if (rows.length === 0) {
    return;
  }

  await prisma.importBatchRow.createMany({
    data: rows.map((row) => ({
      importBatchId: batchId,
      rowNumber: row.rowNumber,
      outcome: row.outcome,
      entityType: row.entityType,
      answer: row.answer,
      hint: row.hint,
      value: row.value,
      reason: row.reason,
      wordId: row.wordId,
      hintId: row.hintId,
      lexicalEntryId: row.lexicalEntryId,
      metadata: row.metadata,
    })),
  });
}

export async function createImportBatchContext({
  prisma,
  importType,
  filename,
  source,
  sourceMetadata,
  defaultImportedBy,
  totalRows,
}: {
  prisma: PrismaClient;
  importType: ImportBatchType;
  filename?: string;
  source?: string;
  sourceMetadata: ImportSourceMetadata;
  defaultImportedBy: string;
  totalRows?: number;
}) {
  const metadata = {
    ...trimImportMetadata(sourceMetadata),
    importedBy: sourceMetadata.importedBy?.trim() || defaultImportedBy,
  };
  const batchSource = buildImportBatchSourceLabel(metadata);
  const batchSourceKey = buildImportSourceKey(metadata);
  const batchSourceReference = buildImportSourceReference(metadata, filename);

  const batch = await prisma.importBatch.create({
    data: {
      type: importType,
      filename,
      source: batchSource || source,
      sourceName: metadata.sourceName,
      sourceVersion: metadata.sourceVersion,
      sourceLicense: metadata.sourceLicense,
      sourceUrl: metadata.sourceUrl,
      sourceReference: metadata.sourceReference,
      sourceComment: metadata.sourceComment,
      importedBy: metadata.importedBy,
      status: 'PENDING',
      totalRows: totalRows ?? 0,
    },
  });

  return {
    batch,
    batchSource,
    batchSourceKey,
    batchSourceReference,
    metadata,
  } satisfies ImportBatchContext;
}

export async function finalizeImportBatch({
  prisma,
  batchId,
  summary,
  errorRows,
  status,
  importedRows,
  skippedRows,
  loggedRows,
  summaryExtras,
}: {
  prisma: PrismaClient;
  batchId: string;
  summary: BatchSummary;
  errorRows: ImportErrorRow[];
  status: 'COMPLETED' | 'FAILED';
  importedRows: number;
  skippedRows: number;
  loggedRows: LoggedImportRow[];
  summaryExtras?: Prisma.InputJsonObject;
}) {
  await prisma.importBatch.update({
    where: { id: batchId },
    data: {
      status,
      totalRows: summary.totalRows,
      importedRows,
      skippedRows,
      summary: buildBatchSummaryJson(summary, summaryExtras),
      errorRows: buildErrorRowsJson(errorRows),
      completedAt: new Date(),
    },
  });

  await createImportBatchRows(prisma, batchId, loggedRows);
}

export async function upsertWordSourceRecord({
  prisma,
  wordId,
  importBatch,
  sourceKey,
  sourceReference,
  normalizedValue,
  observedAnswer,
  rank,
  frequency,
  cefr,
  rawValue,
  metadata,
}: {
  prisma: PrismaClient;
  wordId: string;
  importBatch: Pick<
    ImportBatch,
    'id' | 'sourceName' | 'sourceVersion' | 'sourceLicense' | 'sourceUrl' | 'sourceReference'
  >;
  sourceKey: string;
  sourceReference: string | null;
  normalizedValue: string;
  observedAnswer: string;
  rank?: number | null;
  frequency?: number | null;
  cefr?: string | null;
  rawValue?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const existing = await prisma.wordSourceRecord.findFirst({
    where: {
      wordId,
      sourceKey,
      sourceReference,
    },
    select: { id: true },
  });

  const mergedMetadata: Prisma.InputJsonObject = {
    importBatchId: importBatch.id,
    sourceName: importBatch.sourceName,
    sourceVersion: importBatch.sourceVersion,
    sourceLicense: importBatch.sourceLicense,
    sourceUrl: importBatch.sourceUrl,
    sourceReference: importBatch.sourceReference,
  };

  if (isJsonObject(metadata)) {
    Object.assign(mergedMetadata, metadata);
  }

  if (existing) {
    await prisma.wordSourceRecord.update({
      where: { id: existing.id },
      data: {
        importBatchId: importBatch.id,
        rawValue,
        normalizedValue,
        observedAnswer,
        rank: rank ?? undefined,
        frequency: frequency ?? undefined,
        cefr: cefr ?? undefined,
        metadata: mergedMetadata,
        lastImportedAt: new Date(),
      },
    });

    return;
  }

  await prisma.wordSourceRecord.create({
    data: {
      wordId,
      importBatchId: importBatch.id,
      sourceKey,
      sourceReference,
      rawValue,
      normalizedValue,
      observedAnswer,
      rank: rank ?? undefined,
      frequency: frequency ?? undefined,
      cefr: cefr ?? undefined,
      metadata: mergedMetadata,
    },
  });
}
