const REMOVABLE_CHARS_PATTERN = /[\s'’\-‐‑‒–—]+/g;
const THEME_SLUG_SEPARATOR_PATTERN = /[\s_]+/g;
const THEME_SLUG_INVALID_PATTERN = /[^a-z0-9åäö-]/g;
const CONTENT_ANSWER_PATTERN = /^[A-ZÅÄÖ\s'’\-]+$/u;

export type NormalizedAnswerResult = {
  answer: string;
  normalizedAnswer: string;
  length: number;
};

export function normalizeAnswer(input: string): NormalizedAnswerResult {
  const answer = input.trim().normalize('NFC').toLocaleUpperCase('sv-SE');
  const normalizedAnswer = answer.replace(REMOVABLE_CHARS_PATTERN, '');

  return {
    answer,
    normalizedAnswer,
    length: normalizedAnswer.length,
  };
}

export function isValidAnswerFormat(input: string) {
  const { answer, normalizedAnswer } = normalizeAnswer(input);

  return answer.length > 0 && normalizedAnswer.length > 0 && CONTENT_ANSWER_PATTERN.test(answer);
}

const NORMALIZED_ANSWER_PATTERN = /^[A-ZÅÄÖ]+$/u;

export function normalizeNormalizedAnswerInput(input: string) {
  return input
    .trim()
    .normalize('NFC')
    .toLocaleUpperCase('sv-SE')
    .replace(REMOVABLE_CHARS_PATTERN, '');
}

export function isValidNormalizedAnswer(input: string) {
  const normalized = normalizeNormalizedAnswerInput(input);
  return normalized.length > 0 && NORMALIZED_ANSWER_PATTERN.test(normalized);
}

export function slugifyThemeName(input: string) {
  return input
    .trim()
    .normalize('NFC')
    .toLocaleLowerCase('sv-SE')
    .replace(/['’]/g, '')
    .replace(THEME_SLUG_SEPARATOR_PATTERN, '-')
    .replace(THEME_SLUG_INVALID_PATTERN, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
