import type { ContentStatus, Prisma, PrismaClient } from '@prisma/client';
import type { BatchSummary } from '@/lib/content/import-batch';
import type { ImportErrorRow } from '@/lib/content/import-content';
import type { ImportSourceMetadata, LoggedImportRow } from '@/lib/content/import-job';
import {
  createEmptyBatchSummary,
  createImportBatchContext,
  finalizeImportBatch,
  upsertWordSourceRecord,
} from '@/lib/content/import-store';
import { resolveCanonicalWord } from '@/lib/content/word-source-records';

export type ImportMode = 'insert-missing' | 'merge-safe' | 'refresh-source-metadata';

export type RawWordImportRecord = {
  normalizedAnswer: string;
  answer: string;
  length: number;
  sourceKey: string;
  sourceReference: string;
  rawValue: string;
  observedAnswer: string;
  frequency: number | null;
  rank: number | null;
  cefr: string | null;
  metadata?: Prisma.InputJsonObject;
};

export type ImportRawWordsOptions = {
  prisma: PrismaClient;
  records: RawWordImportRecord[];
  defaultStatus: ContentStatus;
  mode: ImportMode;
  sourceMetadata: ImportSourceMetadata;
};

export type ImportRawWordsResult = {
  batchId: string;
  summary: BatchSummary;
  errorRows: ImportErrorRow[];
  status: 'COMPLETED' | 'FAILED';
};

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

async function upsertWords(
  prisma: PrismaClient,
  records: RawWordImportRecord[],
  defaultStatus: ContentStatus,
) {
  const uniqueWords = new Map<
    string,
    {
      answer: string;
      normalizedAnswer: string;
      length: number;
    }
  >();

  for (const record of records) {
    if (!uniqueWords.has(record.normalizedAnswer)) {
      uniqueWords.set(record.normalizedAnswer, {
        answer: record.answer,
        normalizedAnswer: record.normalizedAnswer,
        length: record.length,
      });
    }
  }

  const values = [...uniqueWords.values()];

  if (values.length > 0) {
    await prisma.word.createMany({
      data: values.map((word) => ({
        answer: word.answer,
        normalizedAnswer: word.normalizedAnswer,
        length: word.length,
        language: 'sv',
        status: defaultStatus,
        source: 'import',
      })),
      skipDuplicates: true,
    });
  }

  const words = await prisma.word.findMany({
    where: {
      normalizedAnswer: {
        in: values.map((word) => word.normalizedAnswer),
      },
    },
    select: {
      id: true,
      normalizedAnswer: true,
      createdAt: true,
    },
  });

  return new Map(
    words.map((word) => [word.normalizedAnswer, { id: word.id, createdAt: word.createdAt }]),
  );
}

async function reconcileWords(prisma: PrismaClient, wordIds: string[]) {
  for (const wordIdGroup of chunk(wordIds, 200)) {
    const words = await prisma.word.findMany({
      where: {
        id: {
          in: wordIdGroup,
        },
      },
      include: {
        sourceRecords: {
          select: {
            sourceKey: true,
            sourceReference: true,
            observedAnswer: true,
            frequency: true,
            rank: true,
            cefr: true,
            isExcluded: true,
          },
        },
        editorialOverride: {
          select: {
            answer: true,
            status: true,
            difficulty: true,
            frequency: true,
            crosswordScore: true,
            notes: true,
          },
        },
      },
    });

    for (const word of words) {
      const canonical = resolveCanonicalWord({
        normalizedAnswer: word.normalizedAnswer,
        currentWord: {
          answer: word.answer,
          status: word.status,
          source: word.source,
          sourceReference: word.sourceReference,
          difficulty: word.difficulty,
          frequency: word.frequency,
          crosswordScore: word.crosswordScore,
          notes: word.notes,
        },
        sourceRecords: word.sourceRecords,
        editorialOverride: word.editorialOverride,
      });

      await prisma.word.update({
        where: { id: word.id },
        data: {
          answer: canonical.answer,
          status: canonical.status,
          source: canonical.source,
          sourceReference: canonical.sourceReference,
          difficulty: canonical.difficulty,
          frequency: canonical.frequency,
          crosswordScore: canonical.crosswordScore,
          notes: canonical.notes,
        },
      });
    }
  }
}

export async function importRawWords({
  prisma,
  records,
  defaultStatus,
  mode,
  sourceMetadata,
}: ImportRawWordsOptions): Promise<ImportRawWordsResult> {
  const { batch } = await createImportBatchContext({
    prisma,
    importType: 'WORDS',
    source: `raw:${sourceMetadata.sourceName}`,
    sourceMetadata,
    defaultImportedBy: 'CLI',
    totalRows: records.length,
  });

  const summary = createEmptyBatchSummary(records.length);
  const errorRows: ImportErrorRow[] = [];
  const loggedRows: LoggedImportRow[] = [];

  try {
    const wordIdByNormalizedAnswer = await upsertWords(prisma, records, defaultStatus);
    const touchedWordIds = new Set<string>();
    const createdWordIds = new Set<string>();
    const reusedWordIds = new Set<string>();
    const existingSourceRecordCache = new Map<
      string,
      { exists: boolean; metadata: Prisma.InputJsonValue | null }
    >();
    let upsertedSourceRecords = 0;

    for (const [index, record] of records.entries()) {
      const rowNumber = index + 1;
      const word = wordIdByNormalizedAnswer.get(record.normalizedAnswer);

      if (!word) {
        summary.failedRows += 1;
        errorRows.push({
          rowNumber,
          reason: 'Ordet kunde inte kopplas till en ordpost efter import.',
          answer: record.answer,
        });
        loggedRows.push({
          rowNumber,
          outcome: 'ERROR',
          entityType: 'WORD',
          answer: record.answer,
          reason: 'Ordet kunde inte kopplas till en ordpost efter import.',
          metadata: {
            sourceKey: record.sourceKey,
            sourceReference: record.sourceReference,
          } satisfies Prisma.InputJsonObject,
        });
        continue;
      }

      touchedWordIds.add(word.id);

      const existingKey = `${word.id}:${record.sourceKey}:${record.sourceReference}`;
      let sourceRecordState = existingSourceRecordCache.get(existingKey);

      if (!sourceRecordState) {
        const existing = await prisma.wordSourceRecord.findFirst({
          where: {
            wordId: word.id,
            sourceKey: record.sourceKey,
            sourceReference: record.sourceReference,
          },
          select: { id: true, metadata: true },
        });

        sourceRecordState = {
          exists: Boolean(existing),
          metadata: (existing?.metadata as Prisma.InputJsonValue | null | undefined) ?? null,
        };
        existingSourceRecordCache.set(existingKey, sourceRecordState);
      }

      if (sourceRecordState.exists && mode === 'insert-missing') {
        summary.skippedWords += 1;
        loggedRows.push({
          rowNumber,
          outcome: 'IGNORED',
          entityType: 'WORD',
          answer: record.answer,
          wordId: word.id,
          reason: 'Kallposten finns redan och insert-missing hoppar over den.',
          metadata: {
            sourceKey: record.sourceKey,
            sourceReference: record.sourceReference,
          } satisfies Prisma.InputJsonObject,
        });
        continue;
      }

      await upsertWordSourceRecord({
        prisma,
        wordId: word.id,
        importBatch: batch,
        sourceKey: record.sourceKey,
        sourceReference: record.sourceReference,
        normalizedValue: record.normalizedAnswer,
        observedAnswer: record.observedAnswer,
        rank: record.rank,
        frequency: record.frequency,
        cefr: record.cefr,
        rawValue: record.rawValue,
        metadata:
          mode === 'refresh-source-metadata' || !sourceRecordState.exists
            ? record.metadata
            : (sourceRecordState.metadata ?? record.metadata),
      });

      existingSourceRecordCache.set(existingKey, {
        exists: true,
        metadata:
          mode === 'refresh-source-metadata' || !sourceRecordState.exists
            ? (record.metadata ?? null)
            : sourceRecordState.metadata,
      });
      upsertedSourceRecords += 1;

      const wasNewWord = word.createdAt >= new Date(batch.createdAt.getTime() - 1000);

      if (wasNewWord) {
        createdWordIds.add(word.id);
      } else {
        reusedWordIds.add(word.id);
      }

      loggedRows.push({
        rowNumber,
        outcome: wasNewWord ? 'IMPORTED' : 'REUSED',
        entityType: 'WORD',
        answer: record.answer,
        wordId: word.id,
        metadata: {
          sourceKey: record.sourceKey,
          sourceReference: record.sourceReference,
          mode,
        } satisfies Prisma.InputJsonObject,
      });
    }

    summary.createdWords = createdWordIds.size;
    summary.reusedWords = [...reusedWordIds].filter((wordId) => !createdWordIds.has(wordId)).length;

    await reconcileWords(prisma, [...touchedWordIds]);

    await finalizeImportBatch({
      prisma,
      batchId: batch.id,
      summary,
      errorRows,
      status: 'COMPLETED',
      importedRows: upsertedSourceRecords,
      skippedRows: summary.skippedWords,
      loggedRows,
      summaryExtras: {
        mode,
        sourceRecordsUpserted: upsertedSourceRecords,
        touchedWords: touchedWordIds.size,
      },
    });

    return {
      batchId: batch.id,
      summary,
      errorRows,
      status: 'COMPLETED',
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Raw-importen kunde inte slutföras.';

    errorRows.push({
      rowNumber: 0,
      reason,
    });
    loggedRows.push({
      rowNumber: 0,
      outcome: 'ERROR',
      entityType: 'WORD',
      reason,
    });
    summary.failedRows += 1;

    await finalizeImportBatch({
      prisma,
      batchId: batch.id,
      summary,
      errorRows,
      status: 'FAILED',
      importedRows: 0,
      skippedRows: summary.skippedWords,
      loggedRows,
      summaryExtras: {
        mode,
      },
    });

    return {
      batchId: batch.id,
      summary,
      errorRows,
      status: 'FAILED',
    };
  }
}
