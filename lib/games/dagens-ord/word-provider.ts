import { getPrisma, isDatabaseConfigured } from '@/lib/db/prisma';
import { listActiveWords } from '@/lib/server/words/provider';
import type { DagensOrdWordCatalog } from '@/lib/games/dagens-ord/types';

const DAGENS_ORD_GAME_SLUG = 'dagens-ord';
const STOCKHOLM_TIME_ZONE = 'Europe/Stockholm';

function formatDayKey(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: STOCKHOLM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

async function loadPublishedDailyEditionForDate(date: Date) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const prisma = getPrisma();
  const todayKey = formatDayKey(date);

  const editions = await prisma.gameEdition.findMany({
    where: {
      status: 'PUBLISHED',
      editionType: 'DAILY',
      publishAt: {
        lte: date,
      },
      game: {
        slug: DAGENS_ORD_GAME_SLUG,
      },
    },
    orderBy: [{ publishAt: 'desc' }, { createdAt: 'desc' }],
    take: 14,
    include: {
      words: {
        where: {
          role: 'SOLUTION',
        },
        include: {
          word: {
            select: {
              id: true,
              answer: true,
              normalizedAnswer: true,
              length: true,
            },
          },
        },
        orderBy: [{ createdAt: 'asc' }],
      },
    },
  });

  return (
    editions.find((edition) => edition.publishAt && formatDayKey(edition.publishAt) === todayKey) ??
    null
  );
}

export async function loadDagensOrdCatalog(
  date = new Date(),
): Promise<DagensOrdWordCatalog | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const words = await listActiveWords({
    minLength: 5,
    maxLength: 5,
  });

  const allowedWords = [...new Set(words.map((word) => word.normalizedAnswer))].sort((a, b) =>
    a.localeCompare(b, 'sv-SE'),
  );

  if (allowedWords.length === 0) {
    return null;
  }

  const edition = await loadPublishedDailyEditionForDate(date);

  if (!edition) {
    return null;
  }

  if (edition.words.length !== 1) {
    return null;
  }

  const solution = edition.words[0]?.word;

  if (!solution || solution.length !== 5) {
    return null;
  }

  return {
    dayKey: formatDayKey(edition.publishAt ?? date),
    targetWord: solution.normalizedAnswer,
    allowedWords,
  };
}
