import {
  buildStegvisGeneratorCorpus,
  generateStegvisPuzzleFromCorpus,
} from "@/lib/content/stegvis/generator/generate-corpus";
import {
  DEFAULT_STEGVIS_GENERATOR_OPTIONS,
  type GenerateStegvisPuzzleOptions,
  type GenerateStegvisPuzzleResult,
  type StegvisDifficultyBand,
} from "@/lib/content/stegvis/generator/types";
import {
  isWordBankAvailable,
  listActiveWordsWithClues,
} from "@/lib/content/word-bank";
import type { WordBankQueryFilters } from "@/lib/content/word-bank/types";

function difficultyBandToFilters(
  difficulty?: StegvisDifficultyBand,
): Pick<WordBankQueryFilters, "minDifficulty" | "maxDifficulty"> {
  switch (difficulty) {
    case "EASY":
      return { minDifficulty: 1, maxDifficulty: 2 };
    case "MEDIUM":
      return { minDifficulty: 2, maxDifficulty: 3 };
    case "HARD":
      return { minDifficulty: 3, maxDifficulty: 5 };
    default:
      return {};
  }
}

function resolveGenerationFilters(
  options: GenerateStegvisPuzzleOptions,
): WordBankQueryFilters {
  const length = options.length ?? DEFAULT_STEGVIS_GENERATOR_OPTIONS.length;

  return {
    minLength: length,
    maxLength: length,
    ...(options.themeSlug ? { themeSlug: options.themeSlug } : {}),
    ...difficultyBandToFilters(options.difficulty),
  };
}

/**
 * Generates a Stegvis puzzle draft from approved ordbanksord and nycklar.
 */
export async function generateStegvisPuzzle(
  options: GenerateStegvisPuzzleOptions = {},
): Promise<GenerateStegvisPuzzleResult> {
  const length = options.length ?? DEFAULT_STEGVIS_GENERATOR_OPTIONS.length;

  if (!isWordBankAvailable()) {
    return {
      ok: false,
      reason: "Ordbanken är inte tillgänglig (DATABASE_URL saknas).",
      stats: {
        length,
        candidates: 0,
        pathsTried: 0,
      },
    };
  }

  const words = await listActiveWordsWithClues(resolveGenerationFilters(options));

  if (words.length < 2) {
    return {
      ok: false,
      reason: "För få godkända ord matchar filtren.",
      stats: {
        length,
        candidates: words.length,
        pathsTried: 0,
      },
    };
  }

  const corpus = buildStegvisGeneratorCorpus(words);
  return generateStegvisPuzzleFromCorpus(corpus, options);
}

export {
  buildStegvisGeneratorCorpus,
  generateStegvisPuzzleFromCorpus,
} from "@/lib/content/stegvis/generator/generate-corpus";
