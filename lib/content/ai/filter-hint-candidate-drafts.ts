import type {
  HintCandidateSkipReason,
  SkippedHintCandidate,
} from "@/lib/content/ai/hint-candidate-skip-log";
import type { HintCandidateDraft } from "@/lib/content/ai/types";
import { normalizeHintText } from "@/lib/content/normalize-hint";

const MAX_CLUE_WORDS = 8;

const GENERIC_CLUE_PATTERNS = [
  /en typ av/i,
  /en form av/i,
  /en sort av/i,
  /en variant av/i,
  /i kort ledtråd/i,
  /kan förknippas med/i,
  /en möjlig nyckel för/i,
  /nära betydelse till/i,
  /ordlek kring/i,
] as const;

const BLOCKED_CLUE_PATTERNS = [
  /^hästar som/i,
  /^rör sig/i,
  /^rör på sig/i,
  /^rör sig som/i,
  /^det är en/i,
  /^detta är en/i,
  /^används (för|till|vid)/i,
  /^kan användas/i,
] as const;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function isSentenceLikeClueText(text: string): boolean {
  const trimmed = text.trim();

  if (/[.!?]$/.test(trimmed)) {
    return true;
  }

  if (trimmed.includes(",") && countWords(trimmed) > 5) {
    return true;
  }

  return false;
}

export function isTooLongClueText(text: string): boolean {
  return countWords(text) > MAX_CLUE_WORDS;
}

export function isBlockedClueText(text: string): boolean {
  return BLOCKED_CLUE_PATTERNS.some((pattern) => pattern.test(text));
}

export function isGenericClueText(text: string, answer: string): boolean {
  const normalizedAnswer = answer
    .trim()
    .normalize("NFC")
    .replace(/[\s'’\-‐‑‒–—]+/g, "")
    .toLocaleLowerCase("sv-SE");

  if (GENERIC_CLUE_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  if (normalizedAnswer.length > 0) {
    const answerUpper = normalizedAnswer.toLocaleUpperCase("sv-SE");
    if (text.toLocaleUpperCase("sv-SE").includes(answerUpper)) {
      return true;
    }
  }

  return false;
}

export function getClueTextSkipReason(
  text: string,
  answer: string,
): HintCandidateSkipReason | null {
  if (text.length < 3) {
    return "text_too_short";
  }

  if (clueRevealsAnswer(text, answer)) {
    return "reveals_answer";
  }

  if (isGenericClueText(text, answer)) {
    return "generic_clue";
  }

  if (isBlockedClueText(text)) {
    return "blocked_pattern";
  }

  if (isTooLongClueText(text)) {
    return "too_long";
  }

  if (isSentenceLikeClueText(text)) {
    return "sentence_like";
  }

  return null;
}

export function partitionDuplicateHintCandidateDrafts(
  candidates: HintCandidateDraft[],
  existingNormalizedTexts: Iterable<string>,
): {
  accepted: HintCandidateDraft[];
  skipped: SkippedHintCandidate[];
} {
  const seen = new Set(existingNormalizedTexts);
  const accepted: HintCandidateDraft[] = [];
  const skipped: SkippedHintCandidate[] = [];

  for (const candidate of candidates) {
    const normalized = normalizeHintText(candidate.text);

    if (seen.has(normalized)) {
      skipped.push({
        text: candidate.text,
        type: candidate.type,
        reason: "duplicate_existing",
      });
      continue;
    }

    seen.add(normalized);
    accepted.push(candidate);
  }

  return { accepted, skipped };
}

export function filterDuplicateHintCandidateDrafts(
  candidates: HintCandidateDraft[],
  existingNormalizedTexts: Iterable<string>,
): HintCandidateDraft[] {
  return partitionDuplicateHintCandidateDrafts(candidates, existingNormalizedTexts)
    .accepted;
}

export function clueRevealsAnswer(clueText: string, answer: string): boolean {
  const normalizedClue = normalizeHintText(clueText);
  const normalizedAnswer = answer
    .trim()
    .normalize("NFC")
    .replace(/[\s'’\-‐‑‒–—]+/g, "")
    .toLocaleLowerCase("sv-SE");

  if (normalizedAnswer.length === 0) {
    return false;
  }

  return normalizedClue.includes(normalizedAnswer);
}
