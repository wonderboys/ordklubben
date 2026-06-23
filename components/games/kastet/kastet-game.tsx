'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { GameToast } from '@/components/games/game-toast';
import { Button } from '@/components/ui/button';
import { KASTET_ACTIVE_DICE_COUNT } from '@/lib/game/kastet/config';
import type { KastetContent } from '@/lib/games/kastet/types';
import { pickRandomKastetPairsFromPool } from '@/lib/games/kastet/rules';
import {
  buildDiceSettleMotion,
  buildDiceShakeMotion,
  DICE_SHAKE_TIMES,
  getDiceShakeDurationMs,
  getDiceShakeProfile,
} from '@/lib/game/kastet/dice-motion';
import {
  createEmptyKastetRows,
  formatKastetClock,
  normalizeKastetWord,
  validateKastetWord,
} from '@/lib/game/kastet/pairs';
import {
  calculateKastetScore,
  countKastetTotalLetters,
  countKastetWordLetters,
} from '@/lib/game/kastet/score';
import { cn } from '@/lib/utils';

type GamePhase = 'idle' | 'rolling' | 'playing' | 'won';

type RowState = {
  value: string;
  status: 'idle' | 'approved' | 'error';
  feedback: string | null;
  flashKey: number;
};

type DiceFace = 'blank' | 'revealed';

type RollToastState = {
  message: string;
  id: number;
};

const ROLL_TOASTS = ['🎲 Skakar tärningarna...', '🎲🎲 Kastar...', '🎲🎲 Landar...'] as const;

const ROLL_TOAST_STEP_MS = 600;
const ROLL_TOTAL_MS = getDiceShakeDurationMs();
const LANDING_BOUNCE_MS = 380;

function createRowState(): RowState {
  return { value: '', status: 'idle', feedback: null, flashKey: 0 };
}

function BlankDiceFace() {
  return (
    <div className="grid size-full grid-cols-3 grid-rows-3 place-items-center p-3">
      <span className="size-2 rounded-full bg-print-ink/20" />
      <span className="size-2 rounded-full bg-print-ink/20" />
      <span className="size-2 rounded-full bg-print-ink/20" />
      <span className="size-2 rounded-full bg-print-ink/20" />
      <span className="size-2.5 rounded-full bg-print-ink/30" />
      <span className="size-2 rounded-full bg-print-ink/20" />
      <span className="size-2 rounded-full bg-print-ink/20" />
      <span className="size-2 rounded-full bg-print-ink/20" />
      <span className="size-2 rounded-full bg-print-ink/20" />
    </div>
  );
}

function DiceTile({
  dieIndex,
  face,
  label,
  isRolling,
  justLanded,
}: {
  dieIndex: number;
  face: DiceFace;
  label?: string;
  isRolling: boolean;
  justLanded: boolean;
}) {
  const profile = getDiceShakeProfile(dieIndex);
  const shakeMotion = buildDiceShakeMotion(profile);
  const settleMotion = buildDiceSettleMotion(profile);

  return (
    <motion.div
      initial={false}
      animate={
        isRolling
          ? shakeMotion
          : justLanded
            ? settleMotion
            : { y: 0, x: 0, rotate: 0, scaleX: 1, scaleY: 1 }
      }
      transition={
        isRolling
          ? {
              duration: ROLL_TOTAL_MS / 1000,
              times: [...DICE_SHAKE_TIMES],
              ease: 'easeInOut',
              delay: profile.delay,
            }
          : justLanded
            ? {
                duration: LANDING_BOUNCE_MS / 1000,
                ease: [0.22, 1, 0.36, 1],
                delay: profile.delay * 0.35,
              }
            : { duration: 0.2 }
      }
      className="relative aspect-square w-[4.85rem] rounded-[0.35rem] border-[3px] border-print-ink bg-[#f6f2ea] shadow-[5px_5px_0_0_rgba(17,17,17,1)] sm:w-[5.35rem]"
      style={{ transformOrigin: 'center bottom' }}
    >
      <div className="flex size-full items-center justify-center overflow-hidden">
        {face === 'blank' ? <BlankDiceFace /> : null}

        {face === 'revealed' && label ? (
          <motion.span
            key={label}
            initial={{ opacity: 0, scale: 0.65, y: -8, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 24,
              delay: 0.05 + profile.delay,
            }}
            className="font-mono text-[clamp(1.55rem,6.5vw,2rem)] font-black uppercase tracking-[0.1em] text-print-ink"
          >
            {label}
          </motion.span>
        ) : null}
      </div>
    </motion.div>
  );
}

function LiveClock({ seconds, frozen }: { seconds: number; frozen?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 font-mono text-2xl font-bold tabular-nums tracking-[0.06em] text-print-ink',
        frozen && 'text-print-green',
      )}
      aria-live="polite"
      aria-label={`Tid ${formatKastetClock(seconds)}`}
    >
      <span aria-hidden="true">⏱</span>
      <span>{formatKastetClock(seconds)}</span>
    </div>
  );
}

function WordRow({
  index,
  pair,
  row,
  disabled,
  setInputRef,
  onChange,
  onValidate,
}: {
  index: number;
  pair: string;
  row: RowState;
  disabled: boolean;
  setInputRef?: (element: HTMLInputElement | null) => void;
  onChange: (value: string) => void;
  onValidate: () => void;
}) {
  const inputId = `kastet-word-${index}`;

  return (
    <div className="relative space-y-1.5">
      <label htmlFor={inputId} className="block text-sm text-print-muted">
        Skriv det längsta ord du kan som börjar med {pair}
      </label>
      <div className="relative">
        <AnimatePresence>
          {row.flashKey > 0 ? (
            <motion.div
              key={row.flashKey}
              initial={{ opacity: 0.55 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="pointer-events-none absolute inset-0 z-10 bg-print-green/35"
            />
          ) : null}
        </AnimatePresence>

        <input
          ref={setInputRef}
          id={inputId}
          type="text"
          value={row.value}
          disabled={disabled || row.status === 'approved'}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder={`Ord som börjar med ${pair}`}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onValidate();
            }
          }}
          onBlur={onValidate}
          className={cn(
            'relative w-full border bg-print-surface px-3 py-2.5 text-base uppercase tracking-[0.04em] text-print-ink outline-none transition-colors placeholder:normal-case placeholder:tracking-normal focus:ring-2 focus:ring-inset disabled:opacity-60',
            row.status === 'approved' &&
              'border-print-green bg-print-green-soft pr-10 text-print-green',
            row.status === 'error' && 'border-[var(--color-error)]',
            row.status === 'idle' && 'border-print-ink focus:ring-print-ink/25',
          )}
        />

        {row.status === 'approved' ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-print-green"
          >
            <Check className="size-5" strokeWidth={3} aria-hidden="true" />
          </motion.span>
        ) : null}
      </div>

      {row.feedback && row.status === 'error' ? (
        <p className="text-xs text-[var(--color-error)]">{row.feedback}</p>
      ) : null}
    </div>
  );
}

function ResultCard({
  pairs,
  words,
  elapsedSeconds,
  onNewCast,
}: {
  pairs: string[];
  words: string[];
  elapsedSeconds: number;
  onNewCast: () => void;
}) {
  const totalLetters = countKastetTotalLetters(words);
  const score = calculateKastetScore(totalLetters, elapsedSeconds);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-4 border-[3px] border-print-ink bg-print-surface p-4 shadow-[4px_4px_0_0_rgba(17,17,17,1)]"
    >
      <div className="space-y-1 text-center">
        <p className="text-base font-semibold text-print-ink">🎉 Bra kast!</p>
        <p className="font-mono text-sm tabular-nums text-print-muted">
          Tid: {formatKastetClock(elapsedSeconds)}
        </p>
        <p className="font-mono text-sm font-bold tabular-nums text-print-ink">Poäng: {score}</p>
      </div>

      <ul className="space-y-2 font-mono text-sm uppercase tracking-[0.04em] text-print-ink sm:text-base">
        {pairs.map((pair, index) => {
          const word = words[index] ?? '—';
          const letters = word !== '—' ? countKastetWordLetters(word) : 0;

          return (
            <li
              key={`${pair}-${index}`}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
            >
              <span className="font-bold">
                {pair} → {word}
              </span>
              {word !== '—' ? (
                <span className="text-xs font-medium text-print-muted">= {letters}</span>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="border-t border-print-ink/10 pt-3 text-center font-mono text-sm font-bold text-print-ink">
        Totalt: {totalLetters} bokstäver
      </p>

      <Button type="button" variant="accent" size="lg" className="w-full" onClick={onNewCast}>
        Kasta igen
      </Button>
    </motion.div>
  );
}

export function KastetGame({ content }: { content: KastetContent }) {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [landedPairs, setLandedPairs] = useState<string[] | null>(null);
  const [justLanded, setJustLanded] = useState(false);
  const [rollToast, setRollToast] = useState<RollToastState | null>(null);
  const [rows, setRows] = useState<RowState[]>(() => createEmptyKastetRows(createRowState));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const landBounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const landedAtRef = useRef<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const clearToastTimeouts = useCallback(() => {
    for (const timeout of toastTimeoutsRef.current) {
      clearTimeout(timeout);
    }
    toastTimeoutsRef.current = [];
  }, []);

  const clearRollTimer = useCallback(() => {
    if (rollTimeoutRef.current) {
      clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }
  }, []);

  const clearLandBounceTimer = useCallback(() => {
    if (landBounceTimeoutRef.current) {
      clearTimeout(landBounceTimeoutRef.current);
      landBounceTimeoutRef.current = null;
    }
  }, []);

  const clearPlayTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const focusInput = useCallback((index: number) => {
    requestAnimationFrame(() => {
      inputRefs.current[index]?.focus();
    });
  }, []);

  const blurActiveInput = useCallback(() => {
    requestAnimationFrame(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      clearToastTimeouts();
      clearRollTimer();
      clearLandBounceTimer();
      clearPlayTimer();
    };
  }, [clearLandBounceTimer, clearPlayTimer, clearRollTimer, clearToastTimeouts]);

  useEffect(() => {
    if (phase !== 'playing') {
      return;
    }

    focusInput(0);
  }, [focusInput, phase]);

  const startPlayTimer = useCallback(() => {
    landedAtRef.current = Date.now();
    setElapsedSeconds(0);
    clearPlayTimer();

    timerIntervalRef.current = setInterval(() => {
      if (landedAtRef.current == null) {
        return;
      }

      setElapsedSeconds(Math.floor((Date.now() - landedAtRef.current) / 1000));
    }, 100);
  }, [clearPlayTimer]);

  const stopPlayTimer = useCallback(() => {
    if (landedAtRef.current != null) {
      setElapsedSeconds(Math.floor((Date.now() - landedAtRef.current) / 1000));
    }
    clearPlayTimer();
  }, [clearPlayTimer]);

  const scheduleRollToasts = useCallback(() => {
    clearToastTimeouts();

    ROLL_TOASTS.forEach((message, index) => {
      const timeout = setTimeout(() => {
        setRollToast({ message, id: Date.now() + index });
      }, index * ROLL_TOAST_STEP_MS);

      toastTimeoutsRef.current.push(timeout);
    });
  }, [clearToastTimeouts]);

  const finishRoll = useCallback(
    (finalPairs: string[]) => {
      setRollToast(null);
      setLandedPairs(finalPairs);
      setJustLanded(true);
      setPhase('playing');
      startPlayTimer();

      clearLandBounceTimer();
      landBounceTimeoutRef.current = setTimeout(() => {
        setJustLanded(false);
      }, LANDING_BOUNCE_MS);
    },
    [clearLandBounceTimer, startPlayTimer],
  );

  const startRoll = useCallback(() => {
    const finalPairs = pickRandomKastetPairsFromPool(content.pairPool, KASTET_ACTIVE_DICE_COUNT);

    setPhase('rolling');
    setLandedPairs(null);
    setJustLanded(false);
    setRows(createEmptyKastetRows(createRowState));
    setElapsedSeconds(0);
    landedAtRef.current = null;
    inputRefs.current = [];

    clearPlayTimer();
    clearRollTimer();
    clearLandBounceTimer();
    clearToastTimeouts();

    scheduleRollToasts();

    rollTimeoutRef.current = setTimeout(() => {
      finishRoll(finalPairs);
    }, ROLL_TOTAL_MS);
  }, [
    clearLandBounceTimer,
    content.pairPool,
    clearPlayTimer,
    clearRollTimer,
    clearToastTimeouts,
    finishRoll,
    scheduleRollToasts,
  ]);

  const handleInitialRoll = () => {
    if (phase !== 'idle') {
      return;
    }

    startRoll();
  };

  const handleNewCast = () => {
    if (phase !== 'won') {
      return;
    }

    startRoll();
  };

  const validateRow = (index: number) => {
    if (phase !== 'playing') {
      return;
    }

    const pair = landedPairs?.[index];
    if (!pair) {
      return;
    }

    const currentRow = rows[index];

    if (currentRow.status === 'approved') {
      return;
    }

    const result = validateKastetWord(currentRow.value, pair);
    const nextRows = [...rows];

    if (result.ok) {
      nextRows[index] = {
        ...currentRow,
        status: 'approved',
        feedback: null,
        flashKey: currentRow.flashKey + 1,
      };
    } else {
      nextRows[index] = {
        ...currentRow,
        status: 'error',
        feedback: result.message,
        flashKey: currentRow.flashKey,
      };
    }

    setRows(nextRows);

    if (!result.ok) {
      return;
    }

    const allApproved = nextRows.every((row) => row.status === 'approved');

    if (allApproved) {
      stopPlayTimer();
      blurActiveInput();
      setPhase('won');
      return;
    }

    const nextIndex = nextRows.findIndex((row) => row.status !== 'approved');
    if (nextIndex >= 0) {
      focusInput(nextIndex);
    }
  };

  const updateRow = (index: number, value: string) => {
    setRows((current) => {
      const next = [...current];
      next[index] = {
        value,
        status: 'idle',
        feedback: null,
        flashKey: current[index]?.flashKey ?? 0,
      };
      return next;
    });
  };

  const isRolling = phase === 'rolling';
  const showRevealedLetters = phase === 'playing' || phase === 'won';
  const showTimer = phase === 'playing' || phase === 'won';
  const showInputs = phase === 'playing';
  const showResult = phase === 'won' && landedPairs != null;

  const diceFace: DiceFace = showRevealedLetters ? 'revealed' : 'blank';

  const resultWords = rows.map((row) => normalizeKastetWord(row.value));

  return (
    <>
      <GameToast
        message={rollToast?.message ?? null}
        tone="info"
        toastId={rollToast?.id}
        placement="fixed-top-center"
      />

      <div className="mx-auto flex w-full max-w-[32rem] flex-col items-center gap-5">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-3.5">
          {Array.from({ length: KASTET_ACTIVE_DICE_COUNT }, (_, index) => (
            <DiceTile
              key={`die-${index}-${showRevealedLetters ? landedPairs?.[index] : 'blank'}`}
              dieIndex={index}
              face={diceFace}
              label={landedPairs?.[index]}
              isRolling={isRolling}
              justLanded={justLanded}
            />
          ))}
        </div>

        {showTimer ? <LiveClock seconds={elapsedSeconds} frozen={phase === 'won'} /> : null}

        {phase === 'idle' ? (
          <Button
            type="button"
            variant="accent"
            size="lg"
            className="w-full max-w-[28rem]"
            onClick={handleInitialRoll}
          >
            Skaka tärningarna
          </Button>
        ) : null}

        {showInputs && landedPairs ? (
          <div className="flex w-full max-w-[28rem] flex-col gap-4">
            {landedPairs.map((pair, index) => (
              <WordRow
                key={`${pair}-${index}`}
                index={index}
                pair={pair}
                row={rows[index] ?? createRowState()}
                disabled={false}
                setInputRef={(element) => {
                  inputRefs.current[index] = element;
                }}
                onChange={(value) => updateRow(index, value)}
                onValidate={() => validateRow(index)}
              />
            ))}
          </div>
        ) : null}

        {showResult ? (
          <ResultCard
            pairs={landedPairs}
            words={resultWords}
            elapsedSeconds={elapsedSeconds}
            onNewCast={handleNewCast}
          />
        ) : null}
      </div>
    </>
  );
}
