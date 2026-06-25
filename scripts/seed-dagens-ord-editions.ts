import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function createEditionPublishAt(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0, 0),
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

    for (const [index, offset] of EDITION_DAY_OFFSETS.entries()) {
      const publishAt = createEditionPublishAt(addDays(new Date(), offset));
      const dayKey = formatDayKey(publishAt);
      const solution = words[index];

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
              title: `Dagens Ord ${dayKey}`,
              status: 'PUBLISHED',
              metadata: {
                source: 'seed-dagens-ord',
                dayKey,
              },
            },
          })
        : await prisma.gameEdition.create({
            data: {
              gameId: game.id,
              title: `Dagens Ord ${dayKey}`,
              editionType: 'DAILY',
              status: 'PUBLISHED',
              publishAt,
              metadata: {
                source: 'seed-dagens-ord',
                dayKey,
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
          role: 'SOLUTION',
        },
      });

      await prisma.gameEditionWord.create({
        data: {
          editionId: edition.id,
          wordId: solution.id,
          role: 'SOLUTION',
        },
      });
    }

    console.log(
      `Dagens Ord-seed klar: ${createdEditions} nya editions, ${updatedEditions} uppdaterade editions för spelet ${game.slug}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
