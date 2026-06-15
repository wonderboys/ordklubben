'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LetterTile } from '@/components/games/letter-tile';
import { DagensOrdKeyboard } from '@/components/games/dagens-ord/dagens-ord-keyboard';
import {
  DAGENS_ORD_BOARD_WIDTH_CLASS,
  DAGENS_ORD_PLAY_COLUMN_CLASS,
} from '@/components/games/dagens-ord/dagens-ord-layout';
import {
  DagensOrdResultModal,
  type DagensOrdResultData,
} from '@/components/games/dagens-ord/dagens-ord-result-modal';
import { Button } from '@/components/ui/button';
import {
  DAGENS_ORD_MAX_GUESSES,
  DAGENS_ORD_REVEAL_ANIMATION_MS,
  DAGENS_ORD_REVEAL_STEP_MS,
  DAGENS_ORD_WORD_LENGTH,
  evaluateGuess,
  getKeyboardLetterStates,
  isDagensOrdLost,
  isDagensOrdWon,
  isValidDagensOrdGuess,
  type DagensOrdGuess,
  type DagensOrdLetterFeedback,
  type DagensOrdRound,
} from '@/lib/game/dagens-ord';
import {
  loadOrCreateDailyRound,
  persistDailyRound,
  resolveDailyStatus,
} from '@/lib/game/dagens-ord-daily-session';
import { GAME_TOAST_MESSAGES, GameToast, useGameToast } from '@/components/games/game-toast';
import { normalizeSwedish } from '@/lib/dictionary/normalize-swedish';

const ROW_SHAKE_TRANSITION = { duration: 0.46, ease: 'easeInOut' as const };
const ROW_SHAKE_OFFSETS = [0, -6, 6, -5, 5, -3, 3, 0];

const SWEDISH_LETTER_PATTERN = /^[a-zåäö]$/;
const TILE_SHELL_CLASS = 'aspect-square w-full';
const TILE_CLASS =
  '!size-full !h-full !w-full max-w-none text-[1.12rem] leading-none md:text-[1.5rem]';
const ACTIVE_EMPTY_TILE_CLASS =
  'rounded-none border border-print-ink bg-print-surface shadow-[var(--print-shadow-soft)]';
const INACTIVE_EMPTY_TILE_CLASS =
  'rounded-none border border-print-ink/25 bg-print-surface shadow-[var(--print-shadow-soft)]';

type RevealingGuess = {
  word: string;
  feedback: DagensOrdLetterFeedback[];
  revealedCount: number;
};

function tileClassName(...classes: string[]) {
  return [TILE_CLASS, ...classes].join(' ');
}

function EmptyTile({ active = false }: { active?: boolean }) {
  return (
    <div className={TILE_SHELL_CLASS}>
      <div
        className={tileClassName(active ? ACTIVE_EMPTY_TILE_CLASS : INACTIVE_EMPTY_TILE_CLASS)}
      />
    </div>
  );
}

function GridCell({
  letter,
  state,
  reveal,
  active,
}: {
  letter?: string;
  state?: 'idle' | DagensOrdLetterFeedback;
  reveal?: boolean;
  active?: boolean;
}) {
  if (!letter) {
    return <EmptyTile active={active} />;
  }

  const tile = (
    <div className={TILE_SHELL_CLASS}>
      <LetterTile
        letter={letter}
        size="xs"
        state={state === 'idle' || !state ? 'idle' : state}
        disableEntryAnimation
        className={tileClassName('transition-colors duration-150')}
      />
    </div>
  );

  if (!reveal || state === 'idle' || !state) {
    return tile;
  }

  return (
    <motion.div
      initial={{ rotateX: -90, opacity: 0.4 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ duration: DAGENS_ORD_REVEAL_ANIMATION_MS / 1000, ease: 'easeOut' }}
      className={`${TILE_SHELL_CLASS} [perspective:600px]`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <LetterTile
        letter={letter}
        size="xs"
        state={state}
        disableEntryAnimation
        className={tileClassName('transition-colors duration-150')}
      />
    </motion.div>
  );
}

export function DagensOrdGame() {
  const [round, setRound] = useState<DagensOrdRound | null>(null);
  const [revealing, setRevealing] = useState<RevealingGuess | null>(null);
  const [rowShakeNonce, setRowShakeNonce] = useState(0);
  const [isRowShaking, setIsRowShaking] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const { toast, showToast, clearToast } = useGameToast();
  const wasFinishedRef = useRef(false);
  const shouldClearRowAfterShakeRef = useRef(false);

  useEffect(() => {
    const loadedRound = loadOrCreateDailyRound();
    const status = resolveDailyStatus(loadedRound.guesses, loadedRound.targetWord);

    if (status === 'won' || status === 'lost') {
      wasFinishedRef.current = true;
    }

    // Hydrate saved daily progress after mount; localStorage is unavailable on server.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only daily restore
    setRound(loadedRound);
  }, []);

  const won = round ? isDagensOrdWon(round.guesses, round.targetWord) : false;
  const lost = round ? isDagensOrdLost(round.guesses, round.targetWord) : false;
  const finished = won || lost;
  const isRevealing = revealing !== null;
  const canEdit = Boolean(round) && !finished && !isRevealing && !isRowShaking;

  const activeCellIndex =
    round && canEdit && round.currentInput.length < DAGENS_ORD_WORD_LENGTH
      ? round.currentInput.length
      : -1;

  const letterStates = useMemo(
    () => (round ? getKeyboardLetterStates(round.guesses) : new Map()),
    [round],
  );

  const resultData = useMemo<DagensOrdResultData | null>(() => {
    if (!round || !finished) {
      return null;
    }

    return {
      outcome: won ? 'won' : 'lost',
      targetWord: round.targetWord,
      attemptCount: won ? round.guesses.length : undefined,
    };
  }, [finished, round, won]);

  useEffect(() => {
    if (!finished || wasFinishedRef.current) {
      return;
    }

    setResultModalOpen(true);
    wasFinishedRef.current = true;
  }, [finished]);

  const clearCurrentRow = useCallback(() => {
    setRound((current) =>
      current
        ? {
            ...current,
            currentInput: '',
          }
        : current,
    );
  }, []);

  const handleRowShakeComplete = useCallback(() => {
    if (!shouldClearRowAfterShakeRef.current) {
      return;
    }

    shouldClearRowAfterShakeRef.current = false;
    setIsRowShaking(false);
    clearCurrentRow();
  }, [clearCurrentRow]);

  const submitGuess = useCallback(() => {
    if (!round || !canEdit) {
      return;
    }

    const guess = normalizeSwedish(round.currentInput);

    if (guess.length !== DAGENS_ORD_WORD_LENGTH) {
      return;
    }

    if (!isValidDagensOrdGuess(guess)) {
      showToast(GAME_TOAST_MESSAGES.invalidWord, 'error');
      shouldClearRowAfterShakeRef.current = true;
      setIsRowShaking(true);
      setRowShakeNonce((current) => current + 1);
      return;
    }

    const feedback = evaluateGuess(guess, round.targetWord);

    setRound((current) =>
      current
        ? {
            ...current,
            currentInput: '',
          }
        : current,
    );
    setRevealing({
      word: guess,
      feedback,
      revealedCount: 0,
    });
    clearToast();
  }, [canEdit, clearToast, round, showToast]);

  const addLetter = useCallback(
    (letter: string) => {
      if (!canEdit) {
        return;
      }

      setRound((current) => {
        if (!current || current.currentInput.length >= DAGENS_ORD_WORD_LENGTH) {
          return current;
        }

        return {
          ...current,
          currentInput: `${current.currentInput}${normalizeSwedish(letter)}`,
        };
      });
      clearToast();
    },
    [canEdit, clearToast],
  );

  const removeLetter = useCallback(() => {
    if (!canEdit) {
      return;
    }

    setRound((current) =>
      current
        ? {
            ...current,
            currentInput: current.currentInput.slice(0, -1),
          }
        : current,
    );
    clearToast();
  }, [canEdit, clearToast]);

  useEffect(() => {
    if (!revealing) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (revealing.revealedCount >= DAGENS_ORD_WORD_LENGTH) {
        const completedGuess: DagensOrdGuess = {
          word: revealing.word,
          feedback: revealing.feedback,
        };

        setRound((current) => {
          if (!current) {
            return current;
          }

          const nextRound = {
            ...current,
            guesses: [...current.guesses, completedGuess],
          };
          const status = resolveDailyStatus(nextRound.guesses, nextRound.targetWord);
          persistDailyRound(nextRound, status);
          return nextRound;
        });
        setRevealing(null);
        return;
      }

      setRevealing({
        ...revealing,
        revealedCount: revealing.revealedCount + 1,
      });
    }, DAGENS_ORD_REVEAL_STEP_MS);

    return () => window.clearTimeout(timeout);
  }, [revealing]);

  useEffect(() => {
    if (!canEdit) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitGuess();
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        removeLetter();
        return;
      }

      const key = normalizeSwedish(event.key);

      if (SWEDISH_LETTER_PATTERN.test(key)) {
        event.preventDefault();
        addLetter(key);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [addLetter, canEdit, removeLetter, submitGuess]);

  if (!round) {
    return (
      <div className={`mx-auto py-4 md:py-8 ${DAGENS_ORD_BOARD_WIDTH_CLASS}`}>
        <p className="print-mono text-center text-sm text-print-muted">Laddar dagens ord…</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`mx-auto flex w-full flex-col gap-1.5 max-md:min-h-0 max-md:flex-1 md:gap-0 ${DAGENS_ORD_PLAY_COLUMN_CLASS}`}
      >
        <div className={`relative space-y-1 md:space-y-1.5 ${DAGENS_ORD_BOARD_WIDTH_CLASS}`}>
          <GameToast message={toast?.message ?? null} tone={toast?.tone} toastId={toast?.id} />

          {Array.from({ length: DAGENS_ORD_MAX_GUESSES }, (_, rowIndex) => {
            const guess = round.guesses[rowIndex];
            const isRevealingRow = revealing !== null && rowIndex === round.guesses.length;
            const isCurrentRow = !isRevealingRow && rowIndex === round.guesses.length;

            const rowClassName = 'grid grid-cols-5 gap-1.5';

            if (isCurrentRow) {
              return (
                <motion.div
                  key={`current-row-${rowShakeNonce}`}
                  className={rowClassName}
                  animate={isRowShaking ? { x: ROW_SHAKE_OFFSETS } : { x: 0 }}
                  transition={ROW_SHAKE_TRANSITION}
                  onAnimationComplete={handleRowShakeComplete}
                >
                  {Array.from({ length: DAGENS_ORD_WORD_LENGTH }, (_, columnIndex) => {
                    const letter = round.currentInput[columnIndex];

                    return (
                      <GridCell
                        key={columnIndex}
                        letter={letter?.toLocaleUpperCase('sv-SE')}
                        state="idle"
                        active={!letter && columnIndex === activeCellIndex}
                      />
                    );
                  })}
                </motion.div>
              );
            }

            return (
              <div key={rowIndex} className={rowClassName}>
                {Array.from({ length: DAGENS_ORD_WORD_LENGTH }, (_, columnIndex) => {
                  if (guess) {
                    return (
                      <GridCell
                        key={columnIndex}
                        letter={guess.word[columnIndex]?.toLocaleUpperCase('sv-SE')}
                        state={guess.feedback[columnIndex]}
                      />
                    );
                  }

                  if (isRevealingRow && revealing) {
                    const letter = revealing.word[columnIndex]?.toLocaleUpperCase('sv-SE');
                    const isRevealed = columnIndex < revealing.revealedCount;

                    return (
                      <GridCell
                        key={columnIndex}
                        letter={letter}
                        state={isRevealed ? revealing.feedback[columnIndex] : 'idle'}
                        reveal={isRevealed}
                      />
                    );
                  }

                  return <GridCell key={columnIndex} />;
                })}
              </div>
            );
          })}
        </div>

        <DagensOrdKeyboard
          className="max-md:mt-3.5 max-md:shrink-0 md:mt-8"
          letterStates={letterStates}
          canSubmit={round.currentInput.length === DAGENS_ORD_WORD_LENGTH}
          canEdit={canEdit}
          onLetter={addLetter}
          onBackspace={removeLetter}
          onSubmit={submitGuess}
        />

        {finished && !resultModalOpen ? (
          <div className="flex shrink-0 justify-center max-md:pt-1 md:mt-6">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-print-bg md:w-auto md:text-sm"
              onClick={() => setResultModalOpen(true)}
            >
              Visa resultat
            </Button>
          </div>
        ) : null}
      </div>

      {resultData ? (
        <DagensOrdResultModal
          open={resultModalOpen}
          result={resultData}
          onClose={() => setResultModalOpen(false)}
        />
      ) : null}
    </>
  );
}
