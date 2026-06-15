'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GameToast, useGameToast } from '@/components/games/game-toast';
import { Button } from '@/components/ui/button';
import { normalizeNormalizedAnswerInput } from '@/lib/content/normalize-answer';
import type { BildjaktPuzzle } from '@/lib/game/bildjakten/types';
import { cn } from '@/lib/utils';

type GuessState = 'idle' | 'wrong' | 'won';

type BildjaktenGameProps = {
  puzzles: BildjaktPuzzle[];
};

function PuzzleImage({ puzzle, won }: { puzzle: BildjaktPuzzle; won: boolean }) {
  return (
    <div
      className={cn(
        'relative mx-auto aspect-square w-full max-w-[18rem] overflow-hidden border-[3px] border-print-ink bg-[#f6f2ea] shadow-[5px_5px_0_0_rgba(17,17,17,1)] sm:max-w-[20rem]',
        won && 'border-print-green shadow-[5px_5px_0_0_rgba(2,134,102,0.55)]',
      )}
    >
      <Image
        src={puzzle.image.src}
        alt={puzzle.image.alt}
        fill
        priority
        className="object-cover"
        sizes="(max-width: 640px) 80vw, 20rem"
      />
    </div>
  );
}

export function BildjaktenGame({ puzzles }: BildjaktenGameProps) {
  const { toast, showToast } = useGameToast(1400);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [guessState, setGuessState] = useState<GuessState>('idle');

  const puzzle = puzzles[index];
  const isLastPuzzle = index >= puzzles.length - 1;
  const isWon = guessState === 'won';

  const normalizedGuess = useMemo(() => normalizeNormalizedAnswerInput(guess), [guess]);

  if (!puzzle) {
    return <p className="text-center text-sm text-print-muted">Inga bilder att gissa på ännu.</p>;
  }

  const advancePuzzle = () => {
    setIndex((current) => current + 1);
    setGuess('');
    setGuessState('idle');
  };

  const handleSubmit = () => {
    if (isWon || normalizedGuess.length === 0) {
      return;
    }

    if (normalizedGuess === puzzle.normalizedAnswer) {
      setGuessState('won');
      showToast('Rätt!', 'win');
      return;
    }

    setGuessState('wrong');
    showToast('Inte rätt — försök igen', 'error');
  };

  return (
    <div className="mx-auto flex w-full max-w-[28rem] flex-col items-center gap-5">
      <GameToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        toastId={toast?.id}
        placement="fixed-top-center"
      />

      <div className="w-full space-y-1 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-print-muted">
          Bild {index + 1} av {puzzles.length}
        </p>
      </div>

      <PuzzleImage puzzle={puzzle} won={isWon} />

      <form
        className="flex w-full flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <label htmlFor="bildjakten-guess" className="block text-sm text-print-muted">
          Vad visar bilden?
        </label>
        <input
          id="bildjakten-guess"
          type="text"
          value={guess}
          disabled={isWon}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Skriv ordet"
          onChange={(event) => {
            setGuess(event.target.value);
            if (guessState === 'wrong') {
              setGuessState('idle');
            }
          }}
          className={cn(
            'w-full border bg-print-surface px-3 py-2.5 text-base uppercase tracking-[0.04em] text-print-ink outline-none placeholder:normal-case placeholder:tracking-normal focus:ring-2 focus:ring-inset disabled:opacity-60',
            isWon && 'border-print-green bg-print-green-soft text-print-green',
            guessState === 'wrong' && 'border-[var(--color-error)]',
            guessState === 'idle' && 'border-print-ink focus:ring-print-ink/25',
          )}
        />

        {!isWon ? (
          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full"
            disabled={normalizedGuess.length === 0}
          >
            Gissa
          </Button>
        ) : null}
      </form>

      {isWon ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-3 text-center"
        >
          <p className="font-mono text-sm font-bold uppercase tracking-[0.06em] text-print-green">
            Rätt! — {puzzle.answer}
          </p>

          {!isLastPuzzle ? (
            <Button
              type="button"
              variant="accent"
              size="lg"
              className="w-full"
              onClick={advancePuzzle}
            >
              Nästa bild
            </Button>
          ) : (
            <p className="text-sm text-print-muted">Du har gissat alla bilder i testet.</p>
          )}
        </motion.div>
      ) : null}
    </div>
  );
}
