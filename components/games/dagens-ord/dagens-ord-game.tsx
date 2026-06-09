"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LetterTile } from "@/components/games/letter-tile";
import { DagensOrdKeyboard } from "@/components/games/dagens-ord/dagens-ord-keyboard";
import {
  DAGENS_ORD_BOARD_WIDTH_CLASS,
  DAGENS_ORD_PLAY_COLUMN_CLASS,
} from "@/components/games/dagens-ord/dagens-ord-layout";
import {
  DagensOrdResultModal,
  type DagensOrdResultData,
} from "@/components/games/dagens-ord/dagens-ord-result-modal";
import { Button } from "@/components/ui/button";
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
} from "@/lib/game/dagens-ord";
import {
  loadOrCreateDailyRound,
  persistDailyRound,
  resolveDailyStatus,
} from "@/lib/game/dagens-ord-daily-session";
import { normalizeSwedish } from "@/lib/dictionary/normalize-swedish";

const SWEDISH_LETTER_PATTERN = /^[a-zåäö]$/;
const TILE_SHELL_CLASS = "aspect-square w-full";
const TILE_CLASS =
  "!size-full !h-full !w-full max-w-none text-[1.12rem] leading-none md:text-[1.5rem]";

type RevealingGuess = {
  word: string;
  feedback: DagensOrdLetterFeedback[];
  revealedCount: number;
};

function tileClassName(...classes: string[]) {
  return [TILE_CLASS, ...classes].join(" ");
}

function EmptyTile() {
  return (
    <div className={TILE_SHELL_CLASS}>
      <div
        className={tileClassName(
          "rounded-none border border-print-ink/25 bg-print-surface shadow-[var(--print-shadow-soft)]",
        )}
      />
    </div>
  );
}

function GridCell({
  letter,
  state,
  reveal,
}: {
  letter?: string;
  state?: "idle" | DagensOrdLetterFeedback;
  reveal?: boolean;
}) {
  if (!letter) {
    return <EmptyTile />;
  }

  const tile = (
    <div className={TILE_SHELL_CLASS}>
      <LetterTile
        letter={letter}
        size="xs"
        state={state === "idle" || !state ? "idle" : state}
        disableEntryAnimation
        className={tileClassName("transition-colors duration-150")}
      />
    </div>
  );

  if (!reveal || state === "idle" || !state) {
    return tile;
  }

  return (
    <motion.div
      initial={{ rotateX: -90, opacity: 0.4 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ duration: DAGENS_ORD_REVEAL_ANIMATION_MS / 1000, ease: "easeOut" }}
      className={`${TILE_SHELL_CLASS} [perspective:600px]`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <LetterTile
        letter={letter}
        size="xs"
        state={state}
        disableEntryAnimation
        className={tileClassName("transition-colors duration-150")}
      />
    </motion.div>
  );
}

export function DagensOrdGame() {
  const [round, setRound] = useState<DagensOrdRound | null>(null);
  const [revealing, setRevealing] = useState<RevealingGuess | null>(null);
  const [message, setMessage] = useState("");
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const wasFinishedRef = useRef(false);

  useEffect(() => {
    const loadedRound = loadOrCreateDailyRound();
    const status = resolveDailyStatus(
      loadedRound.guesses,
      loadedRound.targetWord,
    );

    if (status === "won" || status === "lost") {
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
  const canEdit = Boolean(round) && !finished && !isRevealing;

  const letterStates = useMemo(
    () => (round ? getKeyboardLetterStates(round.guesses) : new Map()),
    [round],
  );

  const resultData = useMemo<DagensOrdResultData | null>(() => {
    if (!round || !finished) {
      return null;
    }

    return {
      outcome: won ? "won" : "lost",
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

  const submitGuess = useCallback(() => {
    if (!round || !canEdit) {
      return;
    }

    const guess = normalizeSwedish(round.currentInput);

    if (guess.length !== DAGENS_ORD_WORD_LENGTH) {
      return;
    }

    if (!isValidDagensOrdGuess(guess)) {
      setMessage("Ordet finns inte i ordlistan.");
      return;
    }

    const feedback = evaluateGuess(guess, round.targetWord);

    setRound((current) =>
      current
        ? {
            ...current,
            currentInput: "",
          }
        : current,
    );
    setRevealing({
      word: guess,
      feedback,
      revealedCount: 0,
    });
    setMessage("");
  }, [canEdit, round]);

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
      setMessage("");
    },
    [canEdit],
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
    setMessage("");
  }, [canEdit]);

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
          const status = resolveDailyStatus(
            nextRound.guesses,
            nextRound.targetWord,
          );
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
      if (event.key === "Enter") {
        event.preventDefault();
        submitGuess();
        return;
      }

      if (event.key === "Backspace") {
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

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addLetter, canEdit, removeLetter, submitGuess]);

  if (!round) {
    return (
      <div className={`mx-auto py-4 md:py-8 ${DAGENS_ORD_BOARD_WIDTH_CLASS}`}>
        <p className="print-mono text-center text-sm text-print-muted">
          Laddar dagens ord…
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`mx-auto flex w-full flex-col gap-1.5 max-md:min-h-0 max-md:flex-1 md:gap-0 ${DAGENS_ORD_PLAY_COLUMN_CLASS}`}
      >
        <div className={`space-y-1 md:space-y-1.5 ${DAGENS_ORD_BOARD_WIDTH_CLASS}`}>
          {Array.from({ length: DAGENS_ORD_MAX_GUESSES }, (_, rowIndex) => {
            const guess = round.guesses[rowIndex];
            const isRevealingRow =
              revealing !== null && rowIndex === round.guesses.length;
            const isCurrentRow =
              !isRevealingRow && rowIndex === round.guesses.length;

            return (
              <div
                key={rowIndex}
                className="grid grid-cols-5 gap-1.5"
              >
                {Array.from({ length: DAGENS_ORD_WORD_LENGTH }, (_, columnIndex) => {
                  if (guess) {
                    return (
                      <GridCell
                        key={columnIndex}
                        letter={guess.word[columnIndex]?.toLocaleUpperCase("sv-SE")}
                        state={guess.feedback[columnIndex]}
                      />
                    );
                  }

                  if (isRevealingRow && revealing) {
                    const letter = revealing.word[columnIndex]?.toLocaleUpperCase(
                      "sv-SE",
                    );
                    const isRevealed = columnIndex < revealing.revealedCount;

                    return (
                      <GridCell
                        key={columnIndex}
                        letter={letter}
                        state={
                          isRevealed
                            ? revealing.feedback[columnIndex]
                            : "idle"
                        }
                        reveal={isRevealed}
                      />
                    );
                  }

                  if (isCurrentRow) {
                    const letter = round.currentInput[columnIndex];

                    return (
                      <GridCell
                        key={columnIndex}
                        letter={letter?.toLocaleUpperCase("sv-SE")}
                        state="idle"
                      />
                    );
                  }

                  return <GridCell key={columnIndex} />;
                })}
              </div>
            );
          })}
        </div>

        {message ? (
          <p
            className={`print-mono text-xs text-print-red md:text-center md:text-sm ${DAGENS_ORD_BOARD_WIDTH_CLASS}`}
          >
            {message}
          </p>
        ) : null}

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
