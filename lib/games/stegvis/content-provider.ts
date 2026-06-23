import type { StegvisPlaySession } from '@/lib/content/stegvis/load-play-session';
import {
  chainMeetsPlayRequirement,
  STEGVIS_MIDDLE_STEP_COUNT,
} from '@/lib/content/stegvis/play-chain';
import { tryGeneratePlayBundle } from '@/lib/content/stegvis/resolve-play-bundle';
import { isWordBankAvailable, listActiveWordsWithClues } from '@/lib/server/words/provider';
import { normalizeStegvisWord } from '@/lib/games/stegvis/rules';

export async function loadStegvisPlaySessionFromDb(): Promise<StegvisPlaySession | null> {
  if (!isWordBankAvailable()) {
    return null;
  }

  const generatedBundle = await tryGeneratePlayBundle();

  if (!generatedBundle || !chainMeetsPlayRequirement(generatedBundle.chain)) {
    return null;
  }

  const words = await listActiveWordsWithClues({
    minLength: 4,
    maxLength: 4,
  });

  return {
    initialBundle: generatedBundle,
    fallbackBundles: [],
    source: 'generator',
    allowedWords: words.map((word) => normalizeStegvisWord(word.normalizedAnswer)),
    generatorDebug:
      process.env.NODE_ENV === 'development'
        ? {
            start: generatedBundle.start.answer,
            target: generatedBundle.target.answer,
            steps: STEGVIS_MIDDLE_STEP_COUNT,
            score: 0,
            chain: generatedBundle.chain.map((step) => step.displayAnswer),
            missingClues: generatedBundle.chain.filter((step) => step.clueText === 'Nyckel saknas')
              .length,
          }
        : undefined,
  };
}
