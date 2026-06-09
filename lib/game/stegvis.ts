import { allowedSvWords } from "@/data/words";
import { type StegvisPuzzle } from "@/data/stegvis/puzzles";
import {
  normalizeStegvisWord,
  validateStegvisSampleSolution as validateStegvisSampleSolutionCore,
  validateStegvisStep as validateStegvisStepCore,
  type StegvisSampleSolutionValidation,
  type StegvisValidationResult,
} from "@/lib/game/stegvis-validation";

export type StegvisRound = {
  puzzle: StegvisPuzzle;
  chain: string[];
  currentWord: string;
};

export {
  countLetterDifferences,
  differsByOneLetter,
  getStegvisValidationMessage,
  normalizeStegvisWord,
  type StegvisSampleSolutionIssue,
  type StegvisSampleSolutionValidation,
  type StegvisValidationContext,
  type StegvisValidationReason,
  type StegvisValidationResult,
} from "@/lib/game/stegvis-validation";

const allowedWordSet = new Set(
  allowedSvWords.map((word) => normalizeStegvisWord(word)),
);

const STEGVIS_STEP_LETTERS = "abcdefghijklmnopqrstuvwxyzåäö";
const DEFAULT_MAX_STEP_OPTIONS = 6;

export function countMatchingLetters(a: string, b: string) {
  const left = normalizeStegvisWord(a);
  const right = normalizeStegvisWord(b);

  if (left.length !== right.length) {
    return 0;
  }

  let matches = 0;

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] === right[index]) {
      matches += 1;
    }
  }

  return matches;
}

export function getAllValidStegvisNextWords(
  currentWord: string,
  chain: string[],
  allowedWords: Set<string> = allowedWordSet,
) {
  const current = normalizeStegvisWord(currentWord);
  const usedWords = new Set(chain.map((word) => normalizeStegvisWord(word)));
  const candidates = new Set<string>();

  for (let index = 0; index < current.length; index += 1) {
    for (const letter of STEGVIS_STEP_LETTERS) {
      if (letter === current[index]) {
        continue;
      }

      const candidate =
        current.slice(0, index) + letter + current.slice(index + 1);

      if (allowedWords.has(candidate) && !usedWords.has(candidate)) {
        candidates.add(candidate);
      }
    }
  }

  return [...candidates];
}

export function rankStegvisStepOptions(
  candidates: string[],
  targetWord: string,
) {
  const target = normalizeStegvisWord(targetWord);

  return [...candidates].sort((left, right) => {
    const targetMatchDiff =
      countMatchingLetters(right, target) - countMatchingLetters(left, target);

    if (targetMatchDiff !== 0) {
      return targetMatchDiff;
    }

    return left.localeCompare(right, "sv");
  });
}

export function getStegvisStepOptions(
  currentWord: string,
  chain: string[],
  targetWord: string,
  options: {
    maxOptions?: number;
    allowedWords?: Set<string>;
  } = {},
) {
  const maxOptions = options.maxOptions ?? DEFAULT_MAX_STEP_OPTIONS;
  const candidates = getAllValidStegvisNextWords(
    currentWord,
    chain,
    options.allowedWords,
  );

  return rankStegvisStepOptions(candidates, targetWord).slice(0, maxOptions);
}

export function getStegvisTargetProximityHint(
  currentWord: string,
  targetWord: string,
) {
  const current = normalizeStegvisWord(currentWord);
  const target = normalizeStegvisWord(targetWord);
  const matches = countMatchingLetters(current, target);

  if (matches === current.length) {
    return null;
  }

  if (matches === current.length - 1) {
    return "Närmare målet.";
  }

  return `${matches} ${matches === 1 ? "bokstav matchar" : "bokstäver matchar"} målet.`;
}

export function getStegvisStepFeedback(
  previousWord: string,
  nextWord: string,
  targetWord: string,
) {
  const previousMatches = countMatchingLetters(previousWord, targetWord);
  const nextMatches = countMatchingLetters(nextWord, targetWord);

  if (nextMatches > previousMatches) {
    return "Du närmar dig målet.";
  }

  if (nextMatches < previousMatches) {
    return "Ny väg upptäckt.";
  }

  return "Bra steg.";
}

export function createStegvisRound(puzzle: StegvisPuzzle): StegvisRound {
  const start = normalizeStegvisWord(puzzle.start);

  return {
    puzzle,
    chain: [start],
    currentWord: start,
  };
}

export function isStegvisSolved(currentWord: string, targetWord: string) {
  return normalizeStegvisWord(currentWord) === normalizeStegvisWord(targetWord);
}

export function validateStegvisStep(
  currentWord: string,
  nextWord: string,
  chain: string[],
  allowedWords: Set<string> = allowedWordSet,
): StegvisValidationResult {
  return validateStegvisStepCore(currentWord, nextWord, chain, allowedWords);
}

export function validateStegvisSampleSolution(
  puzzle: StegvisPuzzle,
  allowedWords: Set<string> = allowedWordSet,
): StegvisSampleSolutionValidation {
  return validateStegvisSampleSolutionCore(puzzle, allowedWords);
}

export function getDailyPuzzleIndex(puzzles: StegvisPuzzle[], date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNumber = Math.floor(start.getTime() / (24 * 60 * 60 * 1000));

  return dayNumber % puzzles.length;
}

export function pickDailyPuzzle(
  puzzles: StegvisPuzzle[],
  date = new Date(),
): StegvisPuzzle {
  return puzzles[getDailyPuzzleIndex(puzzles, date)] ?? puzzles[0];
}

export function pickRandomPuzzle(
  puzzles: StegvisPuzzle[],
  excludeId?: string,
) {
  const candidates = excludeId
    ? puzzles.filter((puzzle) => puzzle.id !== excludeId)
    : puzzles;

  if (candidates.length === 0) {
    return puzzles[0];
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}
