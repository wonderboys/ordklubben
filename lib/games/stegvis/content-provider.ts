import {
  compareStockholmDayKeys,
  formatStockholmDayKey,
  matchesStockholmDayKey,
} from '@/lib/content/game-editions/daily-schedule';
import type { StegvisPlaySession } from '@/lib/content/stegvis/load-play-session';
import { formatStegvisEndpointClue, pickPrimaryClue } from '@/lib/content/stegvis/clue-display';
import { STEGVIS_MIDDLE_STEP_COUNT } from '@/lib/content/stegvis/play-chain';
import type {
  StegvisChainStep,
  StegvisPuzzleBundle,
  StegvisWordEndpoint,
} from '@/lib/content/stegvis/types';
import { ACTIVE_CLUE_STATUS } from '@/lib/content/word-bank/types';
import { getPrisma, isDatabaseConfigured } from '@/lib/db/prisma';
import { normalizeStegvisWord } from '@/lib/games/stegvis/rules';
import type { StegvisPuzzle } from '@/lib/games/stegvis/types';
import { listActiveWords } from '@/lib/server/words/provider';

const STEGVIS_GAME_SLUG = 'stegvis';
const STEGVIS_FALLBACK_EDITION_LIMIT = 6;

type StegvisEditionWordRow = {
  position: number | null;
  role: 'START' | 'STEP' | 'TARGET';
  word: {
    id: string;
    answer: string;
    normalizedAnswer: string;
    length: number;
    hints: Array<{
      id: string;
      wordId: string;
      text: string;
      type:
        | 'DEFINITION'
        | 'PARAPHRASE'
        | 'ASSOCIATION'
        | 'SYNONYM'
        | 'WORDPLAY'
        | 'EXAMPLE'
        | 'THEME'
        | 'OTHER';
      status: typeof ACTIVE_CLUE_STATUS;
      difficulty: number | null;
      tone: string | null;
      source: string | null;
    }>;
  };
};

function toDisplayAnswer(answer: string) {
  return normalizeStegvisWord(answer).toLocaleUpperCase('sv-SE');
}

function toEndpoint(word: StegvisEditionWordRow['word']): StegvisWordEndpoint {
  const displayAnswer = toDisplayAnswer(word.answer);

  return {
    wordId: word.id,
    answer: displayAnswer,
    clueText: formatStegvisEndpointClue({
      answer: displayAnswer,
      wordId: word.id,
      clues: word.hints,
    }),
  };
}

function toMiddleStep(word: StegvisEditionWordRow['word']): StegvisChainStep {
  const normalized = normalizeStegvisWord(word.normalizedAnswer);
  const primary = pickPrimaryClue(word.hints);

  return {
    answer: normalized,
    displayAnswer: normalized.toLocaleUpperCase('sv-SE'),
    clueText: primary?.text?.trim() ? primary.text.trim() : 'Nyckel saknas',
    wordId: word.id,
    role: 'middle',
  };
}

function createBundleFromEdition(options: {
  editionId: string;
  title: string;
  orderedWords: StegvisEditionWordRow[];
}): StegvisPuzzleBundle | null {
  const { editionId, title, orderedWords } = options;

  const startRow = orderedWords.find((entry) => entry.role === 'START');
  const targetRow = orderedWords.find((entry) => entry.role === 'TARGET');
  const stepRows = orderedWords.filter((entry) => entry.role === 'STEP');

  if (!startRow || !targetRow || stepRows.length !== STEGVIS_MIDDLE_STEP_COUNT) {
    return null;
  }

  const allWords = [startRow.word, ...stepRows.map((entry) => entry.word), targetRow.word];

  if (allWords.some((word) => word.length !== 4)) {
    return null;
  }

  const start = toEndpoint(startRow.word);
  const target = toEndpoint(targetRow.word);
  const middleSteps = stepRows.map((entry) => toMiddleStep(entry.word));
  const chain: StegvisChainStep[] = [
    {
      answer: normalizeStegvisWord(startRow.word.normalizedAnswer),
      displayAnswer: toDisplayAnswer(startRow.word.answer),
      clueText: start.clueText,
      wordId: startRow.word.id,
      role: 'start',
    },
    ...middleSteps,
    {
      answer: normalizeStegvisWord(targetRow.word.normalizedAnswer),
      displayAnswer: toDisplayAnswer(targetRow.word.answer),
      clueText: target.clueText,
      wordId: targetRow.word.id,
      role: 'target',
    },
  ];

  const puzzle: StegvisPuzzle = {
    id: editionId,
    start: normalizeStegvisWord(startRow.word.normalizedAnswer),
    target: normalizeStegvisWord(targetRow.word.normalizedAnswer),
    title,
    minimumSteps: STEGVIS_MIDDLE_STEP_COUNT,
    sampleSolution: chain.map((step) => step.answer),
    startWordId: startRow.word.id,
    targetWordId: targetRow.word.id,
  };

  return {
    puzzle,
    start,
    target,
    chain,
  };
}

async function loadPublishedStegvisEditions(date: Date) {
  if (!isDatabaseConfigured()) {
    return {
      todayEdition: null,
      pastEditions: [] as Awaited<ReturnType<typeof loadAllPublishedStegvisEditions>>,
    };
  }

  const dayKey = formatStockholmDayKey(date);
  const editions = await loadAllPublishedStegvisEditions();
  const todayEdition =
    editions.find((edition) => matchesStockholmDayKey(edition.publishAt, dayKey)) ?? null;
  const pastEditions = editions
    .filter((edition) => {
      if (!edition.publishAt) {
        return false;
      }

      return compareStockholmDayKeys(formatStockholmDayKey(edition.publishAt), dayKey) < 0;
    })
    .sort((left, right) =>
      compareStockholmDayKeys(
        formatStockholmDayKey(right.publishAt!),
        formatStockholmDayKey(left.publishAt!),
      ),
    )
    .slice(0, STEGVIS_FALLBACK_EDITION_LIMIT);

  return { todayEdition, pastEditions };
}

async function loadAllPublishedStegvisEditions() {
  const prisma = getPrisma();

  return prisma.gameEdition.findMany({
    where: {
      status: 'PUBLISHED',
      editionType: 'DAILY',
      game: {
        slug: STEGVIS_GAME_SLUG,
      },
    },
    orderBy: [{ publishAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      words: {
        include: {
          word: {
            select: {
              id: true,
              answer: true,
              normalizedAnswer: true,
              length: true,
              hints: {
                where: {
                  status: ACTIVE_CLUE_STATUS,
                },
                orderBy: [{ difficulty: 'asc' }, { type: 'asc' }, { text: 'asc' }],
                select: {
                  id: true,
                  wordId: true,
                  text: true,
                  type: true,
                  status: true,
                  difficulty: true,
                  tone: true,
                  source: true,
                },
              },
            },
          },
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });
}

export async function loadStegvisPlaySessionFromDb(
  date = new Date(),
): Promise<StegvisPlaySession | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const [words, { todayEdition, pastEditions }] = await Promise.all([
    listActiveWords({
      minLength: 4,
      maxLength: 4,
    }),
    loadPublishedStegvisEditions(date),
  ]);

  const editions = todayEdition ? [todayEdition, ...pastEditions] : pastEditions;
  const bundles = editions
    .map((edition) => {
      const orderedWords = edition.words as StegvisEditionWordRow[];
      return createBundleFromEdition({
        editionId: edition.id,
        title:
          edition.title?.trim() || `Stegvis ${formatStockholmDayKey(edition.publishAt ?? date)}`,
        orderedWords,
      });
    })
    .filter((bundle): bundle is StegvisPuzzleBundle => Boolean(bundle));

  const initialEdition = todayEdition;

  if (!initialEdition) {
    return null;
  }

  const initialBundle = bundles.find((bundle) => bundle.puzzle.id === initialEdition.id);

  if (!initialBundle) {
    return null;
  }

  return {
    initialBundle,
    fallbackBundles: bundles.filter((bundle) => bundle.puzzle.id !== initialBundle.puzzle.id),
    source: 'edition',
    allowedWords: words.map((word) => normalizeStegvisWord(word.normalizedAnswer)),
  };
}
