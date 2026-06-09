"use client";

import { useCallback, useMemo, useState } from "react";
import { LetterTile } from "@/components/games/letter-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BodyText, MonoLabel } from "@/components/ui/typography";
import { stegvisPuzzles } from "@/data/stegvis/puzzles";
import {
  createStegvisRound,
  getStegvisStepFeedback,
  getStegvisStepOptions,
  getStegvisTargetProximityHint,
  isStegvisSolved,
  normalizeStegvisWord,
  pickDailyPuzzle,
  pickRandomPuzzle,
  validateStegvisStep,
  type StegvisRound,
} from "@/lib/game/stegvis";
import {
  loadStegvisStats,
  saveStegvisStats,
  updateStegvisStatsAfterSolve,
} from "@/lib/storage/stegvis-stats";
import { cn } from "@/lib/utils";

const GAME_INSTRUCTION =
  "Välj nästa ord och ändra en bokstav i taget tills du når målordet. Varje steg måste vara ett riktigt svenskt ord.";

function WordTilesRow({
  word,
  tileState = "idle",
  className,
}: {
  word: string;
  tileState?: "idle" | "active" | "success" | "used";
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1.5 sm:gap-2", className)}>
      {word.split("").map((letter, index) => (
        <LetterTile
          key={`${word}-${index}`}
          letter={letter.toLocaleUpperCase("sv-SE")}
          size="xs"
          state={tileState}
          className="!size-auto aspect-[5/6] min-w-0 flex-1 max-w-[2.75rem] text-xl leading-none sm:max-w-[3rem] sm:text-[1.65rem]"
        />
      ))}
    </div>
  );
}

function ChainArrow() {
  return (
    <p
      aria-hidden
      className="py-0.5 pl-1 text-lg leading-none text-print-muted print-mono"
    >
      ↓
    </p>
  );
}

function PuzzleEndpoint({
  label,
  word,
  tileState,
}: {
  label: string;
  word: string;
  tileState: "idle" | "active";
}) {
  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      <MonoLabel muted className="text-[11px] uppercase tracking-wide">
        {label}
      </MonoLabel>
      <WordTilesRow word={word} tileState={tileState} />
    </div>
  );
}

function WordChain({
  words,
  currentIndex,
}: {
  words: string[];
  currentIndex: number;
}) {
  return (
    <div className="space-y-1">
      {words.map((word, index) => {
        const isStart = index === 0;
        const isCurrent = index === currentIndex;

        return (
          <div key={`${word}-${index}`}>
            {index > 0 ? <ChainArrow /> : null}
            <div
              className={cn(
                "rounded-none border px-3 py-2.5 sm:px-4 sm:py-3",
                isCurrent
                  ? "border-print-green bg-print-green-soft"
                  : "border-transparent bg-transparent",
              )}
            >
              <div className="mb-2 flex min-h-[1.125rem] items-center gap-2">
                {isStart ? (
                  <MonoLabel muted className="text-[10px] uppercase tracking-wide">
                    Start
                  </MonoLabel>
                ) : null}
                {isCurrent ? (
                  <Badge variant="eyebrow" className="px-1.5 py-0.5 text-[10px]">
                    Aktuellt
                  </Badge>
                ) : null}
              </div>
              <WordTilesRow
                word={word}
                tileState={isCurrent ? "active" : isStart ? "idle" : "used"}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepOptionButton({
  word,
  onSelect,
}: {
  word: string;
  onSelect: (word: string) => void;
}) {
  const label = word.toLocaleUpperCase("sv-SE");

  return (
    <button
      type="button"
      onClick={() => onSelect(word)}
      className="print-pill w-full cursor-pointer px-4 py-3 text-base font-black shadow-none transition-[filter,transform] hover:brightness-95 active:translate-x-px active:translate-y-px"
    >
      {label}
    </button>
  );
}

function createInitialRound() {
  return createStegvisRound(pickDailyPuzzle(stegvisPuzzles));
}

export function StegvisGame() {
  const [round, setRound] = useState<StegvisRound>(createInitialRound);
  const [feedback, setFeedback] = useState("");
  const [solved, setSolved] = useState(false);
  const [statsSaved, setStatsSaved] = useState(false);

  const stepsTaken = round.chain.length - 1;
  const currentIndex = round.chain.length - 1;

  const chainWords = useMemo(
    () => round.chain.map((word) => word.toLocaleUpperCase("sv-SE")),
    [round.chain],
  );

  const startWord = normalizeStegvisWord(round.puzzle.start).toLocaleUpperCase(
    "sv-SE",
  );
  const targetWord = normalizeStegvisWord(round.puzzle.target).toLocaleUpperCase(
    "sv-SE",
  );

  const stepOptions = useMemo(
    () =>
      getStegvisStepOptions(
        round.currentWord,
        round.chain,
        round.puzzle.target,
      ).map((word) => word.toLocaleUpperCase("sv-SE")),
    [round.chain, round.currentWord, round.puzzle.target],
  );

  const proximityHint = useMemo(
    () => getStegvisTargetProximityHint(round.currentWord, round.puzzle.target),
    [round.currentWord, round.puzzle.target],
  );

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

  const chooseStep = useCallback(
    (nextWord: string) => {
      if (solved) {
        return;
      }

      const result = validateStegvisStep(
        round.currentWord,
        nextWord,
        round.chain,
      );

      if (!result.valid) {
        return;
      }

      const previousWord = round.currentWord;
      const nextChain = [...round.chain, result.normalizedWord];
      const nextRound: StegvisRound = {
        ...round,
        chain: nextChain,
        currentWord: result.normalizedWord,
      };

      setRound(nextRound);

      if (isStegvisSolved(result.normalizedWord, round.puzzle.target)) {
        setSolved(true);
        setFeedback("");
        persistSolve(nextChain.length - 1);
        return;
      }

      setFeedback(
        getStegvisStepFeedback(
          previousWord,
          result.normalizedWord,
          round.puzzle.target,
        ),
      );
    },
    [persistSolve, round, solved],
  );

  const startRound = useCallback((nextRound: StegvisRound) => {
    setRound(nextRound);
    setSolved(false);
    setStatsSaved(false);
    setFeedback("");
  }, []);

  const playAgain = () => {
    startRound(createStegvisRound(round.puzzle));
  };

  const newPuzzle = () => {
    const puzzle = pickRandomPuzzle(stegvisPuzzles, round.puzzle.id);
    startRound(createStegvisRound(puzzle));
  };

  if (solved) {
    return (
      <ResultView
        round={round}
        stepsTaken={stepsTaken}
        startWord={startWord}
        targetWord={targetWord}
        chainWords={chainWords}
        onPlayAgain={playAgain}
        onNewPuzzle={newPuzzle}
      />
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <BodyText className="text-print-muted">{GAME_INSTRUCTION}</BodyText>

      <Card>
        <CardContent className="space-y-5">
          <div className="flex gap-4 border-b border-print-ink/10 pb-5 sm:gap-6">
            <PuzzleEndpoint label="Start" word={startWord} tileState="idle" />
            <PuzzleEndpoint label="Mål" word={targetWord} tileState="active" />
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <MonoLabel muted>Ordkedja</MonoLabel>
              <p className="print-mono text-xs text-print-muted">
                {stepsTaken} {stepsTaken === 1 ? "steg taget" : "steg tagna"}
              </p>
            </div>

            <WordChain words={chainWords} currentIndex={currentIndex} />
          </div>

          <div className="space-y-3 border-t border-print-ink/10 pt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <MonoLabel muted className="text-[11px] uppercase tracking-wide">
                Nästa steg
              </MonoLabel>
              {proximityHint ? (
                <p className="print-mono text-xs text-print-muted">{proximityHint}</p>
              ) : null}
            </div>

            {stepOptions.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                {stepOptions.map((word) => (
                  <StepOptionButton
                    key={word}
                    word={word}
                    onSelect={chooseStep}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3 rounded-none border border-print-ink/20 bg-print-bg px-4 py-4">
                <p className="text-sm text-print-ink">
                  Inga fler steg från här. Välj ett nytt pussel eller börja om.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="accent"
                    className="w-full sm:w-auto"
                    onClick={playAgain}
                  >
                    Börja om
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-print-bg sm:w-auto"
                    onClick={newPuzzle}
                  >
                    Nytt pussel
                  </Button>
                </div>
              </div>
            )}

            {feedback ? (
              <p className="print-mono text-sm text-print-green">{feedback}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type ResultViewProps = {
  round: StegvisRound;
  stepsTaken: number;
  startWord: string;
  targetWord: string;
  chainWords: string[];
  onPlayAgain: () => void;
  onNewPuzzle: () => void;
};

function ResultView({
  round,
  stepsTaken,
  startWord,
  targetWord,
  chainWords,
  onPlayAgain,
  onNewPuzzle,
}: ResultViewProps) {
  const minimumSteps = round.puzzle.minimumSteps;

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-2xl font-black uppercase text-print-ink sm:text-3xl">
            Klart.
          </p>
          <p className="text-sm text-print-ink sm:text-base">
            Du tog dig från{" "}
            <span className="font-black uppercase">{startWord}</span> till{" "}
            <span className="font-black uppercase">{targetWord}</span> på{" "}
            {stepsTaken} {stepsTaken === 1 ? "steg" : "steg"}.
          </p>
          {minimumSteps !== undefined ? (
            <p className="print-mono text-sm text-print-muted">
              Perfekt lösning: {minimumSteps}{" "}
              {minimumSteps === 1 ? "steg" : "steg"}
              {stepsTaken === minimumSteps ? "" : ` · Din lösning: ${stepsTaken} steg`}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-print-ink/10 pt-4">
          <MonoLabel muted>Kedja</MonoLabel>
          <div className="space-y-1">
            {chainWords.map((word, index) => (
              <div key={`${word}-${index}`}>
                {index > 0 ? <ChainArrow /> : null}
                <WordTilesRow
                  word={word}
                  tileState={index === chainWords.length - 1 ? "success" : "used"}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-print-ink/10 pt-4 sm:flex-row">
          <Button variant="accent" className="w-full sm:w-auto" onClick={onPlayAgain}>
            Spela igen
          </Button>
          <Button
            variant="outline"
            className="w-full bg-print-bg sm:w-auto"
            onClick={onNewPuzzle}
          >
            Nytt pussel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
