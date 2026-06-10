import type {
  ContentStatus,
  HintCandidateStatus,
  HintType,
  ImportBatchStatus,
  ImportBatchType,
} from "@prisma/client";

export const CONTENT_STATUSES: ContentStatus[] = [
  "DRAFT",
  "APPROVED",
  "REJECTED",
];

export const HINT_CANDIDATE_STATUSES: HintCandidateStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
];

export const HINT_TYPES: HintType[] = [
  "DEFINITION",
  "SYNONYM",
  "ASSOCIATION",
  "WORDPLAY",
  "THEME",
  "OTHER",
];

/** Types shown in admin dropdowns (legacy THEME values still display via labels). */
export const HINT_TYPE_SELECT_OPTIONS = [
  "DEFINITION",
  "ASSOCIATION",
  "SYNONYM",
  "WORDPLAY",
  "OTHER",
] as const satisfies readonly HintType[];

export const DEFAULT_HINT_TYPE: HintType = "OTHER";

export const HINT_DIFFICULTY_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Enkel",
  2: "Lätt",
  3: "Medel",
  4: "Svår",
  5: "Mycket svår",
};

export const HINT_DIFFICULTY_OPTIONS = [
  { value: "", label: "Ej satt" },
  ...([1, 2, 3, 4, 5] as const).map((value) => ({
    value: String(value),
    label: `${value} — ${HINT_DIFFICULTY_LABELS[value]}`,
  })),
] as const;

export function formatHintDifficulty(difficulty: number | null | undefined) {
  if (difficulty == null) {
    return "Ej satt";
  }

  const label = HINT_DIFFICULTY_LABELS[difficulty as 1 | 2 | 3 | 4 | 5];
  return label ? `${difficulty} — ${label}` : String(difficulty);
}

export const HINT_TONES = [
  "NEUTRAL",
  "FACTUAL",
  "PLAYFUL",
  "POETIC",
  "HUMOROUS",
  "TRICKY",
  "FORMAL",
  "OTHER",
] as const;

export type HintTone = (typeof HINT_TONES)[number];

export const DEFAULT_HINT_TONE: HintTone = "NEUTRAL";

export const HINT_TONE_LABELS: Record<HintTone, string> = {
  NEUTRAL: "Neutral",
  FACTUAL: "Faktabaserad",
  PLAYFUL: "Lekfull",
  POETIC: "Poetisk",
  HUMOROUS: "Humoristisk",
  TRICKY: "Klurig",
  FORMAL: "Formell",
  OTHER: "Övrig",
};

export function formatHintTone(tone: string | null | undefined) {
  if (!tone) {
    return HINT_TONE_LABELS[DEFAULT_HINT_TONE];
  }

  if (tone in HINT_TONE_LABELS) {
    return HINT_TONE_LABELS[tone as HintTone];
  }

  return tone;
}

export const IMPORT_BATCH_STATUSES: ImportBatchStatus[] = [
  "PENDING",
  "COMPLETED",
  "FAILED",
];

export const IMPORT_BATCH_TYPES: ImportBatchType[] = [
  "WORDS",
  "HINTS",
  "WORDS_AND_HINTS",
];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: "Utkast",
  APPROVED: "Godkänd",
  REJECTED: "Avvisad",
};

export const HINT_CANDIDATE_STATUS_LABELS: Record<HintCandidateStatus, string> = {
  PENDING: "Väntar på granskning",
  APPROVED: "Godkänd",
  REJECTED: "Avvisad",
};

export const HINT_TYPE_LABELS: Record<HintType, string> = {
  DEFINITION: "Definition",
  SYNONYM: "Synonym",
  ASSOCIATION: "Association",
  WORDPLAY: "Ordlek",
  THEME: "Tema",
  OTHER: "Övrigt",
};

export const IMPORT_BATCH_TYPE_LABELS: Record<ImportBatchType, string> = {
  WORDS: "Ord",
  HINTS: "Nycklar",
  WORDS_AND_HINTS: "Ord + nycklar",
};
