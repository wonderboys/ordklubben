import { z } from 'zod';
import type { HintType } from '@prisma/client';
import { applyHintCandidateDefaults } from '@/lib/content/ai/hint-candidate-defaults';
import { getClueTextSkipReason } from '@/lib/content/ai/filter-hint-candidate-drafts';
import {
  logSkippedHintCandidates,
  type SkippedHintCandidate,
} from '@/lib/content/ai/hint-candidate-skip-log';
import type { HintCandidateDraft } from '@/lib/content/ai/types';
import { trimHintText } from '@/lib/content/normalize-hint';

export class AiHintGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiHintGenerationError';
  }
}

const AI_HINT_TYPES = [
  'DEFINITION',
  'PARAPHRASE',
  'ASSOCIATION',
  'SYNONYM',
  'WORDPLAY',
  'EXAMPLE',
] as const satisfies readonly HintType[];

const aiHintCandidateSchema = z.object({
  type: z.enum(AI_HINT_TYPES),
  text: z.string().min(3).max(180),
});

const aiResponseSchema = z.object({
  candidates: z.array(aiHintCandidateSchema).max(6),
});

export type ParseHintCandidatesResult = {
  candidates: HintCandidateDraft[];
  rawFromAi: number;
  skippedInvalid: number;
  skipped: SkippedHintCandidate[];
};

export function parseHintCandidatesResponse(options: {
  rawContent: string;
  answer: string;
  model: string;
  promptVersion: string;
}): ParseHintCandidatesResult {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(options.rawContent);
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ai-hint-candidates] Ogiltig JSON:', options.rawContent);
    }

    throw new AiHintGenerationError('AI returnerade ogiltig JSON. Inga förslag skapades.');
  }

  const parsed = aiResponseSchema.safeParse(parsedJson);

  if (!parsed.success) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ai-hint-candidates] JSON validerades inte:', parsed.error);
      console.error('[ai-hint-candidates] Råsvar:', options.rawContent);
    }

    throw new AiHintGenerationError('AI returnerade ett ogiltigt svar. Inga förslag skapades.');
  }

  const drafts: HintCandidateDraft[] = [];
  const skipped: SkippedHintCandidate[] = [];
  const usedTypes = new Set<HintType>();

  for (const candidate of parsed.data.candidates) {
    if (usedTypes.has(candidate.type)) {
      skipped.push({
        text: candidate.text,
        type: candidate.type,
        reason: 'duplicate_type',
      });
      continue;
    }

    const text = trimHintText(candidate.text);
    const skipReason = getClueTextSkipReason(text, options.answer);

    if (skipReason) {
      skipped.push({
        text,
        type: candidate.type,
        reason: skipReason,
      });
      continue;
    }

    const draft = applyHintCandidateDefaults(candidate.type, text, {
      model: options.model,
      promptVersion: options.promptVersion,
    });

    if (!draft) {
      skipped.push({
        text,
        type: candidate.type,
        reason: 'invalid_defaults',
      });
      continue;
    }

    usedTypes.add(candidate.type);
    drafts.push(draft);
  }

  logSkippedHintCandidates('Filtrerade AI-förslag', options.answer, skipped);

  return {
    candidates: drafts,
    rawFromAi: parsed.data.candidates.length,
    skippedInvalid: skipped.length,
    skipped,
  };
}
