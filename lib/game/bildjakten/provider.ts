import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { BILDJAKT_PROTOTYPE_PUZZLES } from "@/lib/game/bildjakten/puzzles";
import { createBildjaktPuzzle, type BildjaktPuzzle } from "@/lib/game/bildjakten/types";

/**
 * Puzzle source for Bildjakten.
 * Loads approved MediaAsset images from the database with fallback to prototype puzzles.
 */
export interface BildjaktPuzzleProvider {
  getPuzzles(): Promise<BildjaktPuzzle[]>;
}

const IMAGE_PATH_PATTERN = /\.(svg|png|jpe?g|webp|gif|avif)(\?.*)?$/i;

function normalizeImagePath(value: string): string {
  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\.\//, "")}`;
}

function extractImageUrlFromText(text: string | null | undefined): string | null {
  if (!text?.trim()) {
    return null;
  }

  const trimmed = text.trim();

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/") || IMAGE_PATH_PATTERN.test(trimmed)) {
    return normalizeImagePath(trimmed);
  }

  for (const line of trimmed.split(/\r?\n/)) {
    const candidate = line.trim();

    if (!candidate) {
      continue;
    }

    if (/^https?:\/\//i.test(candidate) || candidate.startsWith("/") || IMAGE_PATH_PATTERN.test(candidate)) {
      return normalizeImagePath(candidate);
    }
  }

  return null;
}

/** Resolves a playable image URL from MediaAsset fields. Priority: filePath → sourceReference → notes. */
export function resolveMediaAssetImageUrl(input: {
  filePath?: string | null;
  sourceReference?: string | null;
  notes?: string | null;
}): string | null {
  if (input.filePath?.trim()) {
    return normalizeImagePath(input.filePath.trim());
  }

  return extractImageUrlFromText(input.sourceReference) ?? extractImageUrlFromText(input.notes);
}

async function loadApprovedMediaAssetPuzzles(): Promise<BildjaktPuzzle[]> {
  const prisma = getPrisma();

  const mediaAssets = await prisma.mediaAsset.findMany({
    where: {
      mediaType: "IMAGE",
      status: "APPROVED",
      word: {
        status: "APPROVED",
      },
    },
    orderBy: [{ word: { answer: "asc" } }, { updatedAt: "desc" }],
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

  const puzzles: BildjaktPuzzle[] = [];

  for (const asset of mediaAssets) {
    const imageUrl = resolveMediaAssetImageUrl({
      filePath: asset.filePath,
      sourceReference: asset.sourceReference,
      notes: asset.notes,
    });

    if (!imageUrl) {
      continue;
    }

    const altText = asset.altText?.trim() || asset.title?.trim() || `Bild för ordet ${asset.word.answer}`;

    puzzles.push(
      mapMediaAssetToBildjaktPuzzle({
        mediaAssetId: asset.id,
        wordId: asset.word.id,
        answer: asset.word.answer,
        normalizedAnswer: asset.word.normalizedAnswer,
        imageUrl,
        altText,
        title: asset.title,
      }),
    );
  }

  return puzzles;
}

class MediaAssetBildjaktPuzzleProvider implements BildjaktPuzzleProvider {
  async getPuzzles() {
    if (!isDatabaseConfigured()) {
      return [];
    }

    try {
      return await loadApprovedMediaAssetPuzzles();
    } catch (error) {
      console.error("[bildjakten] Failed to load MediaAsset puzzles:", error);
      return [];
    }
  }
}

class FallbackBildjaktPuzzleProvider implements BildjaktPuzzleProvider {
  private readonly databaseProvider = new MediaAssetBildjaktPuzzleProvider();

  async getPuzzles() {
    const fromDatabase = await this.databaseProvider.getPuzzles();

    if (fromDatabase.length > 0) {
      return fromDatabase;
    }

    return BILDJAKT_PROTOTYPE_PUZZLES;
  }
}

let activeProvider: BildjaktPuzzleProvider = new FallbackBildjaktPuzzleProvider();

export function setBildjaktPuzzleProvider(provider: BildjaktPuzzleProvider) {
  activeProvider = provider;
}

export async function getBildjaktPuzzles(): Promise<BildjaktPuzzle[]> {
  return activeProvider.getPuzzles();
}

/**
 * Maps an approved MediaAsset (+ Word) row into the game puzzle shape.
 * Image URL resolution happens outside the UI layer.
 */
export function mapMediaAssetToBildjaktPuzzle(input: {
  mediaAssetId: string;
  wordId: string;
  answer: string;
  normalizedAnswer: string;
  imageUrl: string;
  altText: string;
  title: string | null;
}): BildjaktPuzzle {
  return createBildjaktPuzzle({
    id: input.mediaAssetId,
    mediaAssetId: input.mediaAssetId,
    wordId: input.wordId,
    answer: input.answer,
    normalizedAnswer: input.normalizedAnswer,
    imageUrl: input.imageUrl,
    altText: input.altText,
    title: input.title,
  });
}
