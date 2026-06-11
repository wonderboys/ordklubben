import type { LexicalEntryType, Prisma, PrismaClient } from "@prisma/client";
import type { BatchSummary } from "@/lib/content/import-batch";
import { parseCsv, requireCsvHeaders } from "@/lib/content/import-csv";
import type { ImportErrorRow } from "@/lib/content/import-content";
import { parseLexicalEntryTypeInput } from "@/lib/content/lexicon/parse-lexical-entry-type";
import { isValidAnswerFormat, normalizeAnswer } from "@/lib/content/normalize-answer";
import {
  normalizeWordSource,
  resolveWordSourceReference,
} from "@/lib/content/normalize-word-source";

export type ImportLexiconResult = {
  batchId: string;
  summary: BatchSummary;
  errorRows: ImportErrorRow[];
  status: "COMPLETED" | "FAILED";
};

type ImportLexiconOptions = {
  prisma: PrismaClient;
  csvText: string;
  filename?: string;
};

function normalizeLexicalValue(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function lexicalEntryKey(wordId: string, type: LexicalEntryType, value: string) {
  return `${wordId}:${type}:${value.toLocaleLowerCase("sv-SE")}`;
}

function buildSummary(summary: BatchSummary): Prisma.InputJsonObject {
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
  };
}

function buildErrorRowsJson(errorRows: ImportErrorRow[]): Prisma.InputJsonArray {
  return errorRows.map((errorRow) => ({
    rowNumber: errorRow.rowNumber,
    reason: errorRow.reason,
    answer: errorRow.answer ?? null,
    hint: errorRow.hint ?? null,
  }));
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

function createEmptyLexiconSummary(totalRows = 0): BatchSummary {
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

export async function importLexicon({
  prisma,
  csvText,
  filename,
}: ImportLexiconOptions): Promise<ImportLexiconResult> {
  const batch = await prisma.importBatch.create({
    data: {
      type: "LEXICON",
      filename,
      source: "import",
      status: "PENDING",
    },
  });

  const summary = createEmptyLexiconSummary();
  const errorRows: ImportErrorRow[] = [];

  try {
    const parsedCsv = parseCsv(csvText);
    summary.totalRows = parsedCsv.rows.length;

    requireCsvHeaders(parsedCsv.headers, ["word", "type", "value"]);

    const wordCache = new Map<string, string | null>();
    const batchSeen = new Set<string>();

    for (const [index, row] of parsedCsv.rows.entries()) {
      const rowNumber = index + 2;
      const rawWord = row.word ?? "";
      const rawType = row.type ?? "";
      const rawValue = row.value ?? "";

      if (rawWord.trim().length === 0) {
        summary.failedRows += 1;
        errorRows.push({
          rowNumber,
          reason: "word får inte vara tomt.",
          answer: rawWord,
          hint: rawValue || undefined,
        });
        continue;
      }

      if (!isValidAnswerFormat(rawWord)) {
        summary.failedRows += 1;
        errorRows.push({
          rowNumber,
          reason: "Ogiltigt ordformat.",
          answer: rawWord,
          hint: rawValue || undefined,
        });
        continue;
      }

      const entryType = parseLexicalEntryTypeInput(rawType);

      if (!entryType) {
        summary.failedRows += 1;
        errorRows.push({
          rowNumber,
          reason: "type måste vara DEFINITION, SYNONYM, ANTONYM, EXPRESSION eller RELATED.",
          answer: rawWord,
          hint: rawValue || undefined,
        });
        continue;
      }

      const value = normalizeLexicalValue(rawValue);

      if (value.length === 0) {
        summary.failedRows += 1;
        errorRows.push({
          rowNumber,
          reason: "value får inte vara tomt.",
          answer: rawWord,
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
          reason: "Ordet finns inte i ordbanken.",
          answer: normalized.answer,
          hint: value,
        });
        continue;
      }

      const batchKey = lexicalEntryKey(wordId, entryType, value);

      if (batchSeen.has(batchKey)) {
        summary.skippedDuplicateLexicalEntries += 1;
        continue;
      }

      const rawSource = row.source?.trim() ?? "";
      const entrySource = normalizeWordSource(rawSource || "import");
      const sourceReference = resolveWordSourceReference({
        source: entrySource,
        explicitReference: row.sourcereference ?? row.source_reference,
        rawSourceInput: rawSource,
        importFilename: filename,
      });

      try {
        await prisma.wordLexicalEntry.create({
          data: {
            wordId,
            type: entryType,
            value,
            source: entrySource,
            sourceReference,
            notes: row.notes?.trim() || undefined,
            linkedWordId: null,
          },
        });

        batchSeen.add(batchKey);
        summary.createdLexicalEntries += 1;
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          summary.skippedDuplicateLexicalEntries += 1;
          batchSeen.add(batchKey);
          continue;
        }

        throw error;
      }
    }

    const skippedRows =
      summary.skippedDuplicateLexicalEntries + summary.skippedMissingWords;

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "COMPLETED",
        totalRows: summary.totalRows,
        importedRows: summary.createdLexicalEntries,
        skippedRows,
        summary: buildSummary(summary),
        errorRows: buildErrorRowsJson(errorRows),
        completedAt: new Date(),
      },
    });

    return {
      batchId: batch.id,
      summary,
      errorRows,
      status: "COMPLETED",
    };
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Lexikonimporten kunde inte slutföras.";

    errorRows.push({
      rowNumber: 0,
      reason,
    });

    summary.failedRows += 1;

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "FAILED",
        totalRows: summary.totalRows,
        importedRows: summary.createdLexicalEntries,
        skippedRows:
          summary.skippedDuplicateLexicalEntries + summary.skippedMissingWords,
        summary: buildSummary(summary),
        errorRows: buildErrorRowsJson(errorRows),
        completedAt: new Date(),
      },
    });

    return {
      batchId: batch.id,
      summary,
      errorRows,
      status: "FAILED",
    };
  }
}
