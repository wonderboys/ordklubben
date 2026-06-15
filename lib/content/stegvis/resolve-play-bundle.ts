import { generatedPuzzleToBundle } from '@/lib/content/stegvis/generated-puzzle-to-bundle';
import { generateStegvisPuzzle } from '@/lib/content/stegvis/generator';
import {
  chainMeetsPlayRequirement,
  extendBundleToPlayChain,
  STEGVIS_MIDDLE_STEP_COUNT,
} from '@/lib/content/stegvis/play-chain';
import type { StegvisPuzzleBundle } from '@/lib/content/stegvis/types';
import { buildStegvisGeneratorCorpus } from '@/lib/content/stegvis/generator/generate-corpus';
import { isWordBankAvailable, listActiveWordsWithClues } from '@/lib/content/word-bank';

const GENERATOR_RETRY_ATTEMPTS = 5;

export function isPlayReadyBundle(bundle: StegvisPuzzleBundle): boolean {
  return chainMeetsPlayRequirement(bundle.chain);
}

export async function tryGeneratePlayBundle(seed?: number): Promise<StegvisPuzzleBundle | null> {
  if (!isWordBankAvailable()) {
    return null;
  }

  const result = await generateStegvisPuzzle({
    length: 4,
    minSteps: STEGVIS_MIDDLE_STEP_COUNT + 1,
    maxSteps: STEGVIS_MIDDLE_STEP_COUNT + 1,
    requiredMiddleCount: STEGVIS_MIDDLE_STEP_COUNT,
    seed,
  });

  if (!result.ok) {
    return null;
  }

  const bundle = generatedPuzzleToBundle(result.puzzle);

  return isPlayReadyBundle(bundle) ? bundle : null;
}

export async function tryExtendBundleToPlayChain(
  bundle: StegvisPuzzleBundle,
): Promise<StegvisPuzzleBundle | null> {
  if (isPlayReadyBundle(bundle)) {
    return bundle;
  }

  if (!isWordBankAvailable()) {
    return null;
  }

  const words = await listActiveWordsWithClues({
    minLength: 4,
    maxLength: 4,
  });
  const corpus = buildStegvisGeneratorCorpus(words);
  const extended = extendBundleToPlayChain(bundle, corpus);

  return extended && isPlayReadyBundle(extended) ? extended : null;
}

export async function resolvePlayReadyBundle(
  candidates: StegvisPuzzleBundle[],
): Promise<StegvisPuzzleBundle | null> {
  for (const candidate of candidates) {
    const extended = await tryExtendBundleToPlayChain(candidate);

    if (extended) {
      return extended;
    }
  }

  for (let attempt = 0; attempt < GENERATOR_RETRY_ATTEMPTS; attempt += 1) {
    const generated = await tryGeneratePlayBundle(attempt + 1);

    if (generated) {
      return generated;
    }
  }

  return null;
}
