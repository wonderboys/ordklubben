import { z } from 'zod';
import type { MediaSuggestionDraft } from '@/lib/content/ai/types';

export class AiMediaGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiMediaGenerationError';
  }
}

const aiMediaSuggestionSchema = z.object({
  title: z.string().min(3).max(200),
  altText: z.string().min(3).max(300),
  prompt: z.string().min(10).max(1000),
  notes: z.string().max(500).optional(),
});

const aiResponseSchema = z.object({
  title: z.string().min(3).max(200),
  altText: z.string().min(3).max(300),
  prompt: z.string().min(10).max(1000),
  notes: z.string().max(500).optional(),
});

export function parseMediaSuggestionResponse(options: {
  rawContent: string;
  answer: string;
}): MediaSuggestionDraft {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(options.rawContent);
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ai-media-suggestion] Ogiltig JSON:', options.rawContent);
    }

    throw new AiMediaGenerationError('AI returnerade ogiltig JSON. Inget mediaförslag skapades.');
  }

  const parsed = aiResponseSchema.safeParse(parsedJson);

  if (!parsed.success) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ai-media-suggestion] JSON validerades inte:', parsed.error);
      console.error('[ai-media-suggestion] Råsvar:', options.rawContent);
    }

    throw new AiMediaGenerationError(
      'AI returnerade ett ogiltigt svar. Inget mediaförslag skapades.',
    );
  }

  const normalized = aiMediaSuggestionSchema.parse(parsed.data);

  return {
    title: normalized.title.trim(),
    altText: normalized.altText.trim(),
    prompt: normalized.prompt.trim(),
    notes: normalized.notes?.trim() || undefined,
  };
}
