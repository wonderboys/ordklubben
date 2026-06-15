import { logStegvisGeneratorMetrics } from '@/lib/content/stegvis/generator-metrics';
import { loadStegvisPuzzleBundles } from '@/lib/content/stegvis/load-puzzles';
import {
  chainMeetsPlayRequirement,
  countMiddleSteps,
  STEGVIS_MIDDLE_STEP_COUNT,
} from '@/lib/content/stegvis/play-chain';
import {
  isPlayReadyBundle,
  resolvePlayReadyBundle,
  tryGeneratePlayBundle,
} from '@/lib/content/stegvis/resolve-play-bundle';
import type { StegvisPuzzleBundle } from '@/lib/content/stegvis/types';
import { isWordBankAvailable, listActiveWordsWithClues } from '@/lib/content/word-bank';
import { pickDailyPuzzle } from '@/lib/game/stegvis';
import { normalizeStegvisWord } from '@/lib/game/stegvis';

export type StegvisPuzzleSource = 'generator' | 'static';

export type StegvisGeneratorDebugInfo = {
  start: string;
  target: string;
  steps: number;
  score: number;
  chain: string[];
  missingClues: number;
};

export type StegvisPlaySession = {
  initialBundle: StegvisPuzzleBundle;
  fallbackBundles: StegvisPuzzleBundle[];
  source: StegvisPuzzleSource;
  allowedWords?: string[];
  generatorDebug?: StegvisGeneratorDebugInfo;
};

function findBundleForPuzzle(
  bundles: StegvisPuzzleBundle[],
  puzzleId: string,
): StegvisPuzzleBundle {
  return bundles.find((bundle) => bundle.puzzle.id === puzzleId) ?? bundles[0];
}

async function buildStaticSession(
  fallbackBundles: StegvisPuzzleBundle[],
  reason?: string,
): Promise<StegvisPlaySession> {
  const playReadyFallbacks = fallbackBundles.filter((bundle) =>
    chainMeetsPlayRequirement(bundle.chain),
  );
  const daily = pickDailyPuzzle(
    (playReadyFallbacks.length > 0 ? playReadyFallbacks : fallbackBundles).map(
      (bundle) => bundle.puzzle,
    ),
  );
  const preferred = findBundleForPuzzle(
    playReadyFallbacks.length > 0 ? playReadyFallbacks : fallbackBundles,
    daily.id,
  );
  const resolved =
    (await resolvePlayReadyBundle([
      preferred,
      ...fallbackBundles.filter((bundle) => bundle.puzzle.id !== preferred.puzzle.id),
    ])) ??
    playReadyFallbacks.find((bundle) => bundle.puzzle.id !== preferred.puzzle.id) ??
    playReadyFallbacks[0];

  if (!resolved || !isPlayReadyBundle(resolved)) {
    throw new Error('stegvis_no_play_ready_bundle');
  }

  logStegvisGeneratorMetrics({
    source: 'static',
    reason,
    chainLength: resolved.chain.length,
    middleSteps: countMiddleSteps(resolved.chain),
  });

  return {
    initialBundle: resolved,
    fallbackBundles,
    source: 'static',
  };
}

export async function loadStegvisPlaySession(): Promise<StegvisPlaySession> {
  const fallbackBundles = await loadStegvisPuzzleBundles();

  if (!isWordBankAvailable()) {
    return buildStaticSession(fallbackBundles, 'ordbank_unavailable');
  }

  try {
    const generatedBundle = await tryGeneratePlayBundle();

    if (!generatedBundle || !isPlayReadyBundle(generatedBundle)) {
      return buildStaticSession(fallbackBundles, 'generator_no_valid_chain');
    }

    const words = await listActiveWordsWithClues({
      minLength: 4,
      maxLength: 4,
    });

    const allowedWords = words.map((word) => normalizeStegvisWord(word.normalizedAnswer));

    const puzzlePath = generatedBundle.chain.map((step) => step.displayAnswer);

    logStegvisGeneratorMetrics({
      source: 'generator',
      steps: generatedBundle.puzzle.minimumSteps,
      chainLength: generatedBundle.chain.length,
      middleSteps: countMiddleSteps(generatedBundle.chain),
      missingClues: generatedBundle.chain.filter(
        (step) => step.role === 'middle' && step.clueText === 'Nyckel saknas',
      ).length,
      candidates: undefined,
      pathsTried: undefined,
    });

    const generatorDebug: StegvisGeneratorDebugInfo = {
      start: generatedBundle.start.answer,
      target: generatedBundle.target.answer,
      steps: STEGVIS_MIDDLE_STEP_COUNT,
      score: 0,
      chain: puzzlePath,
      missingClues: generatedBundle.chain.filter((step) => step.clueText === 'Nyckel saknas')
        .length,
    };

    return {
      initialBundle: generatedBundle,
      fallbackBundles,
      source: 'generator',
      allowedWords,
      generatorDebug: process.env.NODE_ENV === 'development' ? generatorDebug : undefined,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'generator_error';

    return buildStaticSession(fallbackBundles, reason);
  }
}

export {
  STEGVIS_CHAIN_WORD_COUNT,
  STEGVIS_MIDDLE_STEP_COUNT,
} from '@/lib/content/stegvis/play-chain';
