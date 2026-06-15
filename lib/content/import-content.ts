import type {
  ContentStatus,
  HintType,
  ImportBatchType,
  PrismaClient,
  Prisma,
} from "@prisma/client";
import {
  normalizeHintSource,
  parseHintTypeInput,
} from "@/lib/content/normalize-hint-metadata";
import type { BatchSummary } from "@/lib/content/import-batch";
import { parseCsv, requireCsvHeaders } from "@/lib/content/import-csv";
import {
  isValidAnswerFormat,
  normalizeAnswer,
  slugifyThemeName,
} from "@/lib/content/normalize-answer";
import {
  normalizeWordSource,
  resolveWordSourceReference,
} from "@/lib/content/normalize-word-source";

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
  return parseHintTypeInput(value);
}

function parseContentStatus(
  value: string,
  defaultStatus: ContentStatus,
  label: string,
) {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { ok: true as const, value: defaultStatus };
  }

  const normalized = trimmed.toLocaleUpperCase("sv-SE");

  if (normalized === "DRAFT" || normalized === "APPROVED") {
    return { ok: true as const, value: normalized as ContentStatus };
  }

  return {
    ok: false as const,
    reason: `${label} måste vara DRAFT eller APPROVED.`,
  };
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
    createdThemes: summary.createdThemes,
    reusedThemes: summary.reusedThemes,
    createdThemeLinks: summary.createdThemeLinks,
    reusedThemeLinks: summary.reusedThemeLinks,
    createdLexicalEntries: summary.createdLexicalEntries,
    skippedDuplicateLexicalEntries: summary.skippedDuplicateLexicalEntries,
    skippedMissingWords: summary.skippedMissingWords,
  };
}

type ThemeCacheEntry = {
  id: string;
  created: boolean;
};

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

async function linkWordToTheme({
  prisma,
  wordId,
  rawTheme,
  themeCache,
  wordThemeCache,
  summary,
}: {
  prisma: PrismaClient;
  wordId: string;
  rawTheme: string;
  themeCache: Map<string, ThemeCacheEntry>;
  wordThemeCache: Set<string>;
  summary: ImportSummary;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const themeName = rawTheme.trim();

  if (themeName.length === 0) {
    return { ok: true };
  }

  const slug = slugifyThemeName(themeName);

  if (slug.length === 0) {
    return {
      ok: false,
      reason: "theme måste innehålla minst ett giltigt tecken.",
    };
  }

  let themeEntry = themeCache.get(slug);

  if (!themeEntry) {
    const existingTheme = await prisma.theme.findFirst({
      where: {
        OR: [{ slug }, { name: { equals: themeName, mode: "insensitive" } }],
      },
      select: {
        id: true,
      },
    });

    if (existingTheme) {
      themeEntry = { id: existingTheme.id, created: false };
      summary.reusedThemes += 1;
    } else {
      try {
        const createdTheme = await prisma.theme.create({
          data: {
            name: themeName,
            slug,
          },
          select: {
            id: true,
          },
        });

        themeEntry = { id: createdTheme.id, created: true };
        summary.createdThemes += 1;
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }

        const racedTheme = await prisma.theme.findUnique({
          where: { slug },
          select: { id: true },
        });

        if (!racedTheme) {
          throw error;
        }

        themeEntry = { id: racedTheme.id, created: false };
        summary.reusedThemes += 1;
      }
    }

    themeCache.set(slug, themeEntry);
  } else {
    summary.reusedThemes += 1;
  }

  const linkKey = `${wordId}:${themeEntry.id}`;

  if (wordThemeCache.has(linkKey)) {
    summary.reusedThemeLinks += 1;
    return { ok: true };
  }

  const existingLink = await prisma.wordTheme.findUnique({
    where: {
      wordId_themeId: {
        wordId,
        themeId: themeEntry.id,
      },
    },
    select: {
      wordId: true,
    },
  });

  if (existingLink) {
    wordThemeCache.add(linkKey);
    summary.reusedThemeLinks += 1;
    return { ok: true };
  }

  await prisma.wordTheme.create({
    data: {
      wordId,
      themeId: themeEntry.id,
    },
  });

  wordThemeCache.add(linkKey);
  summary.createdThemeLinks += 1;

  return { ok: true };
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
  source = "import",
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
    createdThemes: 0,
    reusedThemes: 0,
    createdThemeLinks: 0,
    reusedThemeLinks: 0,
    createdLexicalEntries: 0,
    skippedDuplicateLexicalEntries: 0,
    skippedMissingWords: 0,
  };
  const errorRows: ImportErrorRow[] = [];

  try {
    const parsedCsv = parseCsv(csvText);
    summary.totalRows = parsedCsv.rows.length;

    if (importType === "WORDS") {
      requireCsvHeaders(parsedCsv.headers, ["answer"]);
    } else {
      requireCsvHeaders(parsedCsv.headers, ["answer", "hint"]);
    }

    const wordCache = new Map<string, { id: string; existsBefore: boolean }>();
    const hintCache = new Map<string, Set<string>>();
    const themeCache = new Map<string, ThemeCacheEntry>();
    const wordThemeCache = new Set<string>();

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

      const rowWordStatus = parseContentStatus(
        row.wordstatus ?? "",
        defaultWordStatus,
        "wordStatus",
      );

      if (!rowWordStatus.ok) {
        summary.failedRows += 1;
        summary.skippedWords += 1;
        if (importType !== "WORDS") {
          summary.skippedHints += 1;
        }
        errorRows.push({
          rowNumber,
          reason: rowWordStatus.reason,
          answer: normalized.answer,
          hint: rawHint || undefined,
        });
        continue;
      }

      let rowHintStatus: { ok: true; value: ContentStatus } | { ok: false; reason: string } | null =
        null;

      if (importType !== "WORDS") {
        rowHintStatus = parseContentStatus(
          row.hintstatus ?? "",
          defaultHintStatus,
          "hintStatus",
        );

        if (!rowHintStatus.ok) {
          summary.failedRows += 1;
          summary.skippedHints += 1;
          errorRows.push({
            rowNumber,
            reason: rowHintStatus.reason,
            answer: normalized.answer,
            hint: rawHint || undefined,
          });
          continue;
        }
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
          const rawWordSource = row.source?.trim() ?? "";
          const wordSource = normalizeWordSource(rawWordSource || source || "import");
          const wordSourceReference = resolveWordSourceReference({
            source: wordSource,
            explicitReference: row.sourcereference ?? row.source_reference,
            rawSourceInput: rawWordSource,
            importFilename: filename,
          });

          const createdWord = await prisma.word.create({
            data: {
              answer: normalized.answer,
              normalizedAnswer: normalized.normalizedAnswer,
              length: normalized.length,
              language: "sv",
              status: rowWordStatus.value,
              source: wordSource,
              sourceReference: wordSourceReference,
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

      const themeLink = await linkWordToTheme({
        prisma,
        wordId: word.id,
        rawTheme: row.theme ?? "",
        themeCache,
        wordThemeCache,
        summary,
      });

      if (!themeLink.ok) {
        summary.failedRows += 1;
        if (importType !== "WORDS") {
          summary.skippedHints += 1;
        }
        errorRows.push({
          rowNumber,
          reason: themeLink.reason,
          answer: normalized.answer,
          hint: rawHint || undefined,
        });
        continue;
      }

      if (importType === "WORDS") {
        continue;
      }

      const hintStatusForRow = rowHintStatus!.value;

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
          status: hintStatusForRow,
          difficulty: rowDifficulty.value,
          tone: row.tone?.trim() || undefined,
          source: normalizeHintSource(row.source?.trim() || source, "import"),
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
