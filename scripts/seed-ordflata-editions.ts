import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import {
  createDailyEditionPublishAtForOffset,
  formatStockholmDayKey,
} from '../lib/content/game-editions/daily-schedule.ts';
import { dailyEditionMetadata, upsertDailyEditionForDay } from './lib/seed-daily-edition.ts';

config();

const ORDFLATA_GAME_SLUG = 'ordflata';
const ORDFLATA_GAME_NAME = 'Ordfläta';
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
      where: { slug: ORDFLATA_GAME_SLUG },
      create: {
        slug: ORDFLATA_GAME_SLUG,
        name: ORDFLATA_GAME_NAME,
        status: 'ACTIVE',
        description: 'Daglig svensk ordfläta med nycklar och rutnät.',
      },
      update: {
        name: ORDFLATA_GAME_NAME,
        status: 'ACTIVE',
        description: 'Daglig svensk ordfläta med nycklar och rutnät.',
      },
    });

    const puzzles = await prisma.puzzle.findMany({
      where: {
        type: 'WORD_GRID',
        entries: {
          some: {},
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
      select: {
        id: true,
        title: true,
      },
    });

    if (puzzles.length === 0) {
      throw new Error('Inga WORD_GRID-pussel med entries hittades i databasen.');
    }

    let createdEditions = 0;
    let updatedEditions = 0;
    let removedDuplicates = 0;

    for (const [index, offset] of EDITION_DAY_OFFSETS.entries()) {
      const puzzle = puzzles[index % puzzles.length];
      const publishAt = createDailyEditionPublishAtForOffset(offset);
      const dayKey = formatStockholmDayKey(publishAt);
      const metadata = {
        ...dailyEditionMetadata('seed-ordflata', dayKey, publishAt),
        puzzleId: puzzle.id,
      };

      const { created, removedDuplicates: removedForDay } = await upsertDailyEditionForDay(prisma, {
        gameId: game.id,
        dayKey,
        publishAt,
        create: {
          game: {
            connect: {
              id: game.id,
            },
          },
          title: puzzle.title.trim() || `Ordfläta ${dayKey}`,
          editionType: 'DAILY',
          status: 'PUBLISHED',
          publishAt,
          metadata,
        },
        update: {
          title: puzzle.title.trim() || `Ordfläta ${dayKey}`,
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
    }

    console.log(
      `Ordfläta-seed klar: ${createdEditions} nya editions, ${updatedEditions} uppdaterade editions, ${removedDuplicates} dubbletter borttagna för spelet ${game.slug}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
