import type { WordBankWordWithClues } from "@/lib/content/word-bank/types";
import type { WordGraph } from "@/lib/content/stegvis/word-graph/types";

export type StegvisDifficultyBand = "EASY" | "MEDIUM" | "HARD";

export const DEFAULT_STEGVIS_GENERATOR_OPTIONS = {
  length: 4,
  minSteps: 4,
  maxSteps: 7,
  maxAttempts: 800,
  requiredMiddleCount: undefined,
} as const;

export type GenerateStegvisPuzzleOptions = {
  length?: number;
  minSteps?: number;
  maxSteps?: number;
  /** When set, only accept chains with this many middle words. */
  requiredMiddleCount?: number;
  themeSlug?: string;
  difficulty?: StegvisDifficultyBand;
  maxAttempts?: number;
  seed?: number;
};

export type StegvisGeneratedWordSlot = {
  wordId: string;
  answer: string;
  clue: string | null;
  hasClue: boolean;
};

export type StegvisGeneratedPuzzleStats = {
  length: number;
  steps: number;
  candidates: number;
  pathsTried: number;
  missingClues: number;
  score: number;
};

export type StegvisGeneratedPuzzle = {
  start: StegvisGeneratedWordSlot;
  target: StegvisGeneratedWordSlot;
  path: StegvisGeneratedWordSlot[];
  stats: StegvisGeneratedPuzzleStats;
};

export type StegvisGeneratorSearchStats = {
  length: number;
  candidates: number;
  pathsTried: number;
};

export type GenerateStegvisPuzzleResult =
  | { ok: true; puzzle: StegvisGeneratedPuzzle }
  | {
      ok: false;
      reason: string;
      stats: StegvisGeneratorSearchStats;
    };

export type StegvisGeneratorCorpus = {
  words: WordBankWordWithClues[];
  graph: WordGraph;
  wordsByAnswer: Map<string, WordBankWordWithClues>;
};
