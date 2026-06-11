import type { HintType } from "@prisma/client";

export type HintCandidateSkipReason =
  | "duplicate_type"
  | "text_too_short"
  | "reveals_answer"
  | "generic_clue"
  | "blocked_pattern"
  | "too_long"
  | "sentence_like"
  | "invalid_defaults"
  | "duplicate_existing";

export type SkippedHintCandidate = {
  text: string;
  type?: HintType;
  reason: HintCandidateSkipReason;
};

const SKIP_REASON_LABELS: Record<HintCandidateSkipReason, string> = {
  duplicate_type: "dubblett av typ",
  text_too_short: "för kort text",
  reveals_answer: "avslöjar svaret",
  generic_clue: "generisk mall",
  blocked_pattern: "otillåten formulering",
  too_long: "för lång ledtråd",
  sentence_like: "hel mening",
  invalid_defaults: "ogiltig metadata",
  duplicate_existing: "finns redan",
};

export function formatHintCandidateSkipReason(reason: HintCandidateSkipReason): string {
  return SKIP_REASON_LABELS[reason];
}

export function logSkippedHintCandidates(
  context: string,
  answer: string,
  skipped: SkippedHintCandidate[],
) {
  if (process.env.NODE_ENV !== "development" || skipped.length === 0) {
    return;
  }

  console.info(`[ai-hint-candidates] ${context} för "${answer}":`);

  for (const item of skipped) {
    const typeLabel = item.type ?? "?";
    const reasonLabel = formatHintCandidateSkipReason(item.reason);
    console.info(`  - [${typeLabel}] "${item.text}" → ${reasonLabel}`);
  }
}
