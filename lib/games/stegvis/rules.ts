import { hasOnlySwedishLetters, normalizeSwedish } from '@/lib/dictionary/normalize-swedish';
import type { StegvisChainStep, StegvisPuzzle } from '@/lib/games/stegvis/types';

export const STEGVIS_MIDDLE_STEP_COUNT = 5;
export const STEGVIS_CHAIN_WORD_COUNT = STEGVIS_MIDDLE_STEP_COUNT + 2;

const STEGVIS_STEP_LETTERS = 'abcdefghijklmnopqrstuvwxyzåäö';
const DEFAULT_MAX_STEP_OPTIONS = 6;

export type StegvisPuzzleForValidation = {
  start: string;
  target: string;
  minimumSteps?: number;
  sampleSolution?: string[];
};

export type StegvisValidationReason =
  | 'empty'
  | 'invalid_characters'
  | 'wrong_length'
  | 'not_one_letter_diff'
  | 'not_in_dictionary'
  | 'already_used';

export type StegvisValidationContext = {
  letterDifferences?: number;
  wordLength?: number;
};

export type StegvisValidationResult =
  | { valid: true; normalizedWord: string }
  | ({ valid: false; reason: StegvisValidationReason } & StegvisValidationContext);

export type StegvisChainStepValidationResult =
  | { valid: true; normalizedWord: string }
  | {
      valid: false;
      message: string;
    };

export type StegvisSampleSolutionIssue =
  | 'missing_solution'
  | 'wrong_start'
  | 'wrong_target'
  | 'invalid_step'
  | 'minimum_steps_mismatch';

export type StegvisSampleSolutionValidation =
  | { valid: true }
  | {
      valid: false;
      issue: StegvisSampleSolutionIssue;
      stepIndex?: number;
      reason?: StegvisValidationReason;
      message: string;
    };

export type StegvisRound = {
  puzzle: StegvisPuzzle;
  chain: string[];
  currentWord: string;
};

export function normalizeStegvisWord(word: string) {
  return normalizeSwedish(word);
}

export function countLetterDifferences(a: string, b: string) {
  if (a.length !== b.length) {
    return null;
  }

  let differences = 0;

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      differences += 1;
    }
  }

  return differences;
}

export function differsByOneLetter(a: string, b: string) {
  return countLetterDifferences(a, b) === 1;
}

export function countMiddleSteps(chain: StegvisChainStep[]): number {
  return chain.filter((step) => step.role === 'middle').length;
}

export function chainMeetsPlayRequirement(chain: StegvisChainStep[]): boolean {
  return countMiddleSteps(chain) === STEGVIS_MIDDLE_STEP_COUNT;
}

export function getPlayReadyBundles<T extends { chain: StegvisChainStep[] }>(bundles: T[]): T[] {
  return bundles.filter((bundle) => chainMeetsPlayRequirement(bundle.chain));
}

export function resolvePlayReadyInitialBundle<T extends { chain: StegvisChainStep[] }>(
  initialBundle: T,
  fallbackBundles: T[],
): T {
  if (chainMeetsPlayRequirement(initialBundle.chain)) {
    return initialBundle;
  }

  return getPlayReadyBundles([initialBundle, ...fallbackBundles])[0] ?? initialBundle;
}

export function validateStegvisStep(
  currentWord: string,
  nextWord: string,
  chain: string[],
  allowedWords: Set<string>,
): StegvisValidationResult {
  const current = normalizeStegvisWord(currentWord);
  const next = normalizeStegvisWord(nextWord);

  if (!next) {
    return { valid: false, reason: 'empty' };
  }

  if (!hasOnlySwedishLetters(next)) {
    return { valid: false, reason: 'invalid_characters' };
  }

  if (next.length !== current.length) {
    return { valid: false, reason: 'wrong_length', wordLength: current.length };
  }

  const letterDifferences = countLetterDifferences(current, next);

  if (letterDifferences !== 1) {
    return {
      valid: false,
      reason: 'not_one_letter_diff',
      letterDifferences: letterDifferences ?? undefined,
    };
  }

  if (!allowedWords.has(next)) {
    return { valid: false, reason: 'not_in_dictionary' };
  }

  const usedWords = new Set(chain.map((word) => normalizeStegvisWord(word)));

  if (usedWords.has(next)) {
    return { valid: false, reason: 'already_used' };
  }

  return { valid: true, normalizedWord: next };
}

export function getStegvisValidationMessage(
  reason: StegvisValidationReason,
  context: StegvisValidationContext = {},
) {
  switch (reason) {
    case 'empty':
      return 'Skriv nästa ord.';
    case 'invalid_characters':
      return 'Endast svenska bokstäver.';
    case 'wrong_length':
      return context.wordLength
        ? `Ordet måste vara ${context.wordLength} bokstäver långt.`
        : 'Ordet har fel längd.';
    case 'not_one_letter_diff':
      if (context.letterDifferences === 0) {
        return 'Du ändrade inga bokstäver. Ändra bara 1.';
      }

      if (context.letterDifferences && context.letterDifferences > 1) {
        return `Du ändrade ${context.letterDifferences} bokstäver. Ändra bara 1.`;
      }

      return 'Ändra bara en bokstav.';
    case 'not_in_dictionary':
      return 'Ordet finns inte i ordlistan.';
    case 'already_used':
      return 'Det ordet finns redan i kedjan.';
  }
}

export function validateStegvisChainStep(
  input: string,
  previousWord: string,
  expectedWord: string,
  chainSoFar: string[],
  allowedWords: Set<string>,
): StegvisChainStepValidationResult {
  const stepResult: StegvisValidationResult = validateStegvisStep(
    previousWord,
    input,
    chainSoFar,
    allowedWords,
  );

  if (!stepResult.valid) {
    return {
      valid: false,
      message: getStegvisValidationMessage(stepResult.reason, stepResult),
    };
  }

  if (stepResult.normalizedWord !== normalizeStegvisWord(expectedWord)) {
    return {
      valid: false,
      message: 'Fel ord för den här nyckeln.',
    };
  }

  return {
    valid: true,
    normalizedWord: stepResult.normalizedWord,
  };
}

export function validateStegvisSampleSolution(
  puzzle: StegvisPuzzleForValidation,
  allowedWords: Set<string>,
): StegvisSampleSolutionValidation {
  if (!puzzle.sampleSolution || puzzle.sampleSolution.length < 2) {
    return {
      valid: false,
      issue: 'missing_solution',
      message: 'sampleSolution saknas eller är för kort',
    };
  }

  const solution = puzzle.sampleSolution.map((word) => normalizeStegvisWord(word));
  const start = normalizeStegvisWord(puzzle.start);
  const target = normalizeStegvisWord(puzzle.target);

  if (solution[0] !== start) {
    return {
      valid: false,
      issue: 'wrong_start',
      message: `första ordet är "${solution[0]}", förväntat "${start}"`,
    };
  }

  if (solution[solution.length - 1] !== target) {
    return {
      valid: false,
      issue: 'wrong_target',
      message: `sista ordet är "${solution[solution.length - 1]}", förväntat "${target}"`,
    };
  }

  const chain: string[] = [solution[0]];

  for (let index = 1; index < solution.length; index += 1) {
    const step = validateStegvisStep(chain[chain.length - 1], solution[index], chain, allowedWords);

    if (!step.valid) {
      return {
        valid: false,
        issue: 'invalid_step',
        stepIndex: index,
        reason: step.reason,
        message: `${chain[chain.length - 1]} → ${solution[index]}: ${getStegvisValidationMessage(
          step.reason,
          {
            letterDifferences: step.letterDifferences,
            wordLength: step.wordLength,
          },
        )}`,
      };
    }

    chain.push(step.normalizedWord);
  }

  const steps = solution.length - 1;

  if (puzzle.minimumSteps !== undefined && puzzle.minimumSteps !== steps) {
    return {
      valid: false,
      issue: 'minimum_steps_mismatch',
      message: `minimumSteps är ${puzzle.minimumSteps}, kedjan har ${steps} steg`,
    };
  }

  return { valid: true };
}

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
  allowedWords: Set<string>,
) {
  const current = normalizeStegvisWord(currentWord);
  const usedWords = new Set(chain.map((word) => normalizeStegvisWord(word)));
  const candidates = new Set<string>();

  for (let index = 0; index < current.length; index += 1) {
    for (const letter of STEGVIS_STEP_LETTERS) {
      if (letter === current[index]) {
        continue;
      }

      const candidate = current.slice(0, index) + letter + current.slice(index + 1);

      if (allowedWords.has(candidate) && !usedWords.has(candidate)) {
        candidates.add(candidate);
      }
    }
  }

  return [...candidates];
}

export function rankStegvisStepOptions(candidates: string[], targetWord: string) {
  const target = normalizeStegvisWord(targetWord);

  return [...candidates].sort((left, right) => {
    const targetMatchDiff =
      countMatchingLetters(right, target) - countMatchingLetters(left, target);

    if (targetMatchDiff !== 0) {
      return targetMatchDiff;
    }

    return left.localeCompare(right, 'sv');
  });
}

export function getStegvisStepOptions(
  currentWord: string,
  chain: string[],
  targetWord: string,
  options: {
    maxOptions?: number;
    allowedWords: Set<string>;
  },
) {
  const maxOptions = options.maxOptions ?? DEFAULT_MAX_STEP_OPTIONS;
  const candidates = getAllValidStegvisNextWords(currentWord, chain, options.allowedWords);

  return rankStegvisStepOptions(candidates, targetWord).slice(0, maxOptions);
}

export function getStegvisTargetProximityHint(currentWord: string, targetWord: string) {
  const current = normalizeStegvisWord(currentWord);
  const target = normalizeStegvisWord(targetWord);
  const matches = countMatchingLetters(current, target);

  if (matches === current.length) {
    return null;
  }

  if (matches === current.length - 1) {
    return 'Närmare målet.';
  }

  return `${matches} ${matches === 1 ? 'bokstav matchar' : 'bokstäver matchar'} målet.`;
}

export function getStegvisStepFeedback(previousWord: string, nextWord: string, targetWord: string) {
  const previousMatches = countMatchingLetters(previousWord, targetWord);
  const nextMatches = countMatchingLetters(nextWord, targetWord);

  if (nextMatches > previousMatches) {
    return 'Du närmar dig målet.';
  }

  if (nextMatches < previousMatches) {
    return 'Ny väg upptäckt.';
  }

  return 'Bra steg.';
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

export function getDailyPuzzleIndex(puzzles: StegvisPuzzle[], date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNumber = Math.floor(start.getTime() / (24 * 60 * 60 * 1000));

  return dayNumber % puzzles.length;
}

export function pickDailyPuzzle(puzzles: StegvisPuzzle[], date = new Date()) {
  return puzzles[getDailyPuzzleIndex(puzzles, date)] ?? puzzles[0];
}

export function pickRandomPuzzle(puzzles: StegvisPuzzle[], excludeId?: string) {
  const candidates = excludeId ? puzzles.filter((puzzle) => puzzle.id !== excludeId) : puzzles;

  if (candidates.length === 0) {
    return puzzles[0];
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}
