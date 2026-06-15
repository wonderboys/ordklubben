/** Image shown in the puzzle — consumed by the game UI via `image.src` / `image.alt`. */
export type BildjaktImage = {
  src: string;
  alt: string;
};

/**
 * Game-facing puzzle shape.
 * UI reads only this type — never raw DB rows or prototype JSON.
 */
export type BildjaktPuzzle = {
  id: string;
  answer: string;
  normalizedAnswer: string;
  imageUrl: string;
  altText: string;
  title: string | null;
  image: BildjaktImage;
  mediaAssetId?: string;
  wordId?: string;
};

export function createBildjaktPuzzle(input: {
  id: string;
  answer: string;
  normalizedAnswer: string;
  imageUrl: string;
  altText: string;
  title?: string | null;
  mediaAssetId?: string;
  wordId?: string;
}): BildjaktPuzzle {
  return {
    id: input.id,
    answer: input.answer,
    normalizedAnswer: input.normalizedAnswer,
    imageUrl: input.imageUrl,
    altText: input.altText,
    title: input.title ?? null,
    image: {
      src: input.imageUrl,
      alt: input.altText,
    },
    mediaAssetId: input.mediaAssetId,
    wordId: input.wordId,
  };
}
