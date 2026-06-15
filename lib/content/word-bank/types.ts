import type { ContentStatus, HintType } from "@prisma/client";

/** Approved words in Ordklubben's ordbank are considered active for gameplay. */
export const ACTIVE_WORD_STATUS = "APPROVED" as const satisfies ContentStatus;

/** Hints/nycklar exposed to players must be approved. */
export const ACTIVE_CLUE_STATUS = "APPROVED" as const satisfies ContentStatus;

export type WordBankThemeRef = {
  id: string;
  slug: string;
  name: string;
};

export type WordBankWord = {
  id: string;
  answer: string;
  normalizedAnswer: string;
  length: number;
  language: string;
  difficulty: number | null;
  frequency: number | null;
  crosswordScore: number | null;
  themes: WordBankThemeRef[];
};

/**
 * A text-based clue (nyckel) attached to a word.
 * Media fields can be added when image/audio hints ship.
 */
export type WordBankClue = {
  id: string;
  wordId: string;
  text: string;
  type: HintType;
  status: ContentStatus;
  difficulty: number | null;
  tone: string | null;
  source: string | null;
};

export type WordBankWordWithClues = WordBankWord & {
  clues: WordBankClue[];
};

/** Filters for future list/search endpoints (themes, difficulty bands, length). */
export type WordBankQueryFilters = {
  themeId?: string;
  themeSlug?: string;
  difficulty?: number;
  minDifficulty?: number;
  maxDifficulty?: number;
  minLength?: number;
  maxLength?: number;
};
