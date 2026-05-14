"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Eye, RotateCcw, Trophy } from "lucide-react";
import { Keyboard } from "@/components/games/keyboard";
import { LetterTile } from "@/components/games/letter-tile";
import { Score } from "@/components/games/score";
import { Timer } from "@/components/games/timer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { canBuildWord } from "@/lib/dictionary/can-build-word";
import { normalizeSwedish } from "@/lib/dictionary/normalize-swedish";
import {
  type WordValidationReason,
  validateWord,
} from "@/lib/dictionary/validate-word";
import {
  GAME_DURATION_SECONDS,
  ORDSTORM_RECENT_SEED_LIMIT,
  ORDSTORM_WORD_SET,
  createRound,
  getRoundPotentialScore,
  getWordScore,
  type OrdstormRound,
} from "@/lib/game/ordstorm";
import { useOrdstormStats } from "@/hooks/use-ordstorm-stats";
import { loadStats, saveStats, updateStatsAfterRound } from "@/lib/storage/stats";
import { cn } from "@/lib/utils";

type FeedbackState = {
  tone: "idle" | "success" | "error";
  message: string;
};

type GamePhase = "pregame" | "starting" | "playing" | "finished";

const SHOW_DEBUG = false;
const START_SEQUENCE_MS = 620;
const FEEDBACK_RESET_MS = 850;
const SUCCESS_RESET_MS = 520;

const lettersVariants: Variants = {
  hidden: (index: number) => ({
    opacity: 0,
    y: 10,
    x: index % 2 === 0 ? -14 : 14,
    rotate: index % 2 === 0 ? -8 : 8,
    scale: 0.92,
  }),
  show: (index: number) => ({
    opacity: [0, 1, 1],
    y: [10, -3, 0],
    x: [index % 2 === 0 ? -14 : 14, index % 2 === 0 ? 5 : -5, 0],
    rotate: [index % 2 === 0 ? -8 : 8, index % 2 === 0 ? 3 : -3, 0],
    scale: [0.92, 1.04, 1],
    transition: {
      duration: 0.42,
      ease: "easeOut",
    },
  }),
};

export function OrdstormGame() {
  const [round, setRound] = useState<OrdstormRound | null>(null);
  const [phase, setPhase] = useState<GamePhase>("pregame");
  const [input, setInput] = useState("");
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [feedback, setFeedback] = useState<FeedbackState>({
    tone: "idle",
    message: "60 sekunder. Bygg så många svenska ord som möjligt.",
  });
  const [showMissedWords, setShowMissedWords] = useState(false);
  const [animationNonce, setAnimationNonce] = useState(0);
  const [feedbackNonce, setFeedbackNonce] = useState(0);
  const [successPulse, setSuccessPulse] = useState(0);
  const [errorShake, setErrorShake] = useState(0);
  const stats = useOrdstormStats();
  const persistedRoundRef = useRef(false);
  const recentSeedWordsRef = useRef<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputShellRef = useRef<HTMLDivElement>(null);
  const startTimeoutRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const isPlaying = phase === "playing";
  const isStarting = phase === "starting";
  const finished = phase === "finished";
  const availableWords = round?.validWords.length ?? 0;
  const roundPotentialScore = useMemo(
    () => getRoundPotentialScore(round?.validWords ?? []),
    [round],
  );
  const foundWordSet = useMemo(() => new Set(foundWords), [foundWords]);
  const missedWords = useMemo(
    () => (round?.validWords ?? []).filter((word) => !foundWordSet.has(word)),
    [foundWordSet, round],
  );
  const bestFoundWord = useMemo(
    () =>
      [...foundWords].sort(
        (a, b) =>
          getWordScore(b) - getWordScore(a) ||
          b.length - a.length ||
          a.localeCompare(b, "sv-SE"),
      )[0] ?? "",
    [foundWords],
  );
  const foundPercentage = availableWords
    ? Math.round((foundWords.length / availableWords) * 100)
    : 0;

  const focusInput = useCallback(() => {
    window.requestAnimationFrame(() => {
      inputShellRef.current?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.select();
    });
  }, []);

  const scheduleFeedbackReset = useCallback((duration: number) => {
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback((current) =>
        current.tone === "idle"
          ? current
          : { tone: "idle", message: "KÖR VIDARE." },
      );
    }, duration);
  }, []);

  const rememberSeedWord = useCallback((seedWord: string) => {
    recentSeedWordsRef.current = [seedWord, ...recentSeedWordsRef.current]
      .filter((value, index, values) => values.indexOf(value) === index)
      .slice(0, ORDSTORM_RECENT_SEED_LIMIT);
  }, []);

  const resetToPregame = useCallback(() => {
    if (startTimeoutRef.current) {
      window.clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }

    persistedRoundRef.current = false;
    setRound(null);
    setPhase("pregame");
    setInput("");
    setFoundWords([]);
    setScore(0);
    setTimeLeft(GAME_DURATION_SECONDS);
    setShowMissedWords(false);
    setFeedback({
      tone: "idle",
      message: "60 sekunder. Bygg så många svenska ord som möjligt.",
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setPhase("finished");
          setFeedback({
            tone: "idle",
            message: "Stormen lugnade sig. Kolla resultatet och kör igen.",
          });
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (!finished || persistedRoundRef.current) {
      return;
    }

    persistedRoundRef.current = true;
    const nextStats = updateStatsAfterRound(loadStats(), {
      score,
      wordsFound: foundWords.length,
      bestWord: bestFoundWord,
    });
    saveStats(nextStats);
  }, [bestFoundWord, finished, foundWords.length, score]);

  useEffect(() => {
    if (isPlaying) {
      focusInput();
    }
  }, [focusInput, isPlaying]);

  useEffect(() => {
    return () => {
      if (startTimeoutRef.current) {
        window.clearTimeout(startTimeoutRef.current);
      }
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const startRound = useCallback(() => {
    const nextRound = createRound(recentSeedWordsRef.current);
    rememberSeedWord(nextRound.seedWord);
    persistedRoundRef.current = false;
    setRound(nextRound);
    setPhase("starting");
    setInput("");
    setFoundWords([]);
    setScore(0);
    setTimeLeft(GAME_DURATION_SECONDS);
    setShowMissedWords(false);
    setFeedback({
      tone: "idle",
      message: "Nu börjar stormen.",
    });
    setFeedbackNonce((current) => current + 1);
    setAnimationNonce((current) => current + 1);

    if (startTimeoutRef.current) {
      window.clearTimeout(startTimeoutRef.current);
    }

    startTimeoutRef.current = window.setTimeout(() => {
      setPhase("playing");
      setFeedback({
        tone: "idle",
        message: "Kör. Skriv direkt och tryck enter för att lägga ord.",
      });
      setFeedbackNonce((current) => current + 1);
      focusInput();
    }, START_SEQUENCE_MS);
  }, [focusInput, rememberSeedWord]);

  const submitWord = useCallback(() => {
    if (!isPlaying || !round) {
      return;
    }

    const result = validateWord({
      value: input,
      letters: round.letters,
      allowedWords: ORDSTORM_WORD_SET,
      blockedWords: foundWordSet,
    });

    if (!result.ok) {
      setFeedback({
        tone: "error",
        message: getValidationMessage(result.reason, result.word),
      });
      setFeedbackNonce((current) => current + 1);
      setErrorShake((current) => current + 1);
      scheduleFeedbackReset(FEEDBACK_RESET_MS);
      return;
    }

    const nextFoundWords = [result.word, ...foundWords].sort(
      (a, b) => b.length - a.length || a.localeCompare(b, "sv-SE"),
    );

    setFoundWords(nextFoundWords);
    setScore((current) => current + getWordScore(result.word));
    setInput("");
    setFeedback({
      tone: "success",
      message: getSuccessMessage(result.word),
    });
    setFeedbackNonce((current) => current + 1);
    setSuccessPulse((current) => current + 1);
    scheduleFeedbackReset(SUCCESS_RESET_MS);
    focusInput();
  }, [focusInput, foundWordSet, foundWords, input, isPlaying, round, scheduleFeedbackReset]);

  const addLetter = useCallback(
    (letter: string) => {
      if (!isPlaying || !round) {
        return;
      }

      setInput((current) => {
        const nextWord = `${current}${letter}`;
        return canBuildWord(nextWord, round.letters) ? nextWord : current;
      });
      focusInput();
    },
    [focusInput, isPlaying, round],
  );

  const removeLetter = useCallback(() => {
    if (!isPlaying) {
      return;
    }

    setInput((current) => current.slice(0, -1));
    focusInput();
  }, [focusInput, isPlaying]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!isPlaying || !round) {
        return;
      }

      const normalizedValue = normalizeSwedish(event.target.value);
      let nextValue = "";

      for (const letter of normalizedValue) {
        const candidate = `${nextValue}${letter}`;
        if (canBuildWord(candidate, round.letters)) {
          nextValue = candidate;
        }
      }

      setInput(nextValue);
    },
    [isPlaying, round],
  );

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isPlaying) {
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        submitWord();
      }
    },
    [isPlaying, submitWord],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.9fr)]">
      <section className="relative space-y-4 pb-24 sm:pb-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <Timer
            timeLeft={phase === "pregame" ? GAME_DURATION_SECONDS : timeLeft}
            duration={GAME_DURATION_SECONDS}
          />
          <Score
            score={phase === "pregame" ? 0 : score}
            wordsFound={phase === "pregame" ? 0 : foundWords.length}
          />
        </div>

        <motion.div
          animate={{
            opacity: finished ? 0.42 : 1,
            scale: finished ? 0.985 : 1,
            filter: finished ? "blur(1px)" : "blur(0px)",
          }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="space-y-4"
        >
          <Card>
            <CardContent className="space-y-5">
              {phase === "pregame" ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="shell-card space-y-5 border-dashed bg-white/80 p-6 sm:p-7"
                >
                  <Badge>Redo</Badge>
                  <div className="space-y-3">
                    <p className="text-3xl font-semibold tracking-[-0.05em] text-ink sm:text-4xl">
                      Starta stormen när du är redo.
                    </p>
                    <p className="max-w-md text-base leading-7 text-muted">
                      60 sekunder. Bygg så många svenska ord som möjligt.
                    </p>
                  </div>
                  <Button
                    variant="accent"
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={startRound}
                  >
                    Starta storm
                  </Button>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        Bokstäver
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {isStarting
                          ? "Stormen bygger upp. Bokstäverna faller in nu."
                          : "Skriv ord med tre till sex bokstäver innan tiden tar slut."}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetToPregame}
                      disabled={isStarting}
                    >
                      <RotateCcw className="mr-2 size-4" />
                      Ny runda
                    </Button>
                  </div>

                  {round ? (
                    <motion.div
                      key={`${round.seedWord}-${animationNonce}`}
                      initial="hidden"
                      animate="show"
                      className="flex flex-wrap gap-2 sm:gap-3"
                      variants={{
                        hidden: {},
                        show: {
                          transition: {
                            staggerChildren: 0.05,
                            delayChildren: 0.02,
                          },
                        },
                      }}
                    >
                      {round.letters.map((letter, index) => {
                        const usedCount = input
                          .split("")
                          .filter(
                            (inputLetter) =>
                              inputLetter === normalizeSwedish(letter),
                          ).length;
                        const availableCount = round.letters
                          .slice(0, index + 1)
                          .filter((candidate) => candidate === letter).length;
                        const clickable =
                          isPlaying && usedCount < availableCount && !finished;

                        return (
                          <motion.button
                            key={`${letter}-${index}`}
                            type="button"
                            custom={index}
                            variants={lettersVariants}
                            whileTap={clickable ? { scale: 0.96 } : undefined}
                            className={cn(
                              "rounded-[1.35rem]",
                              !clickable && "cursor-default",
                            )}
                            onClick={() =>
                              clickable && addLetter(normalizeSwedish(letter))
                            }
                            disabled={!clickable}
                          >
                            <LetterTile
                              letter={letter}
                              size="lg"
                              state={
                                usedCount >= availableCount
                                  ? "active"
                                  : isStarting
                                    ? "used"
                                    : "idle"
                              }
                            />
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  ) : null}

                  <motion.div
                    ref={inputShellRef}
                    key={`${successPulse}-${errorShake}`}
                    animate={
                      feedback.tone === "error"
                        ? { x: [0, -4, 4, -3, 3, 0] }
                        : feedback.tone === "success"
                          ? {
                              boxShadow: [
                                "0 0 0 rgba(29,138,100,0)",
                                "0 0 0.9rem rgba(29,138,100,0.18)",
                                "0 0 0 rgba(29,138,100,0)",
                              ],
                              scale: [1, 1.01, 1],
                            }
                          : { x: 0, scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" }
                    }
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="shell-card border-dashed bg-white/75 p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        Ditt ord
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        {input.length}/6
                      </p>
                    </div>

                    <div className="mt-3">
                      <label className="block">
                        <span className="sr-only">Skriv ditt ord</span>
                        <input
                          ref={inputRef}
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleInputKeyDown}
                          type="text"
                          inputMode="text"
                          enterKeyHint="done"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          disabled={!isPlaying}
                          placeholder={
                            isStarting ? "Stormen startar..." : "Skriv ord här"
                          }
                          className="w-full border-0 bg-transparent text-3xl font-semibold uppercase tracking-[-0.05em] text-ink outline-none placeholder:text-muted/70 sm:text-4xl"
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="ghost"
                        className="flex-1 rounded-2xl"
                        onClick={removeLetter}
                        disabled={!input.length || !isPlaying}
                      >
                        Radera
                      </Button>
                      <Button
                        variant="accent"
                        className="flex-1 rounded-2xl"
                        onClick={submitWord}
                        disabled={input.length < 3 || !isPlaying}
                      >
                        Lägg ord
                      </Button>
                    </div>
                  </motion.div>
                </>
              )}

              {phase !== "pregame" ? (
                <motion.div
                  key={feedbackNonce}
                  initial={{ opacity: 0.72, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm",
                    feedback.tone === "error" && "bg-[#f8e8e3] text-danger",
                    feedback.tone === "success" &&
                      "animate-pulse-glow bg-[#e2f5ee] text-success",
                    feedback.tone === "idle" && "bg-surface-strong text-muted",
                  )}
                >
                  {renderFeedbackMessage(feedback.message)}
                </motion.div>
              ) : null}
            </CardContent>
          </Card>

          {isPlaying ? (
            <div className="hidden md:block">
              <Keyboard
                letters={round?.letters ?? []}
                input={input}
                onLetter={addLetter}
                onBackspace={removeLetter}
                onSubmit={submitWord}
              />
            </div>
          ) : null}
        </motion.div>

        <AnimatePresence>
          {finished ? (
            <GameOverOverlay
              score={score}
              foundWords={foundWords}
              availableWords={availableWords}
              foundPercentage={foundPercentage}
              bestFoundWord={bestFoundWord}
              showMissedWords={showMissedWords}
              missedWords={missedWords}
              onPlayAgain={resetToPregame}
              onToggleMissedWords={() =>
                setShowMissedWords((current) => !current)
              }
            />
          ) : null}
        </AnimatePresence>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Hittade ord
              </p>
              <p className="mt-1 text-sm text-muted">
                {phase === "pregame"
                  ? "Starta stormen för att se ordjakten ta form."
                  : `${foundWords.length} av ${availableWords} möjliga ord i rundan.`}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="popLayout">
              <div className="flex max-h-[28rem] flex-wrap gap-2 overflow-auto">
                {foundWords.length ? (
                  foundWords.map((word) => (
                    <motion.div
                      key={word}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: [0.96, 1.04, 1], y: 0 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="rounded-full bg-accent-soft px-3 py-2 text-sm font-medium text-accent-strong"
                    >
                      {word.toLocaleUpperCase("sv-SE")}
                    </motion.div>
                  ))
                ) : (
                  <p className="fine-text">
                    {phase === "pregame"
                      ? "Här landar orden när stormen väl drar igång."
                      : isStarting
                        ? "Stormen bygger upp. Första ordet är snart inom räckhåll."
                        : "Första ordet sätter rytmen. Tre bokstäver räcker för att börja."}
                  </p>
                )}
              </div>
            </AnimatePresence>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Lokal statistik
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-surface-strong p-4">
                <p className="text-muted">Bästa poäng</p>
                <p className="mt-1 text-2xl font-semibold">
                  {stats.bestScore}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-strong p-4">
                <p className="text-muted">Rundor</p>
                <p className="mt-1 text-2xl font-semibold">
                  {stats.roundsPlayed}
                </p>
              </div>
            </div>
            <p className="fine-text">
              Statistik sparas i `localStorage`. Perfekt som lätt grund tills vi
              väljer om plattformen ska få dagliga lägen, konton eller sync.
            </p>
          </CardContent>
        </Card>

        {SHOW_DEBUG ? (
          <DebugCard
            seedWord={round?.seedWord ?? "inte genererad"}
            originalLetters={round?.originalLetters ?? []}
            letters={round?.letters ?? []}
            shuffleAttempts={round?.shuffleAttempts ?? 0}
            availableWords={availableWords}
            validWords={round?.validWords ?? []}
            potentialScore={roundPotentialScore}
          />
        ) : null}
      </section>
    </div>
  );
}

function getValidationMessage(reason: WordValidationReason, word: string) {
  switch (reason) {
    case "empty":
      return "För kort";
    case "invalid_characters":
      return "Inte i ordlistan";
    case "invalid_length":
      return word.length < 3 ? "För kort" : "Inte i ordlistan";
    case "already_found":
      return "Du har redan hittat ordet";
    case "not_allowed":
      return "Inte i ordlistan";
    case "cannot_build":
      return "Kan inte byggas av bokstäverna";
  }
}

function getSuccessMessage(word: string) {
  if (word.length === 6) {
    return "Fullträff!";
  }

  if (word.length >= 5) {
    return "Snyggt!";
  }

  return "Bra!";
}

function renderFeedbackMessage(message: string) {
  return message.toLocaleUpperCase("sv-SE");
}

type GameOverOverlayProps = {
  score: number;
  foundWords: string[];
  availableWords: number;
  foundPercentage: number;
  bestFoundWord: string;
  showMissedWords: boolean;
  missedWords: string[];
  onPlayAgain: () => void;
  onToggleMissedWords: () => void;
};

function GameOverOverlay({
  score,
  foundWords,
  availableWords,
  foundPercentage,
  bestFoundWord,
  showMissedWords,
  missedWords,
  onPlayAgain,
  onToggleMissedWords,
}: GameOverOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center rounded-[1.75rem] bg-canvas/72 p-3 backdrop-blur-sm sm:p-5"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        <Card className="border-accent/20 bg-surface">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-white">
                <Trophy className="size-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  Rundan slut
                </p>
                <p className="text-2xl font-semibold tracking-[-0.05em]">
                  Stormen lugnade sig
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <SummaryStat label="Total poäng" value={`${score}`} highlight />
              <SummaryStat label="Hittade ord" value={`${foundWords.length}`} />
              <SummaryStat label="Procent hittade" value={`${foundPercentage}%`} />
              <SummaryStat
                label="Bästa ord"
                value={
                  bestFoundWord
                    ? bestFoundWord.toLocaleUpperCase("sv-SE")
                    : "INGET ÄNNU"
                }
              />
            </div>

            <p className="fine-text">
              {foundWords.length} av {availableWords} möjliga ord hittade i rundan.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="accent" className="flex-1" onClick={onPlayAgain}>
                Spela igen
              </Button>
              <Button variant="outline" className="flex-1" onClick={onToggleMissedWords}>
                <Eye className="mr-2 size-4" />
                {showMissedWords ? "Dölj missade ord" : "Visa missade ord"}
              </Button>
            </div>

            <AnimatePresence>
              {showMissedWords ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-3xl bg-surface-strong p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      Missade ord
                    </p>
                    <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-auto">
                      {missedWords.map((word) => (
                        <span
                          key={word}
                          className="rounded-full bg-white px-3 py-2 text-sm font-medium text-ink"
                        >
                          {word.toLocaleUpperCase("sv-SE")}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function SummaryStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface-strong p-4",
        highlight && "bg-accent text-white",
      )}
    >
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 text-lg font-semibold tracking-[-0.03em]",
          highlight && "text-white",
        )}
      >
        {value}
      </p>
    </div>
  );
}

type DebugCardProps = {
  seedWord: string;
  originalLetters: string[];
  letters: string[];
  shuffleAttempts: number;
  availableWords: number;
  validWords: string[];
  potentialScore: number;
};

function DebugCard({
  seedWord,
  originalLetters,
  letters,
  shuffleAttempts,
  availableWords,
  validWords,
  potentialScore,
}: DebugCardProps) {
  return (
    <Card className="border-dashed border-accent/30 bg-white/70">
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Debug</p>
        </div>
        <Badge>Dev</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <DebugRow label="Original seed" value={seedWord} />
        <DebugRow label="Original bokstäver" value={originalLetters.join(" ")} />
        <DebugRow label="Shuffle-resultat" value={letters.join(" ")} />
        <DebugRow label="Shuffle-försök" value={`${shuffleAttempts}`} />
        <DebugRow label="Möjliga ord" value={`${availableWords}`} />
        <DebugRow label="Poängpotential" value={`${potentialScore}`} />
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Ordlisteutfall
          </p>
          <div className="flex max-h-56 flex-wrap gap-2 overflow-auto">
            {validWords.map((word) => (
              <span
                key={word}
                className="rounded-full bg-surface-strong px-3 py-1.5 text-xs font-medium text-ink"
              >
                {word.toLocaleUpperCase("sv-SE")}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface-strong p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="font-mono text-sm text-ink">{value}</p>
    </div>
  );
}
