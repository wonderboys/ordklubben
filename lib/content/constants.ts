import type {
  ContentStatus,
  GrammaticalGender,
  HintCandidateStatus,
  HintType,
  ImportBatchStatus,
  ImportBatchType,
  LexicalEntryType,
  MediaType,
  PartOfSpeech,
  PuzzleDirection,
  PuzzleStatus,
  PuzzleType,
  WordRelationType,
} from "@prisma/client";

export const CONTENT_STATUSES: ContentStatus[] = [
  "DRAFT",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
];

/** Generic provenance for Word and WordLexicalEntry. Use sourceReference for import file names. */
export const WORD_SOURCES = [
  "manual",
  "import",
  "ai",
  "saol",
  "saldo",
  "synlex",
  "system",
] as const;

export type WordSource = (typeof WORD_SOURCES)[number];

export const WORD_SOURCE_LABELS: Record<WordSource, string> = {
  manual: "Manuell",
  import: "Import",
  ai: "AI",
  saol: "SAOL",
  saldo: "SALDO",
  synlex: "SYNLEX",
  system: "System",
};

export function formatWordSource(source: string | null | undefined) {
  if (!source) {
    return WORD_SOURCE_LABELS.manual;
  }

  if (source in WORD_SOURCE_LABELS) {
    return WORD_SOURCE_LABELS[source as WordSource];
  }

  return source;
}

export function formatWordSourceWithReference(
  source: string | null | undefined,
  sourceReference?: string | null,
) {
  const label = formatWordSource(source);

  if (sourceReference?.trim()) {
    return `${label} · ${sourceReference.trim()}`;
  }

  return label;
}

export const PART_OF_SPEECH_VALUES: PartOfSpeech[] = [
  "SUBSTANTIV",
  "VERB",
  "ADJEKTIV",
  "ADVERB",
  "PRONOMEN",
  "RAKNEORD",
  "INTERJEKTION",
  "FORKORTNING",
  "OVRIGT",
];

export const PART_OF_SPEECH_LABELS: Record<PartOfSpeech, string> = {
  SUBSTANTIV: "Substantiv",
  VERB: "Verb",
  ADJEKTIV: "Adjektiv",
  ADVERB: "Adverb",
  PRONOMEN: "Pronomen",
  RAKNEORD: "Räkneord",
  INTERJEKTION: "Interjektion",
  FORKORTNING: "Förkortning",
  OVRIGT: "Övrigt",
};

export function formatPartOfSpeech(value: PartOfSpeech | null | undefined) {
  if (!value) {
    return "—";
  }

  return PART_OF_SPEECH_LABELS[value];
}

export const GRAMMATICAL_GENDERS: GrammaticalGender[] = ["EN", "ETT"];

export const GRAMMATICAL_GENDER_LABELS: Record<GrammaticalGender, string> = {
  EN: "En (utrum)",
  ETT: "Ett (neutrum)",
};

export function formatGrammaticalGender(value: GrammaticalGender | null | undefined) {
  if (!value) {
    return "—";
  }

  return GRAMMATICAL_GENDER_LABELS[value];
}

export const WORD_RELATION_TYPES: WordRelationType[] = [
  "SYNONYM",
  "ANTONYM",
  "RELATED",
  "COMPOSED_OF",
  "PART_OF",
];

export const WORD_RELATION_TYPE_LABELS: Record<WordRelationType, string> = {
  SYNONYM: "Synonym",
  ANTONYM: "Antonym",
  RELATED: "Relaterat",
  COMPOSED_OF: "Sammansatt av",
  PART_OF: "Del av",
};

export function formatWordRelationType(type: WordRelationType) {
  return WORD_RELATION_TYPE_LABELS[type];
}

/** Lexical entry types — meaning and relations, not playable hints. */
export const LEXICAL_ENTRY_TYPES: LexicalEntryType[] = [
  "DEFINITION",
  "SYNONYM",
  "ANTONYM",
  "EXPRESSION",
  "RELATED",
];

export const LEXICAL_ENTRY_TYPE_LABELS: Record<LexicalEntryType, string> = {
  DEFINITION: "Definition",
  SYNONYM: "Synonym",
  ANTONYM: "Antonym",
  EXPRESSION: "Uttryck",
  RELATED: "Relaterat",
};

export function formatLexicalEntryType(type: LexicalEntryType) {
  return LEXICAL_ENTRY_TYPE_LABELS[type];
}

export const MEDIA_TYPES: MediaType[] = ["IMAGE", "AUDIO", "VIDEO"];

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  IMAGE: "Bild",
  AUDIO: "Ljud",
  VIDEO: "Video",
};

export function formatMediaType(type: MediaType) {
  return MEDIA_TYPE_LABELS[type];
}

export const HINT_CANDIDATE_STATUSES: HintCandidateStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
];

/** All values stored in the database (includes legacy THEME and OTHER). */
export const HINT_TYPES: HintType[] = [
  "DEFINITION",
  "PARAPHRASE",
  "ASSOCIATION",
  "SYNONYM",
  "WORDPLAY",
  "EXAMPLE",
  "THEME",
  "OTHER",
];

/** Types shown in admin dropdowns. */
export const HINT_TYPE_SELECT_OPTIONS = [
  "DEFINITION",
  "PARAPHRASE",
  "ASSOCIATION",
  "SYNONYM",
  "WORDPLAY",
  "EXAMPLE",
] as const satisfies readonly HintType[];

export const DEFAULT_HINT_TYPE: HintType = "DEFINITION";

export function isSelectableHintType(
  type: HintType,
): type is (typeof HINT_TYPE_SELECT_OPTIONS)[number] {
  return (HINT_TYPE_SELECT_OPTIONS as readonly string[]).includes(type);
}

export const HINT_SOURCES = [
  "manual",
  "ai",
  "import",
  "mock_generator",
  "community",
  "system",
] as const;

export type HintSource = (typeof HINT_SOURCES)[number];

export const HINT_SOURCE_LABELS: Record<HintSource, string> = {
  manual: "Manuell",
  ai: "AI",
  import: "Import",
  mock_generator: "Mock-generator",
  community: "Community",
  system: "System",
};

export function formatHintSource(source: string | null | undefined) {
  if (!source) {
    return HINT_SOURCE_LABELS.manual;
  }

  if (source in HINT_SOURCE_LABELS) {
    return HINT_SOURCE_LABELS[source as HintSource];
  }

  if (source === "manual_candidate") {
    return HINT_SOURCE_LABELS.manual;
  }

  if (source === "admin_csv") {
    return HINT_SOURCE_LABELS.import;
  }

  return source;
}

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
  "LEXICON",
];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: "Utkast",
  APPROVED: "Godkänd",
  REJECTED: "Avvisad",
  ARCHIVED: "Arkiverad",
};

export const HINT_CANDIDATE_STATUS_LABELS: Record<HintCandidateStatus, string> = {
  PENDING: "Väntar på granskning",
  APPROVED: "Godkänd",
  REJECTED: "Avvisad",
};

export const HINT_TYPE_LABELS: Record<HintType, string> = {
  DEFINITION: "Definition",
  PARAPHRASE: "Omskrivning",
  ASSOCIATION: "Association",
  SYNONYM: "Synonym",
  WORDPLAY: "Ordlek",
  EXAMPLE: "Exempel",
  THEME: "Tema",
  OTHER: "Övrigt",
};

export function formatHintType(type: HintType) {
  return HINT_TYPE_LABELS[type];
}

export const IMPORT_BATCH_TYPE_LABELS: Record<ImportBatchType, string> = {
  WORDS: "Ord",
  HINTS: "Nycklar",
  WORDS_AND_HINTS: "Ord + nycklar",
  LEXICON: "Lexikon",
};

export const PUZZLE_TYPES: PuzzleType[] = [
  "WORD_GRID",
  "DAILY_WORD",
  "STEPWISE",
  "CROSSWORD",
];

export const PUZZLE_TYPE_SELECT_OPTIONS = ["WORD_GRID"] as const satisfies readonly PuzzleType[];

export const PUZZLE_STATUSES: PuzzleStatus[] = [
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ARCHIVED",
];

export const PUZZLE_DIRECTIONS: PuzzleDirection[] = ["ACROSS", "DOWN"];

export const PUZZLE_TYPE_LABELS: Record<PuzzleType, string> = {
  WORD_GRID: "Ordfläta",
  DAILY_WORD: "Dagens ord",
  STEPWISE: "Stegvis",
  CROSSWORD: "Korsord",
};

export const PUZZLE_STATUS_LABELS: Record<PuzzleStatus, string> = {
  DRAFT: "Utkast",
  REVIEW: "Granskning",
  PUBLISHED: "Publicerad",
  ARCHIVED: "Arkiverad",
};

export const PUZZLE_DIRECTION_LABELS: Record<PuzzleDirection, string> = {
  ACROSS: "Vågrätt",
  DOWN: "Lodrätt",
};

export const PUZZLE_GENERATION_DIFFICULTIES = [1, 2, 3] as const;

export const PUZZLE_GENERATION_DIFFICULTY_LABELS: Record<
  (typeof PUZZLE_GENERATION_DIFFICULTIES)[number],
  string
> = {
  1: "Lätt",
  2: "Medel",
  3: "Svår",
};
