import type { Prisma, PrismaClient } from "@prisma/client";
import {
  ACTIVE_CLUE_STATUS,
  ACTIVE_WORD_STATUS,
  type WordBankQueryFilters,
} from "@/lib/content/word-bank/types";

export const wordBankWordSelect = {
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
    orderBy: {
      theme: {
        name: "asc" as const,
      },
    },
  },
} satisfies Prisma.WordSelect;

export const wordBankClueSelect = {
  id: true,
  wordId: true,
  text: true,
  type: true,
  status: true,
  difficulty: true,
  tone: true,
  source: true,
} satisfies Prisma.HintSelect;

const clueOrderBy = [
  { difficulty: "asc" as const },
  { type: "asc" as const },
  { text: "asc" as const },
];

export function buildActiveWordWhere(
  filters: WordBankQueryFilters = {},
): Prisma.WordWhereInput {
  const where: Prisma.WordWhereInput = {
    status: ACTIVE_WORD_STATUS,
  };

  if (filters.themeId) {
    where.themes = {
      some: {
        themeId: filters.themeId,
      },
    };
  }

  if (filters.themeSlug) {
    where.themes = {
      some: {
        theme: {
          slug: filters.themeSlug,
        },
      },
    };
  }

  if (filters.difficulty !== undefined) {
    where.difficulty = filters.difficulty;
  } else if (
    filters.minDifficulty !== undefined ||
    filters.maxDifficulty !== undefined
  ) {
    where.difficulty = {
      ...(filters.minDifficulty !== undefined
        ? { gte: filters.minDifficulty }
        : {}),
      ...(filters.maxDifficulty !== undefined
        ? { lte: filters.maxDifficulty }
        : {}),
    };
  }

  if (filters.minLength !== undefined || filters.maxLength !== undefined) {
    where.length = {
      ...(filters.minLength !== undefined ? { gte: filters.minLength } : {}),
      ...(filters.maxLength !== undefined ? { lte: filters.maxLength } : {}),
    };
  }

  return where;
}

export async function fetchActiveWordById(prisma: PrismaClient, id: string) {
  return prisma.word.findFirst({
    where: {
      id,
      status: ACTIVE_WORD_STATUS,
    },
    select: wordBankWordSelect,
  });
}

export async function fetchActiveWordClues(prisma: PrismaClient, wordId: string) {
  return prisma.hint.findMany({
    where: {
      wordId,
      status: ACTIVE_CLUE_STATUS,
    },
    select: wordBankClueSelect,
    orderBy: clueOrderBy,
  });
}

export async function fetchActiveWordWithCluesRow(
  prisma: PrismaClient,
  id: string,
) {
  return prisma.word.findFirst({
    where: {
      id,
      status: ACTIVE_WORD_STATUS,
    },
    select: {
      ...wordBankWordSelect,
      hints: {
        where: {
          status: ACTIVE_CLUE_STATUS,
        },
        select: wordBankClueSelect,
        orderBy: clueOrderBy,
      },
    },
  });
}

export async function fetchActiveWordWithCluesByNormalizedAnswer(
  prisma: PrismaClient,
  normalizedAnswer: string,
) {
  return prisma.word.findFirst({
    where: {
      normalizedAnswer,
      status: ACTIVE_WORD_STATUS,
    },
    select: {
      ...wordBankWordSelect,
      hints: {
        where: {
          status: ACTIVE_CLUE_STATUS,
        },
        select: wordBankClueSelect,
        orderBy: clueOrderBy,
      },
    },
  });
}

export async function fetchActiveWordsWithClues(
  prisma: PrismaClient,
  filters: WordBankQueryFilters = {},
) {
  return prisma.word.findMany({
    where: buildActiveWordWhere(filters),
    select: {
      ...wordBankWordSelect,
      hints: {
        where: {
          status: ACTIVE_CLUE_STATUS,
        },
        select: wordBankClueSelect,
        orderBy: clueOrderBy,
      },
    },
    orderBy: [{ length: "asc" }, { answer: "asc" }],
  });
}
