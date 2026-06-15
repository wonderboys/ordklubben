import type { PrismaClient } from '@prisma/client';
import { mapWordBankClue, mapWordBankWord } from '@/lib/content/word-bank/mappers';
import {
  buildActiveWordWhere,
  fetchActiveWordById,
  fetchActiveWordClues,
  fetchActiveWordsWithClues,
  fetchActiveWordWithCluesByNormalizedAnswer,
  fetchActiveWordWithCluesRow,
  wordBankWordSelect,
} from '@/lib/content/word-bank/queries';
import type {
  WordBankClue,
  WordBankQueryFilters,
  WordBankWord,
  WordBankWordWithClues,
} from '@/lib/content/word-bank/types';
import { getPrisma, isDatabaseConfigured } from '@/lib/db/prisma';

type WordBankClient = PrismaClient;

function resolveClient(client?: WordBankClient) {
  if (client) {
    return client;
  }

  if (!isDatabaseConfigured()) {
    throw new Error(
      'Ordbanken kräver DATABASE_URL. Konfigurera databasen innan word-bank API anropas.',
    );
  }

  return getPrisma();
}

/**
 * Hämta ett godkänt ord från ordbanken.
 * Returnerar null om ordet saknas eller inte är aktivt (APPROVED).
 */
export async function getWord(id: string, client?: WordBankClient): Promise<WordBankWord | null> {
  const prisma = resolveClient(client);
  const word = await fetchActiveWordById(prisma, id);

  if (!word) {
    return null;
  }

  return mapWordBankWord(word);
}

/**
 * Hämta godkända textnycklar för ett ord.
 * Returnerar tom lista om ordet saknas eller inte är aktivt.
 */
export async function getWordClues(id: string, client?: WordBankClient): Promise<WordBankClue[]> {
  const prisma = resolveClient(client);
  const word = await fetchActiveWordById(prisma, id);

  if (!word) {
    return [];
  }

  const clues = await fetchActiveWordClues(prisma, id);
  return clues.map(mapWordBankClue);
}

/**
 * Hämta ord tillsammans med sina godkända nycklar.
 */
export async function getWordWithClues(
  id: string,
  client?: WordBankClient,
): Promise<WordBankWordWithClues | null> {
  const prisma = resolveClient(client);
  const row = await fetchActiveWordWithCluesRow(prisma, id);

  if (!row) {
    return null;
  }

  const { hints, ...word } = row;

  return {
    ...mapWordBankWord(word),
    clues: hints.map(mapWordBankClue),
  };
}

/**
 * Hämta godkänt ord med nycklar via normaliserat svar (t.ex. HAND).
 */
export async function getWordWithCluesByNormalizedAnswer(
  normalizedAnswer: string,
  client?: WordBankClient,
): Promise<WordBankWordWithClues | null> {
  const prisma = resolveClient(client);
  const row = await fetchActiveWordWithCluesByNormalizedAnswer(prisma, normalizedAnswer);

  if (!row) {
    return null;
  }

  const { hints, ...word } = row;

  return {
    ...mapWordBankWord(word),
    clues: hints.map(mapWordBankClue),
  };
}

/**
 * List approved words with their approved clues.
 */
export async function listActiveWordsWithClues(
  filters: WordBankQueryFilters = {},
  client?: WordBankClient,
): Promise<WordBankWordWithClues[]> {
  const prisma = resolveClient(client);
  const rows = await fetchActiveWordsWithClues(prisma, filters);

  return rows.map(({ hints, ...word }) => ({
    ...mapWordBankWord(word),
    clues: hints.map(mapWordBankClue),
  }));
}

/**
 * List active words with optional theme/difficulty filters.
 */
export async function listActiveWords(
  filters: WordBankQueryFilters = {},
  client?: WordBankClient,
): Promise<WordBankWord[]> {
  const prisma = resolveClient(client);

  const words = await prisma.word.findMany({
    where: buildActiveWordWhere(filters),
    select: wordBankWordSelect,
    orderBy: [{ length: 'asc' }, { answer: 'asc' }],
  });

  return words.map(mapWordBankWord);
}

export { isDatabaseConfigured as isWordBankAvailable };
