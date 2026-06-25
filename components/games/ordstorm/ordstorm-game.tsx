'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { ChevronDown, Eye, RotateCcw } from 'lucide-react';
import { LetterTile } from '@/components/games/letter-tile';
import { OrdstormStatsPreview } from '@/components/games/ordstorm/ordstorm-stats-preview';
import { Timer } from '@/components/games/timer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { canBuildWord } from '@/lib/dictionary/can-build-word';
import { normalizeSwedish } from '@/lib/dictionary/normalize-swedish';
import { type WordValidationReason, validateWord } from '@/lib/dictionary/validate-word';
import {
  GAME_DURATION_SECONDS,
  ORDSTORM_RECENT_SEED_LIMIT,
  createOrdstormLexicon,
  createRound,
  getRoundPotentialScore,
  getWordScore,
  isOrdstormCommonWord,
  splitOrdstormWordsByCategory,
} from '@/lib/games/ordstorm/rules';
import type { OrdstormRound, OrdstormWordCatalog } from '@/lib/games/ordstorm/types';
import {
  getLetterTilePlayState,
  getPlayingIdleMessage,
  getRoundResultCopy,
  getSubmitLengthHint,
  getSuccessMessage,
  getTypingHint,
  indicesToWord,
  wordToSelectedIndices,
  type TypingHint,
} from '@/lib/games/ordstorm/ux';
import { useOrdstormStats } from '@/hooks/use-ordstorm-stats';
import { loadStats, saveStats, updateStatsAfterRound } from '@/lib/storage/ordstorm-stats';
import { cn } from '@/lib/utils';

type FeedbackState = {
  tone: 'idle' | 'success' | 'error';
  message: string;
};

type GamePhase = 'pregame' | 'starting' | 'playing' | 'finished';

const SHOW_DEBUG = false;
const START_SEQUENCE_MS = 620;
const FEEDBACK_RESET_MS = 850;
const SUCCESS_RESET_MS = 2500;
const TYPING_HINT_RESET_MS = 1400;

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
      ease: 'easeOut',
    },
  }),
};

export function OrdstormGame({ catalog }: { catalog: OrdstormWordCatalog }) {
  const [round, setRound] = useState<OrdstormRound | null>(null);
  const [phase, setPhase] = useState<GamePhase>('pregame');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [feedback, setFeedback] = useState<FeedbackState>({
    tone: 'idle',
    message: '60 sekunder. Bygg så många svenska ord som möjligt.',
  });
  const [showMissedWords, setShowMissedWords] = useState(false);
  const [showOtherAcceptedMissed, setShowOtherAcceptedMissed] = useState(false);
  const [animationNonce, setAnimationNonce] = useState(0);
  const [feedbackNonce, setFeedbackNonce] = useState(0);
  const [successPulse, setSuccessPulse] = useState(0);
  const [errorShake, setErrorShake] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [typingHint, setTypingHint] = useState<TypingHint>(null);
  const [recentFoundWords, setRecentFoundWords] = useState<string[]>([]);
  const [roundIsNewRecord, setRoundIsNewRecord] = useState(false);
  const stats = useOrdstormStats();
  const persistedRoundRef = useRef(false);
  const recentSeedWordsRef = useRef<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputShellRef = useRef<HTMLDivElement>(null);
  const startTimeoutRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const lexicon = useMemo(() => createOrdstormLexicon(catalog), [catalog]);

  const isPlaying = phase === 'playing';
  const isStarting = phase === 'starting';
  const finished = phase === 'finished';
  const input = useMemo(
    () => (round ? indicesToWord(selectedIndices, round.letters) : ''),
    [round, selectedIndices],
  );
  const showMobileSubmit = isPlaying && (input.length >= 3 || !inputFocused);
  const availableWords = round?.validWords.length ?? 0;
  const roundWordCategories = useMemo(
    () => splitOrdstormWordsByCategory(round?.validWords ?? [], lexicon.commonWordSet),
    [lexicon.commonWordSet, round],
  );
  const availableCommonWords = roundWordCategories.commonWords.length;
  const availableOtherAcceptedWords = roundWordCategories.otherAcceptedWords.length;
  const roundPotentialScore = useMemo(
    () => getRoundPotentialScore(round?.validWords ?? []),
    [round],
  );
  const foundWordSet = useMemo(() => new Set(foundWords), [foundWords]);
  const foundCommonWords = useMemo(
    () => foundWords.filter((word) => isOrdstormCommonWord(word, lexicon.commonWordSet)),
    [foundWords, lexicon.commonWordSet],
  );
  const missedCommonWords = useMemo(
    () => roundWordCategories.commonWords.filter((word) => !foundWordSet.has(word)),
    [foundWordSet, roundWordCategories.commonWords],
  );
  const missedOtherAcceptedWords = useMemo(
    () => roundWordCategories.otherAcceptedWords.filter((word) => !foundWordSet.has(word)),
    [foundWordSet, roundWordCategories.otherAcceptedWords],
  );
  const bestFoundWord = useMemo(
    () =>
      [...foundWords].sort(
        (a, b) =>
          getWordScore(b) - getWordScore(a) || b.length - a.length || a.localeCompare(b, 'sv-SE'),
      )[0] ?? '',
    [foundWords],
  );
  const commonFoundPercentage = availableCommonWords
    ? Math.round((foundCommonWords.length / availableCommonWords) * 100)
    : 0;
  const totalFoundPercentage = availableWords
    ? Math.round((foundWords.length / availableWords) * 100)
    : 0;
  const feedbackMessage =
    feedback.tone === 'idle' && isPlaying
      ? getPlayingIdleMessage({
          wordsFound: foundWords.length,
          timeLeft,
          inputLength: input.length,
        })
      : feedback.message;
  const showUrgentStatus = isPlaying && feedback.tone === 'idle' && timeLeft <= 10;

  const keepInputFocused = useCallback(() => {
    const refocus = () => {
      if (!inputRef.current) {
        return;
      }

      inputRef.current.focus({ preventScroll: true });
    };

    refocus();
    window.requestAnimationFrame(refocus);
    window.setTimeout(refocus, 0);
    window.setTimeout(refocus, 50);
  }, []);

  const focusInput = useCallback(
    (options?: { select?: boolean; scroll?: boolean }) => {
      const { select = true, scroll = true } = options ?? {};

      window.requestAnimationFrame(() => {
        if (scroll) {
          inputShellRef.current?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          });
        }

        keepInputFocused();

        if (select) {
          window.setTimeout(() => {
            inputRef.current?.select();
          }, 0);
        }
      });
    },
    [keepInputFocused],
  );

  const scheduleTypingHintReset = useCallback(() => {
    window.setTimeout(() => {
      setTypingHint(null);
    }, TYPING_HINT_RESET_MS);
  }, []);

  const scheduleFeedbackReset = useCallback((duration: number) => {
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback((current) => (current.tone === 'idle' ? current : { tone: 'idle', message: '' }));
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
    setPhase('pregame');
    setSelectedIndices([]);
    setFoundWords([]);
    setScore(0);
    setTimeLeft(GAME_DURATION_SECONDS);
    setShowMissedWords(false);
    setShowOtherAcceptedMissed(false);
    setInputFocused(false);
    setTypingHint(null);
    setRecentFoundWords([]);
    setRoundIsNewRecord(false);
    setFeedback({
      tone: 'idle',
      message: '60 sekunder. Bygg så många svenska ord som möjligt.',
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
          setPhase('finished');
          setFeedback({
            tone: 'idle',
            message: 'Stormen lugnade sig. Kolla resultatet och kör igen.',
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
    const previousStats = loadStats();
    setRoundIsNewRecord(score > previousStats.bestScore && foundWords.length > 0);
    const nextStats = updateStatsAfterRound(previousStats, {
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
    const nextRound = createRound(lexicon, recentSeedWordsRef.current);
    rememberSeedWord(nextRound.seedWord);
    persistedRoundRef.current = false;
    setRound(nextRound);
    setPhase('starting');
    setSelectedIndices([]);
    setFoundWords([]);
    setScore(0);
    setTimeLeft(GAME_DURATION_SECONDS);
    setShowMissedWords(false);
    setShowOtherAcceptedMissed(false);
    setInputFocused(false);
    setTypingHint(null);
    setRecentFoundWords([]);
    setRoundIsNewRecord(false);
    setFeedback({
      tone: 'idle',
      message: 'Nu börjar stormen.',
    });
    setFeedbackNonce((current) => current + 1);
    setAnimationNonce((current) => current + 1);

    if (startTimeoutRef.current) {
      window.clearTimeout(startTimeoutRef.current);
    }

    startTimeoutRef.current = window.setTimeout(() => {
      setPhase('playing');
      setFeedback({
        tone: 'idle',
        message: 'Skriv direkt. Enter lägger ordet.',
      });
      setFeedbackNonce((current) => current + 1);
      focusInput();
    }, START_SEQUENCE_MS);
  }, [focusInput, lexicon, rememberSeedWord]);

  const submitWord = useCallback(() => {
    if (!isPlaying || !round) {
      return;
    }

    const result = validateWord({
      value: input,
      letters: round.letters,
      allowedWords: lexicon.wordSet,
      blockedWords: foundWordSet,
    });

    if (!result.ok) {
      setFeedback({
        tone: 'error',
        message: getValidationMessage(result.reason, result.word),
      });
      setFeedbackNonce((current) => current + 1);
      setErrorShake((current) => current + 1);
      scheduleFeedbackReset(FEEDBACK_RESET_MS);
      keepInputFocused();
      return;
    }

    const nextFoundWords = [result.word, ...foundWords].sort(
      (a, b) => b.length - a.length || a.localeCompare(b, 'sv-SE'),
    );

    setFoundWords(nextFoundWords);
    setRecentFoundWords((current) => [result.word, ...current].slice(0, 5));
    setTypingHint(null);
    setScore((current) => current + getWordScore(result.word));
    setSelectedIndices([]);
    setFeedback({
      tone: 'success',
      message: getSuccessMessage(result.word),
    });
    setFeedbackNonce((current) => current + 1);
    setSuccessPulse((current) => current + 1);
    scheduleFeedbackReset(SUCCESS_RESET_MS);
    keepInputFocused();
  }, [
    foundWordSet,
    foundWords,
    input,
    isPlaying,
    keepInputFocused,
    lexicon.wordSet,
    round,
    scheduleFeedbackReset,
  ]);

  const toggleTileIndex = useCallback(
    (index: number) => {
      if (!isPlaying || !round) {
        return;
      }

      setSelectedIndices((current) => {
        if (current[current.length - 1] === index) {
          const next = current.slice(0, -1);
          if (next.length >= 3 || next.length === 0) {
            setTypingHint(null);
          }
          return next;
        }

        if (current.includes(index)) {
          return current;
        }

        const next = [...current, index];
        const nextWord = indicesToWord(next, round.letters);

        if (canBuildWord(nextWord, round.letters)) {
          setTypingHint(null);
          return next;
        }

        const hint = getTypingHint(nextWord, indicesToWord(current, round.letters), round.letters);
        if (hint) {
          setTypingHint(hint);
          scheduleTypingHintReset();
        }

        return current;
      });
      focusInput();
    },
    [focusInput, isPlaying, round, scheduleTypingHintReset],
  );

  const removeLetter = useCallback(() => {
    if (!isPlaying) {
      return;
    }

    setSelectedIndices((current) => {
      const next = current.slice(0, -1);
      if (next.length >= 3 || next.length === 0) {
        setTypingHint(null);
      }
      return next;
    });
    focusInput();
  }, [focusInput, isPlaying]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!isPlaying || !round) {
        return;
      }

      const normalizedValue = normalizeSwedish(event.target.value);
      let nextValue = '';

      for (const letter of normalizedValue) {
        const candidate = `${nextValue}${letter}`;
        if (canBuildWord(candidate, round.letters)) {
          nextValue = candidate;
        }
      }

      const hint = getTypingHint(normalizedValue, nextValue, round.letters);
      if (hint) {
        setTypingHint(hint);
        scheduleTypingHintReset();
      } else if (nextValue.length >= 3 || nextValue.length === 0) {
        setTypingHint(null);
      }

      setSelectedIndices(wordToSelectedIndices(nextValue, round.letters));
    },
    [isPlaying, round, scheduleTypingHintReset],
  );

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isPlaying) {
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        submitWord();
        keepInputFocused();
      }
    },
    [isPlaying, keepInputFocused, submitWord],
  );

  const hudTimeLeft = phase === 'pregame' ? GAME_DURATION_SECONDS : timeLeft;
  const hudWordsFound = phase === 'pregame' ? 0 : foundWords.length;
  const showStickyTimer = isPlaying || isStarting;

  return (
    <div className="space-y-1.5 pb-6 sm:space-y-4 sm:pb-10">
      {showStickyTimer ? (
        <div
          className={cn(
            'z-30 w-full pb-1.5',
            'max-md:sticky max-md:top-0 max-md:-mx-1 max-md:px-1 max-md:backdrop-blur-sm max-md:bg-print-bg/95',
            inputFocused ? 'max-md:pt-2.5' : 'max-md:pt-1',
          )}
        >
          <Timer compact timeLeft={hudTimeLeft} duration={GAME_DURATION_SECONDS} />
        </div>
      ) : null}

      {!finished ? (
        <motion.div
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="space-y-3 sm:space-y-4"
        >
          <Card>
            <CardContent className="space-y-4 sm:space-y-5">
              {phase === 'pregame' ? (
                <motion.div
                  initial={false}
                  className="space-y-4 max-md:py-1 sm:space-y-5 sm:border sm:border-dashed sm:border-print-ink/25 sm:bg-print-surface sm:p-7"
                >
                  <Badge className="hidden sm:inline-flex">Redo</Badge>
                  <div className="space-y-2 sm:space-y-3">
                    <p className="text-2xl font-medium tracking-[-0.05em] text-print-ink max-md:print-body sm:text-4xl">
                      Starta stormen när du är redo.
                    </p>
                    <p className="hidden max-w-md text-base leading-7 text-print-muted sm:block">
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
                  {round ? (
                    <motion.div
                      key={`${round.seedWord}-${animationNonce}`}
                      initial="hidden"
                      animate="show"
                      className="grid w-full grid-cols-6 gap-3 sm:gap-3.5"
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
                        const tileState = getLetterTilePlayState({
                          index,
                          selectedIndices,
                          isStarting,
                        });
                        const isLastSelected =
                          selectedIndices[selectedIndices.length - 1] === index;
                        const isSelected = selectedIndices.includes(index);
                        const clickable = isPlaying && !finished && (!isSelected || isLastSelected);

                        return (
                          <motion.button
                            key={`${letter}-${index}`}
                            type="button"
                            custom={index}
                            variants={lettersVariants}
                            whileTap={clickable ? { scale: 0.96 } : undefined}
                            className={cn(
                              'group min-w-0 w-full',
                              clickable ? 'cursor-pointer' : 'cursor-default',
                            )}
                            onClick={() => clickable && toggleTileIndex(index)}
                            disabled={!clickable}
                          >
                            <LetterTile
                              letter={letter}
                              size="xs"
                              className={cn(
                                '!size-auto aspect-[5/6] w-full max-w-none leading-none max-md:text-[1.65rem] sm:min-h-[4rem] sm:text-[2.125rem]',
                                clickable &&
                                  'md:transition-[filter] md:duration-200 md:group-hover:brightness-95',
                              )}
                              state={tileState}
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
                      feedback.tone === 'error'
                        ? { x: [0, -4, 4, -3, 3, 0] }
                        : feedback.tone === 'success'
                          ? {
                              boxShadow: [
                                '0 0 0 rgba(29,138,100,0)',
                                '0 0 0.9rem rgba(29,138,100,0.18)',
                                '0 0 0 rgba(29,138,100,0)',
                              ],
                              scale: [1, 1.01, 1],
                            }
                          : { x: 0, scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' }
                    }
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    className={cn(
                      'shell-card border border-print-ink/25 bg-print-surface p-3 shadow-none sm:p-5',
                      inputFocused && 'border-print-green ring-0',
                    )}
                  >
                    <label
                      htmlFor="ordstorm-word-input"
                      className={cn('block w-full', isPlaying ? 'cursor-text' : 'cursor-default')}
                    >
                      <div className="relative flex items-center gap-2">
                        <input
                          id="ordstorm-word-input"
                          ref={inputRef}
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleInputKeyDown}
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
                          type="text"
                          inputMode="text"
                          enterKeyHint="go"
                          autoCapitalize="none"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          disabled={!isPlaying}
                          placeholder={
                            isStarting ? 'Stormen startar...' : isPlaying ? 'Skriv ord...' : ''
                          }
                          className={cn(
                            'w-full min-w-0 flex-1 border-0 bg-transparent font-semibold uppercase text-print-ink outline-none',
                            'max-md:min-h-[5.75rem] max-md:text-[5.75rem] max-md:font-black max-md:leading-none',
                            'md:min-h-[5rem] md:text-4xl md:tracking-[-0.05em]',
                            'placeholder:font-normal placeholder:normal-case',
                            'max-md:placeholder:text-lg max-md:placeholder:font-medium max-md:placeholder:tracking-normal max-md:placeholder:text-print-muted/40',
                            'md:placeholder:text-print-muted/70',
                          )}
                        />
                        {showMobileSubmit ? (
                          <Button
                            type="button"
                            variant="accent"
                            size="sm"
                            className="shrink-0 px-3 py-2 text-sm md:hidden"
                            onMouseDown={(event) => event.preventDefault()}
                            onTouchStart={(event) => event.preventDefault()}
                            onClick={(event) => {
                              event.preventDefault();
                              submitWord();
                              keepInputFocused();
                            }}
                            disabled={input.length < 3 || !isPlaying}
                          >
                            Lägg ord
                          </Button>
                        ) : null}
                      </div>
                    </label>

                    {isPlaying && (typingHint || getSubmitLengthHint(input.length)) ? (
                      <p className="mt-1.5 text-sm text-print-muted/90 md:text-xs">
                        {(typingHint ?? getSubmitLengthHint(input.length))?.message}
                      </p>
                    ) : null}

                    <div className="mt-4 hidden gap-2 md:flex">
                      <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={removeLetter}
                        disabled={!input.length || !isPlaying}
                      >
                        Radera
                      </Button>
                      <Button
                        variant="accent"
                        className="flex-1"
                        onClick={submitWord}
                        disabled={input.length < 3 || !isPlaying}
                      >
                        Lägg ord
                      </Button>
                    </div>
                  </motion.div>
                </>
              )}

              {phase !== 'pregame' ? (
                <motion.div
                  key={feedbackNonce}
                  initial={{ opacity: 0.72, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'rounded-none border px-4 py-3 text-sm print-mono normal-case tracking-normal max-md:py-2.5',
                    feedback.tone === 'error' &&
                      'border-print-red bg-print-red-soft text-print-red',
                    feedback.tone === 'success' &&
                      'animate-pulse-glow border-print-green bg-print-green-soft text-print-green',
                    showUrgentStatus && 'border-print-red bg-print-red-soft text-print-red',
                    feedback.tone === 'idle' &&
                      !showUrgentStatus &&
                      'border-print-ink/20 bg-print-bg text-print-ink',
                  )}
                >
                  <span>{feedbackMessage}</span>
                </motion.div>
              ) : null}
            </CardContent>
          </Card>

          {phase === 'pregame' ? <OrdstormStatsPreview stats={stats} /> : null}

          <div className="w-full space-y-2.5">
            {isPlaying && recentFoundWords.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-print-ink max-md:print-mono max-md:font-medium max-md:uppercase max-md:tracking-[0.06em] max-md:text-print-muted">
                  {hudWordsFound} ord hittade
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {recentFoundWords.map((word, index) => (
                    <span
                      key={word}
                      className={cn(
                        'shrink-0 px-3 py-1.5 text-sm',
                        index === 0 ? 'print-pill-green' : 'print-pill shadow-none',
                      )}
                    >
                      {word.toLocaleUpperCase('sv-SE')}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {isPlaying || isStarting ? (
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-full bg-print-bg text-sm"
                onClick={resetToPregame}
                disabled={isStarting}
              >
                <RotateCcw className="mr-2 size-4" />
                Starta ny runda
              </Button>
            ) : null}
          </div>
        </motion.div>
      ) : null}

      <AnimatePresence>
        {finished ? (
          <GameOverView
            score={score}
            bestScore={stats.bestScore}
            isNewRecord={roundIsNewRecord}
            foundCommonWordsCount={foundCommonWords.length}
            foundWordsCount={foundWords.length}
            availableCommonWords={availableCommonWords}
            availableOtherAcceptedWords={availableOtherAcceptedWords}
            availableWords={availableWords}
            commonFoundPercentage={commonFoundPercentage}
            totalFoundPercentage={totalFoundPercentage}
            bestFoundWord={bestFoundWord}
            showMissedWords={showMissedWords}
            showOtherAcceptedMissed={showOtherAcceptedMissed}
            missedCommonWords={missedCommonWords}
            missedOtherAcceptedWords={missedOtherAcceptedWords}
            onPlayAgain={resetToPregame}
            onToggleMissedWords={() => setShowMissedWords((current) => !current)}
            onToggleOtherAcceptedMissed={() => setShowOtherAcceptedMissed((current) => !current)}
          />
        ) : null}
      </AnimatePresence>

      {SHOW_DEBUG ? (
        <DebugCard
          seedWord={round?.seedWord ?? 'inte genererad'}
          originalLetters={round?.originalLetters ?? []}
          letters={round?.letters ?? []}
          shuffleAttempts={round?.shuffleAttempts ?? 0}
          availableWords={availableWords}
          validWords={round?.validWords ?? []}
          potentialScore={roundPotentialScore}
        />
      ) : null}
    </div>
  );
}

function getValidationMessage(reason: WordValidationReason, word: string) {
  switch (reason) {
    case 'empty':
      return 'För kort';
    case 'invalid_characters':
      return 'Inte i ordlistan';
    case 'invalid_length':
      return word.length < 3 ? 'För kort' : 'Inte i ordlistan';
    case 'already_found':
      return 'Du har redan hittat ordet';
    case 'not_allowed':
      return 'Inte i ordlistan';
    case 'cannot_build':
      return 'Kan inte byggas av bokstäverna';
  }
}

type GameOverViewProps = {
  score: number;
  bestScore: number;
  isNewRecord: boolean;
  foundCommonWordsCount: number;
  foundWordsCount: number;
  availableCommonWords: number;
  availableOtherAcceptedWords: number;
  availableWords: number;
  commonFoundPercentage: number;
  totalFoundPercentage: number;
  bestFoundWord: string;
  showMissedWords: boolean;
  showOtherAcceptedMissed: boolean;
  missedCommonWords: string[];
  missedOtherAcceptedWords: string[];
  onPlayAgain: () => void;
  onToggleMissedWords: () => void;
  onToggleOtherAcceptedMissed: () => void;
};

function GameOverView({
  score,
  bestScore,
  isNewRecord,
  foundCommonWordsCount,
  foundWordsCount,
  availableCommonWords,
  availableOtherAcceptedWords,
  availableWords,
  commonFoundPercentage,
  totalFoundPercentage,
  bestFoundWord,
  showMissedWords,
  showOtherAcceptedMissed,
  missedCommonWords,
  missedOtherAcceptedWords,
  onPlayAgain,
  onToggleMissedWords,
  onToggleOtherAcceptedMissed,
}: GameOverViewProps) {
  const resultCopy = getRoundResultCopy({
    score,
    wordsFound: foundWordsCount,
    commonFoundPercentage,
    bestScore,
    isNewRecord,
  });
  const recordValue = isNewRecord ? score : bestScore > 0 ? bestScore : '—';
  const recordLabel = isNewRecord ? 'nytt rekord' : 'rekord';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="w-full space-y-5 pt-2 sm:space-y-6"
    >
      <div className="space-y-1">
        <p className="print-mono text-print-muted">Rundan slut</p>
        <p className="text-2xl font-semibold tracking-[-0.05em] max-md:font-black max-md:uppercase max-md:tracking-normal sm:text-3xl">
          {resultCopy.headline}
        </p>
        <p className="text-sm text-print-muted max-md:print-body max-md:normal-case max-md:tracking-normal">
          {resultCopy.subline}
        </p>
      </div>

      {bestFoundWord ? (
        <div
          className={cn(
            'rounded-none border border-print-ink/20 px-4 py-4 text-center shadow-none',
            bestFoundWord.length === 6
              ? 'border-print-green bg-print-feedback-success'
              : 'border-print-green bg-print-green-soft',
          )}
        >
          <p className="print-mono text-print-muted">Bästa ord</p>
          <p
            className={cn(
              'mt-1 font-black uppercase',
              bestFoundWord.length >= 5 ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl',
              'text-print-green',
            )}
          >
            {bestFoundWord.toLocaleUpperCase('sv-SE')}
          </p>
          {bestFoundWord.length === 6 ? (
            <p className="mt-1 print-mono text-print-green">Fullträff</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <ResultStat label="poäng" value={score} />
          <ResultStat label="ord" value={foundWordsCount} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ResultStat label="vanliga" value={`${commonFoundPercentage}%`} />
          <ResultStat label={recordLabel} value={recordValue} highlight={isNewRecord} />
        </div>
      </div>

      <p className="hidden text-xs text-print-muted sm:block">
        {foundCommonWordsCount} av {availableCommonWords} vanliga ord. Totalt {foundWordsCount} av{' '}
        {availableWords} möjliga ({totalFoundPercentage}%), varav {availableOtherAcceptedWords}{' '}
        övriga godkända.
      </p>

      <div className="flex flex-col gap-2">
        <Button variant="accent" className="w-full" onClick={onPlayAgain}>
          Spela igen
        </Button>
        <Button variant="outline" className="w-full" onClick={onToggleMissedWords}>
          <Eye className="mr-2 size-4" />
          {showMissedWords ? 'Dölj missade ord' : 'Visa missade ord'}
        </Button>
      </div>

      <AnimatePresence>
        {showMissedWords ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-print-ink/12 pt-5 max-md:border-print-ink/20">
              <div className="rounded-none border border-print-ink/20 bg-print-bg p-4 shadow-none">
                <p className="print-mono text-print-muted">Missade vanliga ord</p>
                {missedCommonWords.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {missedCommonWords.map((word) => (
                      <span key={word} className="print-pill px-3 py-2 text-sm">
                        {word.toLocaleUpperCase('sv-SE')}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-print-ink">
                    Du hittade alla vanliga ord i rundan.
                  </p>
                )}
              </div>

              {missedOtherAcceptedWords.length > 0 ? (
                <div className="rounded-none border border-print-ink/20 bg-print-surface p-3 shadow-none">
                  <button
                    type="button"
                    onClick={onToggleOtherAcceptedMissed}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <span className="print-mono text-print-muted">
                      Övriga godkända ord ({missedOtherAcceptedWords.length})
                    </span>
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 text-print-muted transition-transform',
                        showOtherAcceptedMissed && 'rotate-180',
                      )}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {showOtherAcceptedMissed ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {missedOtherAcceptedWords.map((word) => (
                            <span
                              key={word}
                              className="print-pill px-2.5 py-1.5 text-xs shadow-none"
                            >
                              {word.toLocaleUpperCase('sv-SE')}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function ResultStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-none border border-print-ink/20 bg-print-bg p-3 shadow-none',
        highlight && 'border-print-green bg-print-green text-white',
      )}
    >
      <p className={cn('text-lg font-black uppercase tabular-nums', highlight && 'text-white')}>
        {value}
      </p>
      <p
        className={cn(
          'print-mono normal-case tracking-normal',
          highlight ? 'text-white/85' : 'text-print-muted',
        )}
      >
        {label}
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
    <Card className="border-dashed border-print-green/30 bg-print-surface">
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Debug</p>
        </div>
        <Badge>Dev</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <DebugRow label="Original seed" value={seedWord} />
        <DebugRow label="Original bokstäver" value={originalLetters.join(' ')} />
        <DebugRow label="Shuffle-resultat" value={letters.join(' ')} />
        <DebugRow label="Shuffle-försök" value={`${shuffleAttempts}`} />
        <DebugRow label="Möjliga ord" value={`${availableWords}`} />
        <DebugRow label="Poängpotential" value={`${potentialScore}`} />
        <div className="space-y-2">
          <p className="print-mono text-print-muted">Ordlisteutfall</p>
          <div className="flex max-h-56 flex-wrap gap-2 overflow-auto">
            {validWords.map((word) => (
              <span key={word} className="print-pill px-3 py-1.5 text-xs shadow-none">
                {word.toLocaleUpperCase('sv-SE')}
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
    <div className="flex items-center justify-between gap-4 rounded-none border border-print-ink/20 bg-print-bg p-3 shadow-none">
      <p className="print-mono text-print-muted">{label}</p>
      <p className="font-mono text-sm text-print-ink">{value}</p>
    </div>
  );
}
