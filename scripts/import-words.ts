import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { isValidAnswerFormat, normalizeAnswer } from '../lib/content/normalize-answer';

const prisma = new PrismaClient();

function parseCsvRow(line: string) {
  const cells: string[] = [];
  let current = '';
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

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseAnswersCsv(contents: string) {
  const lines = contents
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error('CSV-filen är tom.');
  }

  const headers = parseCsvRow(lines[0]).map((header) => header.trim().toLocaleLowerCase('sv-SE'));
  const answerIndex = headers.indexOf('answer');

  if (answerIndex === -1) {
    throw new Error('CSV-filen måste innehålla kolumnen "answer".');
  }

  return lines.slice(1).map((line) => parseCsvRow(line)[answerIndex] ?? '');
}

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

async function main() {
  const inputPath = process.argv[2];
  const source = process.argv[3];

  if (!inputPath) {
    throw new Error('Användning: npm run import:words -- <sökväg-till-csv> [källa]');
  }

  const absolutePath = path.resolve(process.cwd(), inputPath);
  const contents = await readFile(absolutePath, 'utf8');
  const answers = parseAnswersCsv(contents);

  const batch = await prisma.importBatch.create({
    data: {
      filename: path.basename(absolutePath),
      source: source ?? 'csv',
      status: 'PENDING',
      totalRows: answers.length,
    },
  });

  try {
    const seenInFile = new Set<string>();
    const validRows = [];
    let skippedRows = 0;

    for (const rawAnswer of answers) {
      if (!isValidAnswerFormat(rawAnswer)) {
        skippedRows += 1;
        continue;
      }

      const normalized = normalizeAnswer(rawAnswer);

      if (seenInFile.has(normalized.normalizedAnswer)) {
        skippedRows += 1;
        continue;
      }

      seenInFile.add(normalized.normalizedAnswer);
      validRows.push(normalized);
    }

    const existingNormalizedAnswers = new Set<string>();

    for (const group of chunk(
      validRows.map((row) => row.normalizedAnswer),
      500,
    )) {
      const existingWords = await prisma.word.findMany({
        where: {
          normalizedAnswer: {
            in: group,
          },
        },
        select: {
          normalizedAnswer: true,
        },
      });

      for (const word of existingWords) {
        existingNormalizedAnswers.add(word.normalizedAnswer);
      }
    }

    const newWords = validRows.filter(
      (row) => !existingNormalizedAnswers.has(row.normalizedAnswer),
    );

    skippedRows += validRows.length - newWords.length;

    if (newWords.length > 0) {
      await prisma.word.createMany({
        data: newWords.map((row) => ({
          answer: row.answer,
          normalizedAnswer: row.normalizedAnswer,
          length: row.length,
          language: 'sv',
          status: 'DRAFT',
        })),
      });
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: 'COMPLETED',
        importedRows: newWords.length,
        skippedRows,
        completedAt: new Date(),
      },
    });

    console.log(`Import klar: ${newWords.length} importerade, ${skippedRows} skippade.`);
  } catch (error) {
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: 'FAILED',
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
