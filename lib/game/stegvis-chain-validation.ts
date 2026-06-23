import {
  getStegvisValidationMessage,
  normalizeStegvisWord,
  validateStegvisStep,
} from '@/lib/game/stegvis';
import type { StegvisValidationResult } from '@/lib/game/stegvis-validation';

export type StegvisChainStepValidationResult =
  | { valid: true; normalizedWord: string }
  | {
      valid: false;
      message: string;
    };

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
