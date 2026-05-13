"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bug, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { Keyboard } from "@/components/games/keyboard";
import { LetterTile } from "@/components/games/letter-tile";
import { Score } from "@/components/games/score";
import { Timer } from "@/components/games/timer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { canBuildWord } from "@/lib/dictionary/can-build-word";
import { getLetterCount } from "@/lib/dictionary/letter-pool";
import { normalizeSwedish } from "@/lib/dictionary/normalize-swedish";
import {
  type WordValidationReason,
  validateWord,
} from "@/lib/dictionary/validate-word";
import {
  GAME_DURATION_SECONDS,
  ORDSTORM_WORD_SET,
  createRound,
  getRoundPotentialScore,
  getWordScore,
} from "@/lib/game/ordstorm";
import { useOrdstormStats } from "@/hooks/use-ordstorm-stats";
import { loadStats, saveStats, updateStatsAfterRound } from "@/lib/storage/stats";
import { cn } from "@/lib/utils";

type FeedbackState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const SHOW_DEBUG = true;

export function OrdstormGame() {
  const [round, setRound] = useState(() => createRound());
  const [input, setInput] = useState("");
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [feedback, setFeedback] = useState<FeedbackState>({
    tone: "idle",
    message: "Bygg svenska ord med tre till sex bokstäver innan tiden tar slut.",
  });
  const stats = useOrdstormStats();
  const persistedRoundRef = useRef(false);

  const finished = timeLeft === 0;
  const availableWords = round.validWords.length;
  const roundPotentialScore = useMemo(
    () => getRoundPotentialScore(round.validWords),
    [round.validWords],
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

  useEffect(() => {
    if (finished) {
      if (persistedRoundRef.current) {
        return;
      }

      persistedRoundRef.current = true;
      const nextStats = updateStatsAfterRound(loadStats(), {
        score,
        wordsFound: foundWords.length,
        bestWord: foundWords[0] ?? "",
      });
      saveStats(nextStats);
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [finished, foundWords, score]);

  const foundWordSet = useMemo(() => new Set(foundWords), [foundWords]);

  const submitWord = useCallback(() => {
    if (finished) {
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
      return;
    }

    const points = getWordScore(result.word);
    const nextScore = score + points;
    const nextFoundWords = [result.word, ...foundWords].sort(
      (a, b) => b.length - a.length || a.localeCompare(b, "sv-SE"),
    );

    setFoundWords(nextFoundWords);
    setScore(nextScore);
    setInput("");
    setFeedback({
      tone: "success",
      message: getSuccessMessage(result.word),
    });
  }, [finished, foundWordSet, foundWords, input, round.letters, score]);

  const addLetter = useCallback(
    (letter: string) => {
      if (finished) {
        return;
      }

      setInput((current) => {
        const nextWord = `${current}${letter}`;
        return canBuildWord(nextWord, round.letters) ? nextWord : current;
      });
    },
    [finished, round.letters],
  );

  const removeLetter = useCallback(() => {
    setInput((current) => current.slice(0, -1));
  }, []);

  function resetRound() {
    persistedRoundRef.current = false;
    setRound(createRound());
    setInput("");
    setFoundWords([]);
    setScore(0);
    setTimeLeft(GAME_DURATION_SECONDS);
    setFeedback({
      tone: "idle",
      message: "Ny storm. Samma regler, nya bokstäver.",
    });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (finished) {
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        submitWord();
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        removeLetter();
        return;
      }

      const key = normalizeSwedish(event.key);
      if (!key || key.length !== 1) {
        return;
      }

      const nextCount = normalizeSwedish(`${input}${key}`)
        .split("")
        .filter((letter) => letter === key).length;
      const availableCount = getLetterCount(round.letters, key);

      if (availableCount >= nextCount) {
        event.preventDefault();
        addLetter(key);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addLetter, finished, input, removeLetter, round.letters, submitWord]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.9fr)]">
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Timer timeLeft={timeLeft} duration={GAME_DURATION_SECONDS} />
          <Score score={score} wordsFound={foundWords.length} />
        </div>

        <Card>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  Bokstäver
                </p>
                <p className="mt-1 text-sm text-muted">
                  Bygg svenska ord med tre till sex bokstäver.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetRound}>
                <RotateCcw className="mr-2 size-4" />
                Ny runda
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              {round.letters.map((letter, index) => {
                const usedCount = input
                  .split("")
                  .filter(
                    (inputLetter) => inputLetter === normalizeSwedish(letter),
                  ).length;
                const availableCount = round.letters
                  .slice(0, index + 1)
                  .filter((candidate) => candidate === letter).length;

                return (
                  <LetterTile
                    key={`${letter}-${index}`}
                    letter={letter}
                    size="lg"
                    state={usedCount >= availableCount ? "active" : "idle"}
                  />
                );
              })}
            </div>

            <div className="shell-card border-dashed bg-white/70 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  Ditt ord
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  {input.length}/6
                </p>
              </div>
              <div className="mt-3 flex min-h-16 flex-wrap gap-2">
                {input ? (
                  input.split("").map((letter, index) => (
                    <LetterTile
                      key={`${letter}-${index}`}
                      letter={letter}
                      state={feedback.tone === "success" ? "success" : "active"}
                    />
                  ))
                ) : (
                  <p className="fine-text">
                    Tryck på bokstäverna eller skriv med tangentbordet.
                  </p>
                )}
              </div>
            </div>

            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm",
                feedback.tone === "error" && "bg-[#f8e8e3] text-danger",
                feedback.tone === "success" &&
                  "animate-pulse-glow bg-[#e2f5ee] text-success",
                feedback.tone === "idle" && "bg-surface-strong text-muted",
              )}
            >
              {feedback.message}
            </div>
          </CardContent>
        </Card>

        {finished ? (
          <RoundSummaryCard
            score={score}
            foundWords={foundWords}
            availableWords={availableWords}
            foundPercentage={foundPercentage}
            bestFoundWord={bestFoundWord}
            onPlayAgain={resetRound}
          />
        ) : (
          <Keyboard
            letters={round.letters}
            input={input}
            onLetter={addLetter}
            onBackspace={removeLetter}
            onSubmit={submitWord}
          />
        )}
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Hittade ord
              </p>
              <p className="mt-1 text-sm text-muted">
                {foundWords.length} av {availableWords} möjliga ord i rundan.
              </p>
            </div>
            <Sparkles className="size-5 text-accent" />
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
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      className="rounded-full bg-accent-soft px-3 py-2 text-sm font-medium text-accent-strong"
                    >
                      {word}
                    </motion.div>
                  ))
                ) : (
                  <p className="fine-text">
                    Första ordet sätter rytmen. Tre bokstäver räcker för att börja.
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
            seedWord={round.seedWord}
            letters={round.letters}
            availableWords={availableWords}
            validWords={round.validWords}
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

type RoundSummaryCardProps = {
  score: number;
  foundWords: string[];
  availableWords: number;
  foundPercentage: number;
  bestFoundWord: string;
  onPlayAgain: () => void;
};

function RoundSummaryCard({
  score,
  foundWords,
  availableWords,
  foundPercentage,
  bestFoundWord,
  onPlayAgain,
}: RoundSummaryCardProps) {
  return (
    <Card className="border-accent/20 bg-accent-soft/50">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-accent text-white">
            <Trophy className="size-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Rundan slut
            </p>
            <p className="text-2xl font-semibold tracking-[-0.05em]">
              {score} poäng
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <SummaryStat label="Hittade ord" value={`${foundWords.length}`} />
          <SummaryStat label="Möjliga ord" value={`${availableWords}`} />
          <SummaryStat label="Träffprocent" value={`${foundPercentage}%`} />
          <SummaryStat
            label="Bästa ord"
            value={bestFoundWord || "Inget ännu"}
          />
        </div>

        <Button variant="accent" className="w-full" onClick={onPlayAgain}>
          Spela igen
        </Button>
      </CardContent>
    </Card>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}

type DebugCardProps = {
  seedWord: string;
  letters: string[];
  availableWords: number;
  validWords: string[];
  potentialScore: number;
};

function DebugCard({
  seedWord,
  letters,
  availableWords,
  validWords,
  potentialScore,
}: DebugCardProps) {
  return (
    <Card className="border-dashed border-accent/30 bg-white/70">
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="size-4 text-accent" />
          <p className="text-sm font-semibold">Debug</p>
        </div>
        <Badge>Dev</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <DebugRow label="Seed word" value={seedWord} />
        <DebugRow label="Bokstäver" value={letters.join(" ")} />
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
                {word}
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
