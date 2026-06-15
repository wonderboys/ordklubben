import type { HintType } from '@prisma/client';

export type HintCandidateDraft = {
  text: string;
  type: HintType;
  difficulty?: number;
  tone?: string;
  source: string;
  model?: string;
  promptVersion?: string;
  notes?: string;
};

export type GenerateHintCandidatesInput = {
  wordId: string;
  answer: string;
  normalizedAnswer: string;
  language: string;
};

export type GenerateHintCandidatesResult = {
  candidates: HintCandidateDraft[];
  model?: string;
  promptVersion?: string;
  stats?: {
    rawFromAi: number;
    accepted: number;
    skippedInvalid: number;
  };
};

export type MediaSuggestionDraft = {
  title: string;
  altText: string;
  prompt: string;
  notes?: string;
};

export type GenerateMediaSuggestionInput = {
  wordId: string;
  answer: string;
  normalizedAnswer: string;
  language: string;
};

export type GenerateMediaSuggestionResult = {
  suggestion: MediaSuggestionDraft;
  model?: string;
  promptVersion?: string;
};
