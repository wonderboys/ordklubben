import type { Prisma, PrismaClient } from '@prisma/client';
import {
  formatStockholmDayKey,
  matchesStockholmDayKey,
} from '../../lib/content/game-editions/daily-schedule.ts';

type DailyEditionRow = {
  id: string;
  publishAt: Date | null;
  createdAt: Date;
};

export async function dedupeDailyEditionsForDay(
  prisma: PrismaClient,
  options: {
    gameId: string;
    dayKey: string;
  },
): Promise<{ kept: DailyEditionRow | null; removedCount: number }> {
  const editions = await prisma.gameEdition.findMany({
    where: {
      gameId: options.gameId,
      editionType: 'DAILY',
    },
    select: {
      id: true,
      publishAt: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: 'asc' }],
  });

  const matching = editions.filter((edition) =>
    matchesStockholmDayKey(edition.publishAt, options.dayKey),
  );

  if (matching.length <= 1) {
    return { kept: matching[0] ?? null, removedCount: 0 };
  }

  const [kept, ...duplicates] = matching;

  for (const duplicate of duplicates) {
    await prisma.gameEditionWord.deleteMany({
      where: {
        editionId: duplicate.id,
      },
    });
    await prisma.gameEdition.delete({
      where: {
        id: duplicate.id,
      },
    });
  }

  return { kept, removedCount: duplicates.length };
}

export async function upsertDailyEditionForDay(
  prisma: PrismaClient,
  options: {
    gameId: string;
    dayKey: string;
    publishAt: Date;
    create: Prisma.GameEditionCreateInput;
    update: Prisma.GameEditionUpdateInput;
  },
): Promise<{ editionId: string; created: boolean; removedDuplicates: number }> {
  const { kept, removedCount } = await dedupeDailyEditionsForDay(prisma, {
    gameId: options.gameId,
    dayKey: options.dayKey,
  });

  if (kept) {
    const edition = await prisma.gameEdition.update({
      where: {
        id: kept.id,
      },
      data: {
        ...options.update,
        publishAt: options.publishAt,
      },
    });

    return {
      editionId: edition.id,
      created: false,
      removedDuplicates: removedCount,
    };
  }

  const edition = await prisma.gameEdition.create({
    data: options.create,
  });

  return {
    editionId: edition.id,
    created: true,
    removedDuplicates: removedCount,
  };
}

export function dailyEditionMetadata(source: string, dayKey: string, publishAt: Date) {
  return {
    source,
    dayKey,
    publishDayKey: formatStockholmDayKey(publishAt),
  };
}
