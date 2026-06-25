import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { WordBankWordWithClues } from '../lib/content/word-bank/types.ts';
import type { StegvisGeneratedPuzzle } from '../lib/content/stegvis/generator/types.ts';
import {
  buildStegvisGeneratorCorpus,
  generateStegvisPuzzleFromCorpus,
} from './stegvis-generator-corpus.ts';

config();

const STEGVIS_GAME_SLUG = 'stegvis';
const STEGVIS_GAME_NAME = 'Stegvis';
const EDITION_DAY_OFFSETS = [-2, -1, 0, 1, 2];
const INITIAL_SEED = 101;
const MAX_SEED_ATTEMPTS = 100;
const STEGVIS_MIDDLE_STEP_COUNT = 5;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL saknas.');
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function createEditionPublishAt(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
}

function formatDayKey(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

async function loadApprovedWordsFromDatabase(length: number): Promise<WordBankWordWithClues[]> {
  const prisma = createPrismaClient();

  try {
    const rows = await prisma.word.findMany({
      where: {
        status: 'APPROVED',
        length,
      },
      select: {
        id: true,
        answer: true,
        normalizedAnswer: true,
        length: true,
        language: true,
        difficulty: true,
        frequency: true,
        crosswordScore: true,
        themes: {
          select: {
            theme: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        },
        hints: {
          where: {
            status: 'APPROVED',
          },
          select: {
            id: true,
            wordId: true,
            text: true,
            type: true,
            status: true,
            difficulty: true,
            tone: true,
            source: true,
          },
          orderBy: [{ difficulty: 'asc' }, { type: 'asc' }, { text: 'asc' }],
        },
      },
      orderBy: [{ length: 'asc' }, { answer: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      answer: row.answer,
      normalizedAnswer: row.normalizedAnswer,
      length: row.length,
      language: row.language,
      difficulty: row.difficulty,
      frequency: row.frequency,
      crosswordScore: row.crosswordScore,
      themes: row.themes.map((entry) => entry.theme),
      clues: row.hints,
    }));
  } finally {
    await prisma.$disconnect();
  }
}

function createPublishedPuzzle(seed: number, words: WordBankWordWithClues[]) {
  const corpus = buildStegvisGeneratorCorpus(words);
  const result = generateStegvisPuzzleFromCorpus(corpus, {
    length: 4,
    minSteps: STEGVIS_MIDDLE_STEP_COUNT + 1,
    maxSteps: STEGVIS_MIDDLE_STEP_COUNT + 1,
    requiredMiddleCount: STEGVIS_MIDDLE_STEP_COUNT,
    seed,
  });

  return result.ok ? result.puzzle : null;
}

async function main() {
  const prisma = createPrismaClient();

  try {
    const game = await prisma.game.upsert({
      where: { slug: STEGVIS_GAME_SLUG },
      create: {
        slug: STEGVIS_GAME_SLUG,
        name: STEGVIS_GAME_NAME,
        status: 'ACTIVE',
        description: 'Dagligt ordkedjespel där ett ord förvandlas till ett annat.',
      },
      update: {
        name: STEGVIS_GAME_NAME,
        status: 'ACTIVE',
        description: 'Dagligt ordkedjespel där ett ord förvandlas till ett annat.',
      },
    });

    const approvedWords = await loadApprovedWordsFromDatabase(4);

    let createdEditions = 0;
    let updatedEditions = 0;
    let seed = INITIAL_SEED;

    for (const offset of EDITION_DAY_OFFSETS) {
      let puzzle: StegvisGeneratedPuzzle | null = null;
      let attempts = 0;

      while (!puzzle && attempts < MAX_SEED_ATTEMPTS) {
        puzzle = createPublishedPuzzle(seed, approvedWords);
        attempts += 1;
        seed += 1;
      }

      if (!puzzle) {
        throw new Error(`Kunde inte generera en spelbar Stegvis-kedja efter ${attempts} försök.`);
      }

      const missingWordId = puzzle.path.find((step) => !step.wordId);

      if (missingWordId) {
        throw new Error(`Genererad Stegvis-kedja saknar wordId för ordet ${missingWordId.answer}.`);
      }

      const publishAt = createEditionPublishAt(addDays(new Date(), offset));
      const dayKey = formatDayKey(publishAt);

      const existingEdition = await prisma.gameEdition.findFirst({
        where: {
          gameId: game.id,
          editionType: 'DAILY',
          publishAt,
        },
        select: {
          id: true,
        },
      });

      const edition = existingEdition
        ? await prisma.gameEdition.update({
            where: {
              id: existingEdition.id,
            },
            data: {
              title: `${puzzle.start.answer} till ${puzzle.target.answer}`,
              status: 'PUBLISHED',
              metadata: {
                source: 'seed-stegvis',
                dayKey,
                chain: puzzle.path.map((step) => step.answer),
                seed: seed - 1,
              },
            },
          })
        : await prisma.gameEdition.create({
            data: {
              gameId: game.id,
              title: `${puzzle.start.answer} till ${puzzle.target.answer}`,
              editionType: 'DAILY',
              status: 'PUBLISHED',
              publishAt,
              metadata: {
                source: 'seed-stegvis',
                dayKey,
                chain: puzzle.path.map((step) => step.answer),
                seed: seed - 1,
              },
            },
          });

      if (existingEdition) {
        updatedEditions += 1;
      } else {
        createdEditions += 1;
      }

      await prisma.gameEditionWord.deleteMany({
        where: {
          editionId: edition.id,
        },
      });

      for (const [index, step] of puzzle.path.entries()) {
        const role = index === 0 ? 'START' : index === puzzle.path.length - 1 ? 'TARGET' : 'STEP';

        await prisma.gameEditionWord.create({
          data: {
            editionId: edition.id,
            wordId: step.wordId!,
            role,
            position: index,
            metadata: {
              clueText: step.clueText,
            },
          },
        });
      }
    }

    console.log(
      `Stegvis-seed klar: ${createdEditions} nya editions, ${updatedEditions} uppdaterade editions för spelet ${game.slug}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
