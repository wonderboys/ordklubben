import type {
  ContentStatus,
  HintCandidateStatus,
  HintType,
} from "@prisma/client";

export type WordDetailHint = {
  id: string;
  text: string;
  type: HintType;
  status: ContentStatus;
  difficulty: number | null;
  createdAt: Date;
};

export type WordDetailCandidate = {
  id: string;
  text: string;
  type: HintType;
  status: HintCandidateStatus;
  source: string;
  difficulty: number | null;
  tone: string | null;
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

export type WordDetailData = {
  id: string;
  answer: string;
  normalizedAnswer: string;
  length: number;
  language: string;
  status: ContentStatus;
  difficulty: number | null;
  crosswordScore: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  hints: WordDetailHint[];
  hintCandidates: WordDetailCandidate[];
  themes: WordDetailThemeLink[];
};

export type AvailableTheme = {
  id: string;
  name: string;
  slug: string;
};
