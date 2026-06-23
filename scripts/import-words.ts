import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, type ContentStatus } from '@prisma/client';
import { resolveCanonicalWord } from '../lib/content/word-source-records';
import { isValidAnswerFormat, normalizeAnswer } from '../lib/content/normalize-answer';

const prisma = new PrismaClient();
const ROOT_DIR = process.cwd();
const RAW_DIR = path.join(ROOT_DIR, 'data', 'raw');
const HUNSPELL_DIR = path.join(RAW_DIR, 'hunspell');
const KELLY_DIR = path.join(RAW_DIR, 'kelly');
const NEVER_ALLOW_INPUT = path.join(ROOT_DIR, 'data', 'seed', 'word-filters', 'never-allow-sv.ts');

type ImportMode = 'insert-missing' | 'merge-safe' | 'refresh-source-metadata';
type RawSourceSelection = 'all' | 'hunspell' | 'kelly';
type RawWordSource = 'hunspell' | 'kelly';
type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type KellyEntry = {
  rank: number;
  rawFreq: number | null;
  cefr: CefrLevel | '';
  lemma: string;
  wordClass: string;
};
type SourceRecordImport = {
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
  metadata?: Record<string, unknown>;
};

const SWEDISH_WORD_PATTERN = /^[a-zåäö]+$/;
const PROPER_NOUN_PATTERN = /^[A-ZÅÄÖ][a-zåäö]+$/;
const UPPERCASE_WORD_PATTERN = /^[A-ZÅÄÖ]+$/;
const KELLY_DATA_ROW_PATTERN = /^\d+;/;
const ALLOWED_CEFR_LEVELS = new Set<CefrLevel>(['A1', 'A2', 'B1', 'B2']);

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: 'merge-safe' as ImportMode,
    source: 'all' as RawSourceSelection,
    defaultStatus: 'DRAFT' as ContentStatus,
  };

  for (const arg of args) {
    if (arg.startsWith('--mode=')) {
      const value = arg.slice('--mode='.length) as ImportMode;
      if (
        value === 'insert-missing' ||
        value === 'merge-safe' ||
        value === 'refresh-source-metadata'
      ) {
        options.mode = value;
      }
      continue;
    }

    if (arg.startsWith('--source=')) {
      const value = arg.slice('--source='.length) as RawSourceSelection;
      if (value === 'all' || value === 'hunspell' || value === 'kelly') {
        options.source = value;
      }
      continue;
    }

    if (arg.startsWith('--default-status=')) {
      const value = arg.slice('--default-status='.length).toLocaleUpperCase('sv-SE');
      if (value === 'DRAFT' || value === 'APPROVED') {
        options.defaultStatus = value as ContentStatus;
      }
    }
  }

  return options;
}

function readTextFile(filePath: string) {
  return fs.readFileSync(filePath, 'utf8');
}

function listFiles(directory: string) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((name) => !name.startsWith('.'))
    .map((name) => path.join(directory, name))
    .filter((filePath) => fs.statSync(filePath).isFile());
}

function readManualWordList(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return [] as string[];
  }

  const fileContents = readTextFile(filePath);
  const matches = [...fileContents.matchAll(/"([^"]+)"/g)];
  return matches.map((match) => match[1] ?? '').filter(Boolean);
}

const NEVER_ALLOW_WORDS = new Set(readManualWordList(NEVER_ALLOW_INPUT));

function normalizeSwedish(value: string) {
  return value.trim().toLocaleLowerCase('sv-SE').normalize('NFC');
}

function cleanRawWord(rawValue: string) {
  return rawValue.trim().replace(/^\uFEFF/, '');
}

function isAllUppercaseWord(rawValue: string) {
  return UPPERCASE_WORD_PATTERN.test(cleanRawWord(rawValue));
}

function looksLikeProperNoun(rawValue: string) {
  const trimmed = cleanRawWord(rawValue);
  return PROPER_NOUN_PATTERN.test(trimmed) && !isAllUppercaseWord(rawValue);
}

function parseKellyCsv(filePath: string) {
  const lines = readTextFile(filePath).split(/\r?\n/);
  const entries: KellyEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !KELLY_DATA_ROW_PATTERN.test(trimmed)) {
      continue;
    }

    const columns = trimmed.split(';');
    if (columns.length < 8) {
      continue;
    }

    const rank = Number.parseInt(columns[0] ?? '', 10);
    const rawFreqValue = columns[1]?.trim() ?? '';
    const rawFreq = rawFreqValue ? Number.parseInt(rawFreqValue, 10) : null;
    const cefr = (columns[3]?.trim() ?? '') as CefrLevel | '';
    const lemma = columns[6]?.trim() ?? '';
    const wordClass = columns[7]?.trim() ?? '';

    if (!lemma || Number.isNaN(rank)) {
      continue;
    }

    entries.push({
      rank,
      rawFreq: rawFreq !== null && !Number.isNaN(rawFreq) ? rawFreq : null,
      cefr,
      lemma,
      wordClass,
    });
  }

  return entries;
}

function extractWordsFromDic(filePath: string, source: RawWordSource) {
  const lines = readTextFile(filePath).split(/\r?\n/);
  const entries: Array<{ raw: string; source: RawWordSource }> = [];

  for (const [index, line] of lines.entries()) {
    if (index === 0 && /^\d+$/.test(line.trim())) {
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const stem = trimmed.split('/')[0]?.trim() ?? '';
    if (!stem) {
      continue;
    }

    entries.push({ raw: stem, source });
  }

  return entries;
}

function filterImportableWord(rawValue: string, options: { minLength: number; maxLength: number }) {
  const normalized = normalizeSwedish(cleanRawWord(rawValue));

  if (!rawValue.trim()) {
    return null;
  }

  if (!isValidAnswerFormat(rawValue)) {
    return null;
  }

  if (!SWEDISH_WORD_PATTERN.test(normalized)) {
    return null;
  }

  if (normalized.length < options.minLength || normalized.length > options.maxLength) {
    return null;
  }

  if (looksLikeProperNoun(rawValue)) {
    return null;
  }

  if (NEVER_ALLOW_WORDS.has(normalized)) {
    return null;
  }

  return normalizeAnswer(rawValue);
}

function loadHunspellImports() {
  const imports: SourceRecordImport[] = [];

  for (const filePath of listFiles(HUNSPELL_DIR)) {
    if (!filePath.endsWith('.dic')) {
      continue;
    }

    for (const entry of extractWordsFromDic(filePath, 'hunspell')) {
      const normalized = filterImportableWord(entry.raw, {
        minLength: 3,
        maxLength: 12,
      });

      if (!normalized) {
        continue;
      }

      imports.push({
        normalizedAnswer: normalized.normalizedAnswer,
        answer: normalized.answer,
        length: normalized.length,
        sourceKey: 'hunspell',
        sourceReference: path.basename(filePath),
        rawValue: entry.raw,
        observedAnswer: normalized.answer,
        frequency: null,
        rank: null,
        cefr: null,
        metadata: {
          coverage: 'broad',
        },
      });
    }
  }

  return imports;
}

function isKellyProperName(entry: KellyEntry) {
  if (/proper\s*name/i.test(entry.wordClass)) {
    return true;
  }

  return looksLikeProperNoun(entry.lemma) && !isAllUppercaseWord(entry.lemma);
}

function loadKellyImports() {
  const imports: SourceRecordImport[] = [];

  for (const filePath of listFiles(KELLY_DIR)) {
    if (!filePath.endsWith('.csv')) {
      continue;
    }

    for (const entry of parseKellyCsv(filePath)) {
      if (!ALLOWED_CEFR_LEVELS.has(entry.cefr as CefrLevel)) {
        continue;
      }

      if (isKellyProperName(entry)) {
        continue;
      }

      const normalized = filterImportableWord(entry.lemma, {
        minLength: 3,
        maxLength: 12,
      });

      if (!normalized) {
        continue;
      }

      imports.push({
        normalizedAnswer: normalized.normalizedAnswer,
        answer: normalized.answer,
        length: normalized.length,
        sourceKey: 'kelly-cefr',
        sourceReference: path.basename(filePath),
        rawValue: entry.lemma,
        observedAnswer: normalized.answer,
        frequency: entry.rawFreq,
        rank: entry.rank,
        cefr: entry.cefr || null,
        metadata: {
          wordClass: entry.wordClass,
          rank: entry.rank,
          frequency: entry.rawFreq,
          cefr: entry.cefr || null,
        },
      });
    }
  }

  return imports;
}

function dedupeImports(records: SourceRecordImport[]) {
  const byKey = new Map<string, SourceRecordImport>();

  for (const record of records) {
    const key = `${record.normalizedAnswer}:${record.sourceKey}:${record.sourceReference}`;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, record);
      continue;
    }

    if ((record.rank ?? Number.MAX_SAFE_INTEGER) < (existing.rank ?? Number.MAX_SAFE_INTEGER)) {
      byKey.set(key, record);
    }
  }

  return [...byKey.values()];
}

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

async function upsertWords(records: SourceRecordImport[], defaultStatus: ContentStatus) {
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
    },
  });

  return new Map(words.map((word) => [word.normalizedAnswer, word.id]));
}

async function upsertSourceRecords(
  batchId: string,
  records: SourceRecordImport[],
  wordIdByNormalizedAnswer: Map<string, string>,
  mode: ImportMode,
) {
  let upserted = 0;

  for (const record of records) {
    const wordId = wordIdByNormalizedAnswer.get(record.normalizedAnswer);

    if (!wordId) {
      continue;
    }

    const existing = await prisma.wordSourceRecord.findUnique({
      where: {
        wordId_sourceKey_sourceReference: {
          wordId,
          sourceKey: record.sourceKey,
          sourceReference: record.sourceReference,
        },
      },
      select: {
        id: true,
        metadata: true,
        firstImportedAt: true,
      },
    });

    if (existing && mode === 'insert-missing') {
      continue;
    }

    const nextMetadata =
      mode === 'refresh-source-metadata' || !existing ? record.metadata : existing.metadata;

    await prisma.wordSourceRecord.upsert({
      where: {
        wordId_sourceKey_sourceReference: {
          wordId,
          sourceKey: record.sourceKey,
          sourceReference: record.sourceReference,
        },
      },
      create: {
        wordId,
        importBatchId: batchId,
        sourceKey: record.sourceKey,
        sourceReference: record.sourceReference,
        rawValue: record.rawValue,
        normalizedValue: record.normalizedAnswer,
        observedAnswer: record.observedAnswer,
        frequency: record.frequency,
        rank: record.rank,
        cefr: record.cefr,
        metadata: record.metadata,
      },
      update: {
        importBatchId: batchId,
        rawValue: record.rawValue,
        normalizedValue: record.normalizedAnswer,
        observedAnswer: record.observedAnswer,
        frequency: record.frequency,
        rank: record.rank,
        cefr: record.cefr,
        metadata: nextMetadata,
        lastImportedAt: new Date(),
      },
    });

    upserted += 1;
  }

  return upserted;
}

async function reconcileWords(wordIds: string[]) {
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

async function main() {
  const options = parseArgs();
  const importedAt = new Date();
  const records = dedupeImports(
    [
      ...(options.source === 'all' || options.source === 'hunspell' ? loadHunspellImports() : []),
      ...(options.source === 'all' || options.source === 'kelly' ? loadKellyImports() : []),
    ].sort((left, right) => left.normalizedAnswer.localeCompare(right.normalizedAnswer, 'sv-SE')),
  );

  const batch = await prisma.importBatch.create({
    data: {
      type: 'WORDS',
      filename: null,
      source: `raw:${options.source}`,
      status: 'PENDING',
      totalRows: records.length,
    },
  });

  try {
    const wordIdByNormalizedAnswer = await upsertWords(records, options.defaultStatus);
    const sourceRecordsUpserted = await upsertSourceRecords(
      batch.id,
      records,
      wordIdByNormalizedAnswer,
      options.mode,
    );
    const touchedWordIds = [
      ...new Set(
        records
          .map((record) => wordIdByNormalizedAnswer.get(record.normalizedAnswer))
          .filter(Boolean),
      ),
    ] as string[];

    await reconcileWords(touchedWordIds);

    const createdWords = await prisma.word.count({
      where: {
        createdAt: {
          gte: new Date(importedAt.getTime() - 1000),
        },
        source: 'import',
      },
    });

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: 'COMPLETED',
        importedRows: sourceRecordsUpserted,
        skippedRows: Math.max(0, records.length - sourceRecordsUpserted),
        summary: {
          mode: options.mode,
          source: options.source,
          defaultStatus: options.defaultStatus,
          sourceRecordsUpserted,
          touchedWords: touchedWordIds.length,
          createdWords,
          importedAt: importedAt.toISOString(),
        },
        completedAt: new Date(),
      },
    });

    console.log(
      `Raw import klar: ${sourceRecordsUpserted} källposter uppdaterade, ${touchedWordIds.length} ord reconciliade.`,
    );
  } catch (error) {
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: 'FAILED',
        errorRows: [
          {
            rowNumber: 0,
            reason: error instanceof Error ? error.message : 'Okänt importfel.',
          },
        ],
        completedAt: new Date(),
      },
    });

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
