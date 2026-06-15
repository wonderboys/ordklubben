// Node-runnable mirror of lib/game/stegvis-validation.ts (relative imports, no @/ alias).
import { hasOnlySwedishLetters, normalizeSwedish } from '../lib/dictionary/normalize-swedish.ts';

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

type StegvisValidationContext = {
  letterDifferences?: number;
  wordLength?: number;
};

export type StegvisValidationResult =
  | { valid: true; normalizedWord: string }
  | ({ valid: false; reason: StegvisValidationReason } & StegvisValidationContext);

function normalizeStegvisWord(word: string) {
  return normalizeSwedish(word);
}

function countLetterDifferences(a: string, b: string) {
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

function validateStegvisStep(
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

function getStegvisValidationMessage(
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

export type StegvisSampleSolutionValidation =
  | { valid: true }
  | {
      valid: false;
      issue: string;
      stepIndex?: number;
      reason?: StegvisValidationReason;
      message: string;
    };

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

export function normalizeStegvisWordForCheck(word: string) {
  return normalizeStegvisWord(word);
}
