'use client';

import { motion } from 'framer-motion';
import { CircleDot, Flag } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StegvisResultModal,
  type StegvisResultData,
} from '@/components/games/stegvis/stegvis-result-modal';
import { type WordTileRowCell, WordTileRow } from '@/components/games/word-tiles';
import { Card, CardContent } from '@/components/ui/card';
import { MonoLabel } from '@/components/ui/typography';
import type { StegvisChainStep, StegvisPuzzleBundle } from '@/lib/content/stegvis';
import type { StegvisPlaySession } from '@/lib/content/stegvis/load-play-session';
import {
  chainMeetsPlayRequirement,
  STEGVIS_MIDDLE_STEP_COUNT,
} from '@/lib/content/stegvis/play-chain';
import { validateStegvisChainStep } from '@/lib/game/stegvis-chain-validation';
import { normalizeStegvisWord, pickRandomPuzzle } from '@/lib/game/stegvis';
import {
  loadStegvisStats,
  saveStegvisStats,
  updateStegvisStatsAfterSolve,
} from '@/lib/storage/stegvis-stats';
import { cn } from '@/lib/utils';

const TIMELINE_WIDTH_CLASS = 'w-11 shrink-0 sm:w-12';

function buildTileCells(options: {
  length: number;
  word?: string;
  isPassive: boolean;
  isSolved: boolean;
  isActive: boolean;
}): WordTileRowCell[] {
  const { length, word, isPassive, isSolved, isActive } = options;
  const letters = word?.split('') ?? [];

  const filledCount = letters.filter((letter) => letter && letter !== '-').length;

  return Array.from({ length }, (_, index) => {
    const raw = letters[index];
    const letter = raw && raw !== '-' ? raw.toLocaleUpperCase('sv-SE') : undefined;

    if (!letter) {
      return {
        emptyActive: isActive && index === filledCount,
      };
    }

    return {
      letter,
      state: isPassive || !isSolved ? 'idle' : 'used',
    };
  });
}

function StepClueBlock({ text, active = false }: { text: string; active?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col justify-center gap-1 pr-1">
      <MonoLabel
        className={cn(
          'text-[10px] uppercase tracking-[0.14em]',
          active ? 'text-print-green' : 'text-print-muted',
        )}
      >
        Ledtråd
      </MonoLabel>
      <p className="text-base font-semibold leading-snug text-print-ink">{text}</p>
    </div>
  );
}

function TimelineMarker({
  label,
  active = false,
  variant,
}: {
  label: string;
  active?: boolean;
  variant: 'start' | 'middle' | 'goal';
}) {
  const endpointIconClass = cn(
    'size-5 sm:size-[22px]',
    active ? 'text-print-green' : 'text-print-muted',
  );

  return (
    <div
      className={cn(
        TIMELINE_WIDTH_CLASS,
        'flex shrink-0 items-center justify-center self-center pt-1',
      )}
      aria-label={variant === 'start' ? 'Start' : variant === 'goal' ? 'Mål' : `Steg ${label}`}
      title={variant === 'start' ? 'Start' : variant === 'goal' ? 'Mål' : undefined}
    >
      {variant === 'start' ? (
        <CircleDot className={endpointIconClass} strokeWidth={2} aria-hidden />
      ) : variant === 'goal' ? (
        <Flag className={endpointIconClass} strokeWidth={2} aria-hidden />
      ) : (
        <span
          className={cn(
            'print-mono block text-xl font-medium leading-none',
            active ? 'text-print-green' : 'text-print-ink',
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function TimelineArrow() {
  return (
    <div className="flex py-2 sm:py-2.5">
      <div
        className={cn(
          TIMELINE_WIDTH_CLASS,
          'print-mono flex justify-center text-lg leading-none text-print-ink',
        )}
        aria-hidden
      >
        ↓
      </div>
    </div>
  );
}

type ChainStepCardProps = {
  step: StegvisChainStep;
  variant: 'start' | 'middle' | 'goal';
  stepNumber?: number;
  solvedWord?: string;
  isActive?: boolean;
  justSolved?: boolean;
  shake?: boolean;
  draft?: string;
  onDraftChange?: (value: string) => void;
  onSubmit?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

function ChainStepCard({
  step,
  variant,
  stepNumber,
  solvedWord,
  isActive = false,
  justSolved = false,
  shake = false,
  draft,
  onDraftChange,
  onSubmit,
  inputRef,
}: ChainStepCardProps) {
  const isPassive = variant === 'start' || variant === 'goal';
  const isSolved = Boolean(solvedWord);
  const normalized = normalizeStegvisWord(draft ?? '').slice(0, step.answer.length);
  const displayWord = isPassive
    ? step.displayAnswer
    : isSolved
      ? solvedWord
      : isActive
        ? normalized + '-'.repeat(Math.max(0, step.answer.length - normalized.length))
        : undefined;

  return (
    <motion.div
      animate={
        shake
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
          : justSolved
            ? {
                backgroundColor: [
                  'rgba(34, 85, 68, 0.05)',
                  isPassive ? 'rgba(250, 248, 245, 0.95)' : 'rgba(255,255,255,1)',
                ],
              }
            : { x: 0 }
      }
      transition={{ duration: shake ? 0.45 : 0.2 }}
      onClick={() => {
        if (isActive) {
          inputRef?.current?.focus();
        }
      }}
      className={cn(
        'min-w-0 flex-1 rounded-lg px-4 py-4 sm:px-5 sm:py-4',
        isPassive && 'border border-print-ink/12 bg-print-bg/80',
        !isPassive && isActive && 'cursor-text border-2 border-print-green bg-white',
        !isPassive && !isActive && 'border border-print-ink/12 bg-white',
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="min-w-0 flex-1 self-stretch">
          <StepClueBlock text={step.clueText} active={isActive} />
        </div>

        <div className="relative shrink-0">
          <WordTileRow
            length={step.answer.length}
            cells={buildTileCells({
              length: step.answer.length,
              word: displayWord,
              isPassive,
              isSolved,
              isActive,
            })}
          />
          {isActive && inputRef && onDraftChange && onSubmit ? (
            <input
              ref={inputRef}
              type="text"
              value={draft ?? ''}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onSubmit();
                }
              }}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={step.answer.length}
              aria-label={`Steg ${stepNumber}: ${step.clueText}`}
              className="absolute inset-0 cursor-text opacity-0 outline-none [caret-color:transparent]"
            />
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function findPuzzleBundle(bundles: StegvisPuzzleBundle[], puzzleId: string): StegvisPuzzleBundle {
  return bundles.find((bundle) => bundle.puzzle.id === puzzleId) ?? bundles[0];
}

function getFirstMiddleIndex(chain: StegvisChainStep[]) {
  return chain.findIndex((step) => step.role === 'middle');
}

function getMiddleStepIndices(chain: StegvisChainStep[]) {
  return chain
    .map((step, index) => (step.role === 'middle' ? index : -1))
    .filter((index) => index >= 0);
}

function getPlayReadyBundles(bundles: StegvisPuzzleBundle[]) {
  return bundles.filter((bundle) => chainMeetsPlayRequirement(bundle.chain));
}

type StegvisGameProps = {
  session: StegvisPlaySession;
};

export function StegvisGame({ session }: StegvisGameProps) {
  const { initialBundle, fallbackBundles, allowedWords } = session;

  const playReadyInitial = chainMeetsPlayRequirement(initialBundle.chain)
    ? initialBundle
    : (getPlayReadyBundles([initialBundle, ...fallbackBundles])[0] ?? initialBundle);

  const [activeBundle, setActiveBundle] = useState(playReadyInitial);
  const playReadyBundles = useMemo(
    () => getPlayReadyBundles([initialBundle, ...fallbackBundles]),
    [initialBundle, fallbackBundles],
  );
  const puzzleBundles = useMemo(
    () => (playReadyBundles.length > 0 ? playReadyBundles : [activeBundle]),
    [activeBundle, playReadyBundles],
  );

  const allowedWordSet = useMemo(() => {
    return new Set((allowedWords ?? []).map((word) => normalizeStegvisWord(word)));
  }, [allowedWords]);

  const chain = activeBundle.chain;
  const startStep = chain[0];
  const targetStep = chain[chain.length - 1];
  const middleSteps = useMemo(
    () =>
      chain.map((step, index) => ({ step, index })).filter(({ step }) => step.role === 'middle'),
    [chain],
  );
  const middleIndices = useMemo(() => getMiddleStepIndices(chain), [chain]);

  const [activeStepIndex, setActiveStepIndex] = useState(() =>
    getFirstMiddleIndex(playReadyInitial.chain),
  );
  const [solvedByIndex, setSolvedByIndex] = useState<Record<number, string>>({});
  const [draft, setDraft] = useState('');
  const [feedback, setFeedback] = useState('');
  const [shakeStepIndex, setShakeStepIndex] = useState<number | null>(null);
  const [justSolvedIndex, setJustSolvedIndex] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [statsSaved, setStatsSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetForBundle = useCallback((bundle: StegvisPuzzleBundle) => {
    const ready = chainMeetsPlayRequirement(bundle.chain)
      ? bundle
      : (getPlayReadyBundles([bundle])[0] ?? bundle);

    setActiveBundle(ready);
    setActiveStepIndex(getFirstMiddleIndex(ready.chain));
    setSolvedByIndex({});
    setDraft('');
    setFeedback('');
    setShakeStepIndex(null);
    setJustSolvedIndex(null);
    setWon(false);
    setResultModalOpen(false);
    setStatsSaved(false);
  }, []);

  useEffect(() => {
    if (!won && activeStepIndex >= 0) {
      inputRef.current?.focus();
    }
  }, [activeStepIndex, won]);

  const persistSolve = useCallback(
    (steps: number) => {
      if (statsSaved) {
        return;
      }

      const nextStats = updateStegvisStatsAfterSolve(loadStegvisStats(), steps);
      saveStegvisStats(nextStats);
      setStatsSaved(true);
    },
    [statsSaved],
  );

  const submitActiveStep = useCallback(() => {
    if (won || activeStepIndex < 0) {
      return;
    }

    const step = chain[activeStepIndex];
    const previousIndex = activeStepIndex - 1;
    const previousWord = solvedByIndex[previousIndex] ?? chain[previousIndex]?.answer ?? '';

    const chainSoFar = chain
      .slice(0, activeStepIndex)
      .map((chainStep, index) => solvedByIndex[index] ?? chainStep.answer);

    const result = validateStegvisChainStep(
      draft,
      previousWord,
      step.answer,
      chainSoFar,
      allowedWordSet,
    );

    if (!result.valid) {
      setFeedback(result.message);
      setShakeStepIndex(activeStepIndex);
      window.setTimeout(() => setShakeStepIndex(null), 450);
      return;
    }

    setFeedback('');
    setDraft('');
    setSolvedByIndex((current) => ({
      ...current,
      [activeStepIndex]: result.normalizedWord,
    }));
    setJustSolvedIndex(activeStepIndex);
    window.setTimeout(() => setJustSolvedIndex(null), 220);

    const remainingMiddle = middleIndices.filter((index) => index > activeStepIndex);

    if (remainingMiddle.length === 0) {
      window.setTimeout(() => {
        setWon(true);
        setActiveStepIndex(-1);
        setResultModalOpen(true);
        persistSolve(STEGVIS_MIDDLE_STEP_COUNT);
      }, 180);
      return;
    }

    window.setTimeout(() => {
      setActiveStepIndex(remainingMiddle[0]);
    }, 180);
  }, [
    activeStepIndex,
    allowedWordSet,
    chain,
    draft,
    middleIndices,
    persistSolve,
    solvedByIndex,
    won,
  ]);

  const playAgain = () => {
    resetForBundle(activeBundle);
  };

  const newPuzzle = () => {
    const pool = puzzleBundles.length > 1 ? puzzleBundles : getPlayReadyBundles(fallbackBundles);

    const puzzle = pickRandomPuzzle(
      pool.map((bundle) => bundle.puzzle),
      activeBundle.puzzle.id,
    );
    resetForBundle(findPuzzleBundle(pool, puzzle.id));
  };

  const resultData = useMemo((): StegvisResultData | null => {
    if (!won || !startStep || !targetStep) {
      return null;
    }

    return {
      startWord: startStep.displayAnswer,
      targetWord: targetStep.displayAnswer,
    };
  }, [startStep, targetStep, won]);

  const solvedCount = middleIndices.filter((index) => solvedByIndex[index]).length;

  const chainNodes = useMemo(() => {
    if (!startStep || !targetStep) {
      return [];
    }

    return [
      {
        key: `start-${startStep.answer}`,
        variant: 'start' as const,
        step: startStep,
        index: 0,
        marker: 'Start',
      },
      ...middleSteps.map(({ step, index }, stepIndex) => ({
        key: `middle-${step.answer}-${index}`,
        variant: 'middle' as const,
        step,
        index,
        marker: String(stepIndex + 1),
        stepNumber: stepIndex + 1,
      })),
      {
        key: `goal-${targetStep.answer}`,
        variant: 'goal' as const,
        step: targetStep,
        index: chain.length - 1,
        marker: 'Mål',
      },
    ];
  }, [chain.length, middleSteps, startStep, targetStep]);

  if (!startStep || !targetStep || middleSteps.length !== STEGVIS_MIDDLE_STEP_COUNT) {
    return null;
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-5 pt-5">
          <div className="flex items-baseline justify-between gap-3 border-b border-print-ink/10 pb-3">
            <MonoLabel muted>Ordkedja</MonoLabel>
            <p className="print-mono text-xs text-print-muted">
              {won
                ? `${STEGVIS_MIDDLE_STEP_COUNT} steg`
                : `${solvedCount} av ${STEGVIS_MIDDLE_STEP_COUNT} lösta`}
            </p>
          </div>

          <div>
            {chainNodes.map((node, nodeIndex) => {
              const isMiddle = node.variant === 'middle';
              const isActive = isMiddle && !won && node.index === activeStepIndex;

              return (
                <div key={node.key}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <TimelineMarker label={node.marker} active={isActive} variant={node.variant} />
                    <ChainStepCard
                      step={node.step}
                      variant={node.variant}
                      stepNumber={'stepNumber' in node ? node.stepNumber : undefined}
                      solvedWord={isMiddle ? solvedByIndex[node.index] : undefined}
                      isActive={isActive}
                      justSolved={isMiddle && justSolvedIndex === node.index}
                      shake={isMiddle && shakeStepIndex === node.index}
                      draft={isActive ? draft : undefined}
                      onDraftChange={isActive ? setDraft : undefined}
                      onSubmit={isActive ? submitActiveStep : undefined}
                      inputRef={isActive ? inputRef : undefined}
                    />
                  </div>
                  {nodeIndex < chainNodes.length - 1 ? <TimelineArrow /> : null}
                </div>
              );
            })}
          </div>

          {feedback ? <p className="print-mono text-sm text-print-ink">{feedback}</p> : null}
        </CardContent>
      </Card>

      {resultData ? (
        <StegvisResultModal
          open={resultModalOpen}
          result={resultData}
          onPlayAgain={playAgain}
          onNewPuzzle={newPuzzle}
          onClose={() => setResultModalOpen(false)}
        />
      ) : null}
    </>
  );
}
