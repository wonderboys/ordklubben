'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { GameToast, useGameToast } from '@/components/games/game-toast';
import { ScratchTile } from '@/components/games/skrapet/scratch-tile';
import { Button } from '@/components/ui/button';
import {
  calculateSkrapetScore,
  formatSkrapetClock,
  normalizeSkrapetGuess,
  pickRandomSkrapetPuzzle,
} from '@/lib/games/skrapet/rules';
import type { SkrapetPuzzle } from '@/lib/games/skrapet/types';

// TODO: Dagens Skrap — same word for all players each day.
// TODO: Difficulty tiers — Easy 8 clues, Normal 6, Hard 4.
// TODO: Scratch bonus tiles (✨ BONUS) for extra points.
// TODO: False clues variant — not all hints are helpful.

type GamePhase = 'playing' | 'won';

function ResultCard({
  word,
  revealedCount,
  totalClues,
  elapsedSeconds,
  score,
  onPlayAgain,
}: {
  word: string;
  revealedCount: number;
  totalClues: number;
  elapsedSeconds: number;
  score: number;
  onPlayAgain: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-4 border-[3px] border-print-ink bg-print-surface p-4 shadow-[4px_4px_0_0_rgba(17,17,17,1)]"
    >
      <div className="space-y-1 text-center">
        <p className="text-base font-semibold text-print-ink">Bra skrapat!</p>
        <p className="font-mono text-sm font-bold uppercase tracking-[0.06em] text-print-ink">
          Ord: {word}
        </p>
        <p className="text-sm text-print-muted">
          Ledtrådar använda: {revealedCount} av {totalClues}
        </p>
        <p className="font-mono text-sm tabular-nums text-print-muted">
          Tid: {formatSkrapetClock(elapsedSeconds)}
        </p>
        <p className="font-mono text-sm font-bold tabular-nums text-print-green">Poäng: {score}</p>
      </div>

      <Button type="button" variant="accent" size="lg" className="w-full" onClick={onPlayAgain}>
        Skrapa igen
      </Button>
    </motion.div>
  );
}

function createInitialRevealed(clueCount: number): boolean[] {
  return Array.from({ length: clueCount }, () => false);
}

function pickRandomUnrevealedIndex(revealed: boolean[]) {
  const unrevealed = revealed
    .map((isRevealed, index) => (isRevealed ? -1 : index))
    .filter((index) => index >= 0);

  if (unrevealed.length === 0) {
    return null;
  }

  return unrevealed[Math.floor(Math.random() * unrevealed.length)] ?? null;
}

export function SkrapetGame({ puzzles }: { puzzles: SkrapetPuzzle[] }) {
  const { toast, showToast } = useGameToast(1400);
  const [puzzle, setPuzzle] = useState<SkrapetPuzzle>(() => pickRandomSkrapetPuzzle(puzzles)!);
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    createInitialRevealed(puzzle.clues.length),
  );
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [guess, setGuess] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const revealedCount = useMemo(() => revealed.filter(Boolean).length, [revealed]);

  const allRevealed = revealedCount === puzzle.clues.length;
  const score = calculateSkrapetScore(revealedCount, elapsedSeconds);

  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (startedAtRef.current != null) {
      return;
    }

    startedAtRef.current = Date.now();
    setTimerActive(true);
    clearTimer();

    timerIntervalRef.current = setInterval(() => {
      if (startedAtRef.current == null) {
        return;
      }

      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 100);
  }, [clearTimer]);

  const stopTimer = useCallback(() => {
    if (startedAtRef.current != null) {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }
    clearTimer();
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const resetRound = useCallback(
    (nextPuzzle?: SkrapetPuzzle) => {
      const picked = nextPuzzle ?? pickRandomSkrapetPuzzle(puzzles);
      const pickedPuzzle = picked ?? puzzle;
      setPuzzle(pickedPuzzle);
      setRevealed(createInitialRevealed(pickedPuzzle.clues.length));
      setPhase('playing');
      setGuess('');
      setElapsedSeconds(0);
      setTimerActive(false);
      startedAtRef.current = null;
      clearTimer();
    },
    [clearTimer, puzzle, puzzles],
  );

  const revealTile = useCallback(
    (index: number) => {
      if (phase !== 'playing' || revealed[index]) {
        return;
      }

      startTimer();

      setRevealed((current) => {
        const next = [...current];
        next[index] = true;
        return next;
      });
    },
    [phase, revealed, startTimer],
  );

  const handleScratchMore = () => {
    if (phase !== 'playing' || allRevealed) {
      return;
    }

    const index = pickRandomUnrevealedIndex(revealed);

    if (index == null) {
      return;
    }

    revealTile(index);
  };

  const handleGuess = () => {
    if (phase !== 'playing') {
      return;
    }

    const normalized = normalizeSkrapetGuess(guess);

    if (normalized.length === 0) {
      return;
    }

    if (normalized === normalizeSkrapetGuess(puzzle.word)) {
      stopTimer();
      setPhase('won');
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      return;
    }

    showToast('Inte rätt — skrapa mer eller försök igen', 'error');
  };

  const gridColumns = puzzle.clues.length <= 4 ? 2 : 3;

  return (
    <div className="relative mx-auto flex w-full max-w-[28rem] flex-col gap-5">
      <GameToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        toastId={toast?.id}
        placement="fixed-top-center"
      />

      {phase === 'playing' ? (
        <>
          <div
            className="grid gap-2 sm:gap-2.5"
            style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
          >
            {puzzle.clues.map((clue, index) => (
              <ScratchTile
                key={`${puzzle.word}-${index}`}
                clue={clue}
                revealed={revealed[index] ?? false}
                index={index}
                onRevealed={revealTile}
                disabled={phase !== 'playing'}
              />
            ))}
          </div>

          {timerActive ? (
            <p className="text-center font-mono text-sm tabular-nums tracking-[0.06em] text-print-muted">
              ⏱ {formatSkrapetClock(elapsedSeconds)}
            </p>
          ) : null}

          <div className="space-y-3">
            <label htmlFor="skrapet-guess" className="block text-sm text-print-muted">
              Vad är ordet?
            </label>
            <input
              id="skrapet-guess"
              type="text"
              value={guess}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="Skriv ditt svar"
              onChange={(event) => setGuess(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleGuess();
                }
              }}
              className="w-full border border-print-ink bg-print-surface px-3 py-2.5 text-base uppercase tracking-[0.04em] text-print-ink outline-none placeholder:normal-case placeholder:tracking-normal focus:ring-2 focus:ring-inset focus:ring-print-ink/25"
            />

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="accent" size="lg" onClick={handleGuess}>
                Gissa
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={allRevealed}
                onClick={handleScratchMore}
              >
                Skrapa mer
              </Button>
            </div>

            {revealedCount > 0 ? (
              <p className="text-center text-xs text-print-muted">
                {revealedCount} av {puzzle.clues.length} ledtrådar avslöjade
              </p>
            ) : (
              <p className="text-center text-xs text-print-muted">
                Dra fingret över rutorna för att skrapa — varje ledtråd kostar poäng.
              </p>
            )}
          </div>
        </>
      ) : null}

      {phase === 'won' ? (
        <ResultCard
          word={puzzle.word}
          revealedCount={revealedCount}
          totalClues={puzzle.clues.length}
          elapsedSeconds={elapsedSeconds}
          score={score}
          onPlayAgain={() => resetRound()}
        />
      ) : null}
    </div>
  );
}
