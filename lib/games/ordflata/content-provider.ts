import {
  formatStockholmDayKey,
  matchesStockholmDayKey,
} from '@/lib/content/game-editions/daily-schedule';
import { getPrisma, isDatabaseConfigured } from '@/lib/db/prisma';
import { mapPuzzleToPlayer } from '@/lib/games/ordflata/map-puzzle';
import type { OrdflataPlayerPuzzle } from '@/lib/games/ordflata/types';

const ORDFLATA_GAME_SLUG = 'ordflata';

function readPuzzleIdFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const puzzleId = (metadata as Record<string, unknown>).puzzleId;

  if (typeof puzzleId !== 'string') {
    return null;
  }

  const trimmed = puzzleId.trim();

  return trimmed.length > 0 ? trimmed : null;
}

async function loadPublishedDailyEditionForDate(date: Date) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const prisma = getPrisma();
  const todayKey = formatStockholmDayKey(date);

  const editions = await prisma.gameEdition.findMany({
    where: {
      status: 'PUBLISHED',
      editionType: 'DAILY',
      game: {
        slug: ORDFLATA_GAME_SLUG,
      },
    },
    orderBy: [{ publishAt: 'desc' }, { createdAt: 'desc' }],
  });

  return editions.find((edition) => matchesStockholmDayKey(edition.publishAt, todayKey)) ?? null;
}

export async function loadOrdflataPuzzle(date = new Date()): Promise<OrdflataPlayerPuzzle | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const prisma = getPrisma();
  const edition = await loadPublishedDailyEditionForDate(date);

  if (!edition) {
    return null;
  }

  const puzzleId = readPuzzleIdFromMetadata(edition.metadata);

  if (!puzzleId) {
    return null;
  }

  const puzzle = await prisma.puzzle.findUnique({
    where: {
      id: puzzleId,
      type: 'WORD_GRID',
    },
    include: {
      entries: {
        include: {
          hint: {
            select: {
              text: true,
            },
          },
        },
        orderBy: [{ direction: 'asc' }, { number: 'asc' }, { row: 'asc' }, { col: 'asc' }],
      },
      blockedCells: {
        orderBy: [{ row: 'asc' }, { col: 'asc' }],
      },
    },
  });

  if (!puzzle || puzzle.entries.length === 0) {
    return null;
  }

  return mapPuzzleToPlayer(puzzle);
}
