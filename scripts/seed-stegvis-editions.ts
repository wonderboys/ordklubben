import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { WordBankWordWithClues } from '../lib/content/word-bank/types.ts';
import type { StegvisGeneratedPuzzle } from '../lib/content/stegvis/generator/types.ts';
import {
  createDailyEditionPublishAtForOffset,
  formatStockholmDayKey,
} from '../lib/content/game-editions/daily-schedule.ts';
import { dailyEditionMetadata, upsertDailyEditionForDay } from './lib/seed-daily-edition.ts';
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
    let removedDuplicates = 0;
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

      const publishAt = createDailyEditionPublishAtForOffset(offset);
      const dayKey = formatStockholmDayKey(publishAt);
      const metadata = {
        ...dailyEditionMetadata('seed-stegvis', dayKey, publishAt),
        chain: puzzle.path.map((step) => step.answer),
        seed: seed - 1,
      };

      const {
        editionId,
        created,
        removedDuplicates: removedForDay,
      } = await upsertDailyEditionForDay(prisma, {
        gameId: game.id,
        dayKey,
        publishAt,
        create: {
          game: {
            connect: {
              id: game.id,
            },
          },
          title: `${puzzle.start.answer} till ${puzzle.target.answer}`,
          editionType: 'DAILY',
          status: 'PUBLISHED',
          publishAt,
          metadata,
        },
        update: {
          title: `${puzzle.start.answer} till ${puzzle.target.answer}`,
          status: 'PUBLISHED',
          metadata,
        },
      });

      if (created) {
        createdEditions += 1;
      } else {
        updatedEditions += 1;
      }

      removedDuplicates += removedForDay;

      await prisma.gameEditionWord.deleteMany({
        where: {
          editionId,
        },
      });

      for (const [index, step] of puzzle.path.entries()) {
        const role = index === 0 ? 'START' : index === puzzle.path.length - 1 ? 'TARGET' : 'STEP';

        await prisma.gameEditionWord.create({
          data: {
            editionId,
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
      `Stegvis-seed klar: ${createdEditions} nya editions, ${updatedEditions} uppdaterade editions, ${removedDuplicates} dubbletter borttagna för spelet ${game.slug}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
