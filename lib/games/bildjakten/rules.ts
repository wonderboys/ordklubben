import { normalizeNormalizedAnswerInput } from '@/lib/content/normalize-answer';

export function normalizeBildjaktenGuess(value: string) {
  return normalizeNormalizedAnswerInput(value);
}
