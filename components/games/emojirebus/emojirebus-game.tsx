"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GameToast, useGameToast } from "@/components/games/game-toast";
import { Button } from "@/components/ui/button";
import { normalizeNormalizedAnswerInput } from "@/lib/content/normalize-answer";
import type { EmojirebusPuzzle } from "@/lib/content/emojirebus";
import { cn } from "@/lib/utils";

type EmojirebusGameProps = {
  puzzle: EmojirebusPuzzle;
};

type GuessState = "idle" | "wrong" | "won";

export function EmojirebusGame({ puzzle }: EmojirebusGameProps) {
  const { toast, showToast } = useGameToast(1600);
  const [guess, setGuess] = useState("");
  const [guessState, setGuessState] = useState<GuessState>("idle");

  const normalizedGuess = useMemo(
    () => normalizeNormalizedAnswerInput(guess),
    [guess],
  );

  const isWon = guessState === "won";

  const handleSubmit = () => {
    if (isWon || normalizedGuess.length === 0) {
      return;
    }

    if (normalizedGuess === puzzle.normalizedAnswer) {
      setGuessState("won");
      showToast("Rätt!", "win");
      return;
    }

    setGuessState("wrong");
    showToast("Inte rätt — försök igen", "error");
  };

  return (
    <div className="relative mx-auto flex w-full max-w-[28rem] flex-col items-center gap-6">
      <GameToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        toastId={toast?.id}
      />

      <p
        className="text-center text-[clamp(2.75rem,12vw,4.5rem)] leading-none tracking-[0.08em]"
        aria-label="Emojirebus"
      >
        {puzzle.emojiHint}
      </p>

      <div className="flex w-full flex-wrap justify-center gap-1.5 sm:gap-2">
        {Array.from({ length: puzzle.answerLength }, (_, index) => {
          const letter = normalizedGuess[index] ?? "";

          return (
            <div
              key={index}
              className={cn(
                "flex aspect-square w-[2.65rem] items-center justify-center border border-print-ink bg-print-surface text-xl font-bold uppercase leading-none tracking-[0.02em] sm:w-[2.85rem] sm:text-2xl",
                isWon && "border-print-green bg-print-green-soft text-print-green",
                guessState === "wrong" && "border-[var(--color-error)]",
              )}
              aria-hidden
            >
              {letter}
            </div>
          );
        })}
      </div>

      <form
        className="flex w-full flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <label className="sr-only" htmlFor="emojirebus-guess">
          Skriv svaret
        </label>
        <input
          id="emojirebus-guess"
          type="text"
          value={guess}
          disabled={isWon}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Skriv svaret"
          onChange={(event) => {
            setGuess(event.target.value);
            if (guessState === "wrong") {
              setGuessState("idle");
            }
          }}
          className="w-full border border-print-ink bg-print-surface px-3 py-2.5 text-base uppercase tracking-[0.04em] text-print-ink outline-none placeholder:normal-case placeholder:tracking-normal focus:ring-2 focus:ring-inset focus:ring-print-ink/25 disabled:opacity-60"
        />

        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="w-full"
          disabled={isWon || normalizedGuess.length === 0}
        >
          Gissa
        </Button>
      </form>

      {isWon ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-sm font-bold uppercase tracking-[0.06em] text-print-green"
        >
          Bra jobbat — du löste rebusen
        </motion.p>
      ) : null}
    </div>
  );
}
