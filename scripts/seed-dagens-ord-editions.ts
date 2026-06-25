import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import {
  createDailyEditionPublishAtForOffset,
  formatStockholmDayKey,
} from '../lib/content/game-editions/daily-schedule.ts';
import { dailyEditionMetadata, upsertDailyEditionForDay } from './lib/seed-daily-edition.ts';

config();

const DAGENS_ORD_GAME_SLUG = 'dagens-ord';
const DAGENS_ORD_GAME_NAME = 'Dagens Ord';
const EDITION_DAY_OFFSETS = [-2, -1, 0, 1, 2];

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL saknas.');
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

async function main() {
  const prisma = createPrismaClient();

  try {
    const game = await prisma.game.upsert({
      where: { slug: DAGENS_ORD_GAME_SLUG },
      create: {
        slug: DAGENS_ORD_GAME_SLUG,
        name: DAGENS_ORD_GAME_NAME,
        status: 'ACTIVE',
        description: 'Dagligt fem-bokstavsspel med sex försök.',
      },
      update: {
        name: DAGENS_ORD_GAME_NAME,
        status: 'ACTIVE',
        description: 'Dagligt fem-bokstavsspel med sex försök.',
      },
    });

    const words = await prisma.word.findMany({
      where: {
        status: 'APPROVED',
        length: 5,
      },
      orderBy: [{ normalizedAnswer: 'asc' }],
      select: {
        id: true,
        answer: true,
        normalizedAnswer: true,
        length: true,
      },
      take: Math.max(EDITION_DAY_OFFSETS.length, 7),
    });

    if (words.length < EDITION_DAY_OFFSETS.length) {
      throw new Error(
        `Behöver minst ${EDITION_DAY_OFFSETS.length} godkända ord med 5 bokstäver för att skapa Dagens Ord-editions.`,
      );
    }

    let createdEditions = 0;
    let updatedEditions = 0;
    let removedDuplicates = 0;

    for (const [index, offset] of EDITION_DAY_OFFSETS.entries()) {
      const publishAt = createDailyEditionPublishAtForOffset(offset);
      const dayKey = formatStockholmDayKey(publishAt);
      const solution = words[index];
      const metadata = dailyEditionMetadata('seed-dagens-ord', dayKey, publishAt);

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
          title: `Dagens Ord ${dayKey}`,
          editionType: 'DAILY',
          status: 'PUBLISHED',
          publishAt,
          metadata,
        },
        update: {
          title: `Dagens Ord ${dayKey}`,
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
          role: 'SOLUTION',
        },
      });

      await prisma.gameEditionWord.create({
        data: {
          editionId,
          wordId: solution.id,
          role: 'SOLUTION',
        },
      });
    }

    console.log(
      `Dagens Ord-seed klar: ${createdEditions} nya editions, ${updatedEditions} uppdaterade editions, ${removedDuplicates} dubbletter borttagna för spelet ${game.slug}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
