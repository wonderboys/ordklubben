import type {
  ContentStatus,
  HintType,
  ImportBatchType,
  PrismaClient,
  Prisma,
} from "@prisma/client";
import { HINT_TYPES } from "@/lib/content/constants";
import type { BatchSummary } from "@/lib/content/import-batch";
import {
  isValidAnswerFormat,
  normalizeAnswer,
} from "@/lib/content/normalize-answer";

type CsvRow = Record<string, string>;

export type ImportErrorRow = {
  rowNumber: number;
  reason: string;
  answer?: string;
  hint?: string;
};

export type ImportSummary = BatchSummary;

export type ImportContentResult = {
  batchId: string;
  summary: ImportSummary;
  errorRows: ImportErrorRow[];
  status: "COMPLETED" | "FAILED";
};

type ImportContentOptions = {
  prisma: PrismaClient;
  csvText: string;
  filename?: string;
  importType: ImportBatchType;
  defaultWordStatus: ContentStatus;
  defaultHintStatus: ContentStatus;
  source?: string;
};

type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
};

function parseCsvRow(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseCsv(csvText: string): ParsedCsv {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error("CSV-filen är tom.");
  }

  const headers = parseCsvRow(lines[0]).map((header) =>
    header.trim().toLocaleLowerCase("sv-SE"),
  );

  const rows = lines.slice(1).map((line) => {
    const values = parseCsvRow(line);
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });

  return { headers, rows };
}

function requireHeaders(headers: string[], requiredHeaders: string[]) {
  const missing = requiredHeaders.filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    throw new Error(`CSV-filen saknar kolumn(er): ${missing.join(", ")}.`);
  }
}

function parseOptionalInteger(value: string, label: string) {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { ok: true as const, value: undefined };
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (Number.isNaN(parsed)) {
    return {
      ok: false as const,
      reason: `${label} måste vara ett heltal.`,
    };
  }

  return { ok: true as const, value: parsed };
}

function parseHintType(value: string): HintType {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "DEFINITION";
  }

  const normalized = trimmed.toLocaleUpperCase("sv-SE") as HintType;
  return HINT_TYPES.includes(normalized) ? normalized : "OTHER";
}

export function normalizeHintTextForDuplicateCheck(text: string) {
  return text
    .trim()
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("sv-SE");
}

function buildSummary(summary: ImportSummary): Prisma.InputJsonObject {
  return {
    totalRows: summary.totalRows,
    createdWords: summary.createdWords,
    reusedWords: summary.reusedWords,
    skippedWords: summary.skippedWords,
    createdHints: summary.createdHints,
    skippedHints: summary.skippedHints,
    failedRows: summary.failedRows,
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

export async function importContent({
  prisma,
  csvText,
  filename,
  importType,
  defaultWordStatus,
  defaultHintStatus,
  source = "admin_csv",
}: ImportContentOptions): Promise<ImportContentResult> {
  const batch = await prisma.importBatch.create({
    data: {
      type: importType,
      filename,
      source,
      status: "PENDING",
    },
  });

  const summary: ImportSummary = {
    totalRows: 0,
    createdWords: 0,
    reusedWords: 0,
    skippedWords: 0,
    createdHints: 0,
    skippedHints: 0,
    failedRows: 0,
  };
  const errorRows: ImportErrorRow[] = [];

  try {
    const parsedCsv = parseCsv(csvText);
    summary.totalRows = parsedCsv.rows.length;

    if (importType === "WORDS") {
      requireHeaders(parsedCsv.headers, ["answer"]);
    } else {
      requireHeaders(parsedCsv.headers, ["answer", "hint"]);
    }

    const wordCache = new Map<string, { id: string; existsBefore: boolean }>();
    const hintCache = new Map<string, Set<string>>();

    for (const [index, row] of parsedCsv.rows.entries()) {
      const rowNumber = index + 2;
      const rawAnswer = row.answer ?? "";
      const rawHint = row.hint ?? "";

      if (rawAnswer.trim().length === 0) {
        summary.failedRows += 1;
        summary.skippedWords += 1;
        if (importType !== "WORDS") {
          summary.skippedHints += 1;
        }
        errorRows.push({
          rowNumber,
          reason: "answer får inte vara tomt.",
          answer: rawAnswer,
          hint: rawHint || undefined,
        });
        continue;
      }

      if (!isValidAnswerFormat(rawAnswer)) {
        summary.failedRows += 1;
        summary.skippedWords += 1;
        if (importType !== "WORDS") {
          summary.skippedHints += 1;
        }
        errorRows.push({
          rowNumber,
          reason:
            "Ord får bara innehålla svenska bokstäver, mellanslag, bindestreck och apostrofer.",
          answer: rawAnswer,
          hint: rawHint || undefined,
        });
        continue;
      }

      const normalized = normalizeAnswer(rawAnswer);

      const rowDifficulty = parseOptionalInteger(
        row.difficulty ?? "",
        "difficulty",
      );

      if (!rowDifficulty.ok) {
        summary.failedRows += 1;
        summary.skippedWords += 1;
        if (importType !== "WORDS") {
          summary.skippedHints += 1;
        }
        errorRows.push({
          rowNumber,
          reason: rowDifficulty.reason,
          answer: normalized.answer,
          hint: rawHint || undefined,
        });
        continue;
      }

      const rowCrosswordScore = parseOptionalInteger(
        row.crosswordscore ?? "",
        "crosswordScore",
      );

      if (!rowCrosswordScore.ok) {
        summary.failedRows += 1;
        summary.skippedWords += 1;
        if (importType !== "WORDS") {
          summary.skippedHints += 1;
        }
        errorRows.push({
          rowNumber,
          reason: rowCrosswordScore.reason,
          answer: normalized.answer,
          hint: rawHint || undefined,
        });
        continue;
      }

      let word = wordCache.get(normalized.normalizedAnswer);

      if (!word) {
        const existingWord = await prisma.word.findUnique({
          where: {
            normalizedAnswer: normalized.normalizedAnswer,
          },
          select: {
            id: true,
          },
        });

        if (existingWord) {
          word = { id: existingWord.id, existsBefore: true };
          wordCache.set(normalized.normalizedAnswer, word);
          summary.reusedWords += 1;
        } else {
          const createdWord = await prisma.word.create({
            data: {
              answer: normalized.answer,
              normalizedAnswer: normalized.normalizedAnswer,
              length: normalized.length,
              language: "sv",
              status: defaultWordStatus,
              difficulty: rowDifficulty.value,
              crosswordScore: rowCrosswordScore.value,
              notes: row.notes?.trim() || undefined,
            },
            select: {
              id: true,
            },
          });

          word = { id: createdWord.id, existsBefore: false };
          wordCache.set(normalized.normalizedAnswer, word);
          summary.createdWords += 1;
        }
      } else if (word.existsBefore) {
        summary.reusedWords += 1;
      } else if (importType === "WORDS") {
        summary.skippedWords += 1;
      }

      if (importType === "WORDS") {
        continue;
      }

      const hintText = rawHint.trim().replace(/\s+/g, " ");
      const normalizedHintText = normalizeHintTextForDuplicateCheck(hintText);

      if (hintText.length === 0) {
        summary.failedRows += 1;
        summary.skippedHints += 1;
        errorRows.push({
          rowNumber,
          reason: "hint får inte vara tomt för denna importtyp.",
          answer: normalized.answer,
          hint: rawHint,
        });
        continue;
      }

      let existingHintTexts = hintCache.get(word.id);

      if (!existingHintTexts) {
        const hints = await prisma.hint.findMany({
          where: {
            wordId: word.id,
          },
          select: {
            text: true,
          },
        });

        existingHintTexts = new Set(
          hints.map((hint) => normalizeHintTextForDuplicateCheck(hint.text)),
        );
        hintCache.set(word.id, existingHintTexts);
      }

      if (existingHintTexts.has(normalizedHintText)) {
        summary.skippedHints += 1;
        errorRows.push({
          rowNumber,
          reason: "Samma nyckeltext finns redan för ordet.",
          answer: normalized.answer,
          hint: hintText,
        });
        continue;
      }

      await prisma.hint.create({
        data: {
          wordId: word.id,
          text: hintText,
          type: parseHintType(row.type ?? ""),
          status: defaultHintStatus,
          difficulty: rowDifficulty.value,
          tone: row.tone?.trim() || undefined,
          source: row.source?.trim() || source,
          notes: row.notes?.trim() || undefined,
        },
      });

      existingHintTexts.add(normalizedHintText);
      summary.createdHints += 1;
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "COMPLETED",
        totalRows: summary.totalRows,
        importedRows: summary.createdWords + summary.createdHints,
        skippedRows:
          summary.reusedWords + summary.skippedWords + summary.skippedHints,
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
      error instanceof Error ? error.message : "Importen kunde inte slutföras.";

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
        importedRows: summary.createdWords + summary.createdHints,
        skippedRows:
          summary.reusedWords + summary.skippedWords + summary.skippedHints,
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
