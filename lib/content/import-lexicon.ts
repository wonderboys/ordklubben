import type { LexicalEntryType, PrismaClient } from '@prisma/client';
import type { BatchSummary } from '@/lib/content/import-batch';
import { type ImportSourceMetadata, type LoggedImportRow } from '@/lib/content/import-job';
import {
  createEmptyBatchSummary,
  createImportBatchContext,
  finalizeImportBatch,
} from '@/lib/content/import-store';
import { parseCsv, requireCsvHeaders } from '@/lib/content/import-csv';
import type { ImportErrorRow } from '@/lib/content/import-content';
import { parseLexicalEntryTypeInput } from '@/lib/content/lexicon/parse-lexical-entry-type';
import { isValidAnswerFormat, normalizeAnswer } from '@/lib/content/normalize-answer';
import { normalizeWordSource } from '@/lib/content/normalize-word-source';

export type ImportLexiconResult = {
  batchId: string;
  summary: BatchSummary;
  errorRows: ImportErrorRow[];
  status: 'COMPLETED' | 'FAILED';
};

type ImportLexiconOptions = {
  prisma: PrismaClient;
  csvText: string;
  filename?: string;
  sourceMetadata: ImportSourceMetadata;
};

function normalizeLexicalValue(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function lexicalEntryKey(wordId: string, type: LexicalEntryType, value: string) {
  return `${wordId}:${type}:${value.toLocaleLowerCase('sv-SE')}`;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

function createEmptyLexiconSummary(totalRows = 0): BatchSummary {
  return createEmptyBatchSummary(totalRows);
}

export async function importLexicon({
  prisma,
  csvText,
  filename,
  sourceMetadata,
}: ImportLexiconOptions): Promise<ImportLexiconResult> {
  const { batch, batchSource, batchSourceReference } = await createImportBatchContext({
    prisma,
    importType: 'LEXICON',
    filename,
    sourceMetadata,
    defaultImportedBy: 'Admin',
  });

  const summary = createEmptyLexiconSummary();
  const errorRows: ImportErrorRow[] = [];
  const loggedRows: LoggedImportRow[] = [];

  try {
    const parsedCsv = parseCsv(csvText);
    summary.totalRows = parsedCsv.rows.length;

    requireCsvHeaders(parsedCsv.headers, ['word', 'type', 'value']);

    const wordCache = new Map<string, string | null>();
    const batchSeen = new Set<string>();

    for (const [index, row] of parsedCsv.rows.entries()) {
      const rowNumber = index + 2;
      const rawWord = row.word ?? '';
      const rawType = row.type ?? '';
      const rawValue = row.value ?? '';

      if (rawWord.trim().length === 0) {
        summary.failedRows += 1;
        errorRows.push({
          rowNumber,
          reason: 'word får inte vara tomt.',
          answer: rawWord,
          hint: rawValue || undefined,
        });
        loggedRows.push({
          rowNumber,
          outcome: 'ERROR',
          entityType: 'LEXICON',
          answer: rawWord,
          value: rawValue || undefined,
          reason: 'word får inte vara tomt.',
        });
        continue;
      }

      if (!isValidAnswerFormat(rawWord)) {
        summary.failedRows += 1;
        errorRows.push({
          rowNumber,
          reason: 'Ogiltigt ordformat.',
          answer: rawWord,
          hint: rawValue || undefined,
        });
        loggedRows.push({
          rowNumber,
          outcome: 'ERROR',
          entityType: 'LEXICON',
          answer: rawWord,
          value: rawValue || undefined,
          reason: 'Ogiltigt ordformat.',
        });
        continue;
      }

      const entryType = parseLexicalEntryTypeInput(rawType);

      if (!entryType) {
        summary.failedRows += 1;
        errorRows.push({
          rowNumber,
          reason: 'type måste vara DEFINITION, SYNONYM, ANTONYM, EXPRESSION eller RELATED.',
          answer: rawWord,
          hint: rawValue || undefined,
        });
        loggedRows.push({
          rowNumber,
          outcome: 'ERROR',
          entityType: 'LEXICON',
          answer: rawWord,
          value: rawValue || undefined,
          reason: 'type måste vara DEFINITION, SYNONYM, ANTONYM, EXPRESSION eller RELATED.',
        });
        continue;
      }

      const value = normalizeLexicalValue(rawValue);

      if (value.length === 0) {
        summary.failedRows += 1;
        errorRows.push({
          rowNumber,
          reason: 'value får inte vara tomt.',
          answer: rawWord,
        });
        loggedRows.push({
          rowNumber,
          outcome: 'ERROR',
          entityType: 'LEXICON',
          answer: rawWord,
          reason: 'value får inte vara tomt.',
        });
        continue;
      }

      const normalized = normalizeAnswer(rawWord);
      let wordId = wordCache.get(normalized.normalizedAnswer);

      if (wordId === undefined) {
        const word = await prisma.word.findUnique({
          where: { normalizedAnswer: normalized.normalizedAnswer },
          select: { id: true },
        });

        wordId = word?.id ?? null;
        wordCache.set(normalized.normalizedAnswer, wordId);
      }

      if (!wordId) {
        summary.skippedMissingWords += 1;
        errorRows.push({
          rowNumber,
          reason: 'Ordet finns inte i ordbanken.',
          answer: normalized.answer,
          hint: value,
        });
        loggedRows.push({
          rowNumber,
          outcome: 'IGNORED',
          entityType: 'LEXICON',
          answer: normalized.answer,
          value,
          reason: 'Ordet finns inte i ordbanken.',
        });
        continue;
      }

      const batchKey = lexicalEntryKey(wordId, entryType, value);

      if (batchSeen.has(batchKey)) {
        summary.skippedDuplicateLexicalEntries += 1;
        loggedRows.push({
          rowNumber,
          outcome: 'IGNORED',
          entityType: 'LEXICON',
          answer: normalized.answer,
          value,
          wordId,
          reason: 'Lexikonposten importerades redan tidigare i samma jobb.',
        });
        continue;
      }

      const entrySource = normalizeWordSource(batchSource || 'import');

      try {
        const createdEntry = await prisma.wordLexicalEntry.create({
          data: {
            wordId,
            importBatchId: batch.id,
            type: entryType,
            value,
            source: entrySource,
            sourceReference: batchSourceReference,
            notes: row.notes?.trim() || undefined,
            linkedWordId: null,
          },
          select: {
            id: true,
          },
        });

        batchSeen.add(batchKey);
        summary.createdLexicalEntries += 1;
        loggedRows.push({
          rowNumber,
          outcome: 'IMPORTED',
          entityType: 'LEXICON',
          answer: normalized.answer,
          value,
          wordId,
          lexicalEntryId: createdEntry.id,
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          summary.skippedDuplicateLexicalEntries += 1;
          batchSeen.add(batchKey);
          loggedRows.push({
            rowNumber,
            outcome: 'REUSED',
            entityType: 'LEXICON',
            answer: normalized.answer,
            value,
            wordId,
            reason: 'Lexikonposten finns redan.',
          });
          continue;
        }

        throw error;
      }
    }

    const skippedRows = summary.skippedDuplicateLexicalEntries + summary.skippedMissingWords;

    await finalizeImportBatch({
      prisma,
      batchId: batch.id,
      summary,
      errorRows,
      status: 'COMPLETED',
      importedRows: summary.createdLexicalEntries,
      skippedRows,
      loggedRows,
    });

    return {
      batchId: batch.id,
      summary,
      errorRows,
      status: 'COMPLETED',
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Lexikonimporten kunde inte slutföras.';

    errorRows.push({
      rowNumber: 0,
      reason,
    });
    loggedRows.push({
      rowNumber: 0,
      outcome: 'ERROR',
      entityType: 'LEXICON',
      reason,
    });

    summary.failedRows += 1;

    await finalizeImportBatch({
      prisma,
      batchId: batch.id,
      summary,
      errorRows,
      status: 'FAILED',
      importedRows: summary.createdLexicalEntries,
      skippedRows: summary.skippedDuplicateLexicalEntries + summary.skippedMissingWords,
      loggedRows,
    });

    return {
      batchId: batch.id,
      summary,
      errorRows,
      status: 'FAILED',
    };
  }
}
