import type {
  ContentStatus,
  GrammaticalGender,
  HintCandidateStatus,
  HintType,
  LexicalEntryType,
  MediaType,
  PartOfSpeech,
  WordRelationType,
} from "@prisma/client";
import type { WordNounInflections } from "@/lib/content/word-language";

export type WordDetailLanguageData = {
  partOfSpeech: PartOfSpeech | null;
  gender: GrammaticalGender | null;
  lemma: string | null;
  pronunciation: string | null;
  inflections: WordNounInflections;
};

export type WordDetailHint = {
  id: string;
  text: string;
  type: HintType;
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

export type WordDetailRebusEntry = {
  id: string;
  value: string;
  difficulty: number | null;
  source: string;
  sourceReference: string | null;
  notes: string | null;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type WordDetailMediaAsset = {
  id: string;
  mediaType: MediaType;
  title: string | null;
  altText: string | null;
  prompt: string | null;
  source: string;
  sourceReference: string | null;
  attribution: string | null;
  license: string | null;
  notes: string | null;
  filePath: string | null;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type WordDetailRelation = {
  id: string;
  relationType: WordRelationType;
  source: string;
  sourceReference: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  targetWord: {
    id: string;
    answer: string;
  };
};

export type WordDetailRelationCounts = {
  hints: number;
  hintCandidates: number;
  themes: number;
  puzzleEntries: number;
  lexicalEntries: number;
  rebusEntries: number;
  mediaAssets: number;
  wordRelations: number;
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
  difficulty: number | null;
  crosswordScore: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  languageData: WordDetailLanguageData | null;
  hints: WordDetailHint[];
  hintCandidates: WordDetailCandidate[];
  themes: WordDetailThemeLink[];
  lexicalEntries: WordDetailLexicalEntry[];
  rebusEntries: WordDetailRebusEntry[];
  mediaAssets: WordDetailMediaAsset[];
  relations: WordDetailRelation[];
  relationCounts: WordDetailRelationCounts;
};

export type AvailableTheme = {
  id: string;
  name: string;
  slug: string;
};

export type WordPickerWord = {
  id: string;
  answer: string;
  length: number;
  status: ContentStatus;
};
