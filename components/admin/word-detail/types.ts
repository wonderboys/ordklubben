import type {
  ContentStatus,
  HintCandidateStatus,
  HintFormat,
  HintType,
  LexicalEntryType,
  PartOfSpeech,
} from "@prisma/client";

export type WordDetailHint = {
  id: string;
  text: string;
  type: HintType;
  format: HintFormat;
  status: ContentStatus;
  difficulty: number | null;
  tone: string | null;
  source: string | null;
  notes: string | null;
  createdAt: Date;
};

export type WordDetailCandidate = {
  id: string;
  text: string;
  type: HintType;
  format: HintFormat;
  status: HintCandidateStatus;
  source: string;
  difficulty: number | null;
  tone: string | null;
  notes: string | null;
  approvedHintId: string | null;
  createdAt: Date;
};

export type WordDetailThemeLink = {
  theme: {
    id: string;
    name: string;
    slug: string;
    wordCount: number;
  };
};

export type WordDetailLexicalEntry = {
  id: string;
  type: LexicalEntryType;
  value: string;
  source: string;
  sourceReference: string | null;
  linkedWordId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WordDetailRelationCounts = {
  hints: number;
  hintCandidates: number;
  themes: number;
  puzzleEntries: number;
  lexicalEntries: number;
};

export type WordDetailData = {
  id: string;
  answer: string;
  normalizedAnswer: string;
  length: number;
  language: string;
  status: ContentStatus;
  source: string;
  sourceReference: string | null;
  partOfSpeech: PartOfSpeech | null;
  difficulty: number | null;
  crosswordScore: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  hints: WordDetailHint[];
  hintCandidates: WordDetailCandidate[];
  themes: WordDetailThemeLink[];
  lexicalEntries: WordDetailLexicalEntry[];
  relationCounts: WordDetailRelationCounts;
};

export type AvailableTheme = {
  id: string;
  name: string;
  slug: string;
};
