import { getPrisma, isDatabaseConfigured } from '@/lib/db/prisma';
import type { OrdstormWordCatalog } from '@/lib/games/ordstorm/types';

const ORDSTORM_GAME_SLUG = 'ordstorm';
const SEED_WORD_LENGTH = 6;
const DEFAULT_SEED_DIFFICULTY = 99;
const DEFAULT_SEED_PRIORITY = Number.MAX_SAFE_INTEGER;

function compareSeedProfiles(
  left: {
    priority: number | null;
    difficulty: number | null;
    answer: string;
  },
  right: {
    priority: number | null;
    difficulty: number | null;
    answer: string;
  },
) {
  const priorityOrder =
    (left.priority ?? DEFAULT_SEED_PRIORITY) - (right.priority ?? DEFAULT_SEED_PRIORITY);

  if (priorityOrder !== 0) {
    return priorityOrder;
  }

  const difficultyOrder =
    (left.difficulty ?? DEFAULT_SEED_DIFFICULTY) - (right.difficulty ?? DEFAULT_SEED_DIFFICULTY);

  if (difficultyOrder !== 0) {
    return difficultyOrder;
  }

  return left.answer.localeCompare(right.answer, 'sv-SE');
}

function isCommonProfile(profile: {
  difficulty: number | null;
  word: {
    difficulty: number | null;
    frequency: number | null;
  };
}) {
  const difficulty = profile.difficulty ?? profile.word.difficulty;

  if (difficulty !== null && difficulty <= 2) {
    return true;
  }

  return profile.word.frequency !== null && profile.word.frequency <= 5000;
}

export async function loadOrdstormWordCatalog(): Promise<OrdstormWordCatalog | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const prisma = getPrisma();

  const profiles = await prisma.gameWord.findMany({
    where: {
      blocked: false,
      canBeGuess: true,
      game: {
        slug: ORDSTORM_GAME_SLUG,
      },
      word: {
        status: 'APPROVED',
        length: {
          gte: 3,
          lte: 6,
        },
      },
    },
    include: {
      word: {
        select: {
          answer: true,
          normalizedAnswer: true,
          length: true,
          difficulty: true,
          frequency: true,
        },
      },
    },
    orderBy: [{ word: { length: 'asc' } }, { word: { answer: 'asc' } }],
  });

  if (profiles.length === 0) {
    return null;
  }

  const allowedWords = [...new Set(profiles.map((profile) => profile.word.normalizedAnswer))];

  const commonWords = [
    ...new Set(
      profiles
        .filter((profile) => isCommonProfile(profile))
        .map((profile) => profile.word.normalizedAnswer),
    ),
  ];

  const seedProfiles = profiles
    .filter((profile) => profile.canBeSeed && profile.word.length === SEED_WORD_LENGTH)
    .map((profile) => ({
      normalizedAnswer: profile.word.normalizedAnswer,
      priority: profile.priority,
      difficulty: profile.difficulty ?? profile.word.difficulty,
      answer: profile.word.answer,
    }))
    .sort(compareSeedProfiles);

  const seedWords = [...new Set(seedProfiles.map((profile) => profile.normalizedAnswer))];

  return {
    allowedWords,
    commonWords: [...new Set(commonWords.length > 0 ? commonWords : allowedWords)],
    seedWords: [
      ...new Set(
        seedWords.length > 0
          ? seedWords
          : allowedWords.filter((word) => word.length === SEED_WORD_LENGTH),
      ),
    ],
  };
}
