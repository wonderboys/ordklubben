import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

config();

const ORDSTORM_GAME_SLUG = 'ordstorm';
const ORDSTORM_GAME_NAME = 'Ordstorm';
const SEED_SOURCE = 'seed-ordstorm-game-words';
const SEED_WORD_LENGTH = 6;
const DEFAULT_PRIORITY = 999_999;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL saknas.');
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

function isSeedManagedProfile(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') {
    return true;
  }

  const source = (metadata as Record<string, unknown>).source;

  return source === undefined || source === SEED_SOURCE;
}

function computePriority(frequency: number | null) {
  return frequency ?? DEFAULT_PRIORITY;
}

async function main() {
  const prisma = createPrismaClient();

  try {
    const game = await prisma.game.upsert({
      where: { slug: ORDSTORM_GAME_SLUG },
      create: {
        slug: ORDSTORM_GAME_SLUG,
        name: ORDSTORM_GAME_NAME,
        status: 'ACTIVE',
        description: 'Sex bokstäver, sextio sekunder — hitta så många svenska ord som möjligt.',
      },
      update: {
        name: ORDSTORM_GAME_NAME,
        status: 'ACTIVE',
        description: 'Sex bokstäver, sextio sekunder — hitta så många svenska ord som möjligt.',
      },
    });

    const words = await prisma.word.findMany({
      where: {
        status: 'APPROVED',
        length: {
          gte: 3,
          lte: 6,
        },
      },
      select: {
        id: true,
        length: true,
        difficulty: true,
        frequency: true,
      },
      orderBy: [{ length: 'asc' }, { answer: 'asc' }],
    });

    const existingProfiles = await prisma.gameWord.findMany({
      where: {
        gameId: game.id,
      },
      select: {
        id: true,
        wordId: true,
        metadata: true,
      },
    });

    const existingByWordId = new Map(existingProfiles.map((profile) => [profile.wordId, profile]));

    let createdProfiles = 0;
    let updatedProfiles = 0;
    let skippedProfiles = 0;

    for (const word of words) {
      const existing = existingByWordId.get(word.id);
      const profileData = {
        canBeGuess: true,
        canBeSeed: word.length === SEED_WORD_LENGTH,
        blocked: false,
        difficulty: word.difficulty,
        priority: computePriority(word.frequency),
        metadata: {
          source: SEED_SOURCE,
        },
      };

      if (!existing) {
        await prisma.gameWord.create({
          data: {
            gameId: game.id,
            wordId: word.id,
            ...profileData,
          },
        });
        createdProfiles += 1;
        continue;
      }

      if (!isSeedManagedProfile(existing.metadata)) {
        skippedProfiles += 1;
        continue;
      }

      await prisma.gameWord.update({
        where: {
          id: existing.id,
        },
        data: profileData,
      });
      updatedProfiles += 1;
    }

    console.log(
      `Ordstorm-profil-seed klar: ${createdProfiles} nya GameWord, ${updatedProfiles} uppdaterade, ${skippedProfiles} befintliga profiler lämnades orörda för spelet ${game.slug}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
