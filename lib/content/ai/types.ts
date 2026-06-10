import type { HintType } from "@prisma/client";

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
};
