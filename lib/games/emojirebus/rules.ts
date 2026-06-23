import { normalizeNormalizedAnswerInput } from '@/lib/content/normalize-answer';

export function normalizeEmojirebusGuess(value: string) {
  return normalizeNormalizedAnswerInput(value);
}
