import { getPrisma, isDatabaseConfigured } from '@/lib/db/prisma';
import { createBildjaktPuzzle, type BildjaktPuzzle } from '@/lib/game/bildjakten/types';

const IMAGE_PATH_PATTERN = /\.(svg|png|jpe?g|webp|gif|avif)(\?.*)?$/i;

function normalizeImagePath(value: string) {
  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\.\//, '')}`;
}

function extractImageUrlFromText(text: string | null | undefined) {
  if (!text?.trim()) {
    return null;
  }

  for (const rawCandidate of text.trim().split(/\r?\n/)) {
    const candidate = rawCandidate.trim();

    if (!candidate) {
      continue;
    }

    if (
      /^https?:\/\//i.test(candidate) ||
      candidate.startsWith('/') ||
      IMAGE_PATH_PATTERN.test(candidate)
    ) {
      return normalizeImagePath(candidate);
    }
  }

  return null;
}

export async function loadBildjaktenPuzzles(): Promise<BildjaktPuzzle[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const prisma = getPrisma();
  const mediaAssets = await prisma.mediaAsset.findMany({
    where: {
      mediaType: 'IMAGE',
      status: 'APPROVED',
      word: {
        status: 'APPROVED',
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { word: { answer: 'asc' } }],
    select: {
      id: true,
      title: true,
      altText: true,
      filePath: true,
      sourceReference: true,
      notes: true,
      word: {
        select: {
          id: true,
          answer: true,
          normalizedAnswer: true,
        },
      },
    },
  });

  return mediaAssets
    .map((asset) => {
      const imageUrl =
        (asset.filePath?.trim() ? normalizeImagePath(asset.filePath) : null) ??
        extractImageUrlFromText(asset.sourceReference) ??
        extractImageUrlFromText(asset.notes);

      if (!imageUrl) {
        return null;
      }

      return createBildjaktPuzzle({
        id: asset.id,
        mediaAssetId: asset.id,
        wordId: asset.word.id,
        answer: asset.word.answer,
        normalizedAnswer: asset.word.normalizedAnswer,
        imageUrl,
        altText:
          asset.altText?.trim() || asset.title?.trim() || `Bild för ordet ${asset.word.answer}`,
        title: asset.title,
      });
    })
    .filter((puzzle): puzzle is BildjaktPuzzle => Boolean(puzzle));
}
