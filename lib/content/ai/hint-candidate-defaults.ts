import type { HintType } from '@prisma/client';
import type { HintTone } from '@/lib/content/constants';
import type { HintCandidateDraft } from '@/lib/content/ai/types';

const AI_SOURCE = 'ai';

const TYPE_METADATA: Record<
  'DEFINITION' | 'PARAPHRASE' | 'ASSOCIATION' | 'SYNONYM' | 'WORDPLAY' | 'EXAMPLE',
  { tone: HintTone; difficulty: number }
> = {
  DEFINITION: { tone: 'NEUTRAL', difficulty: 1 },
  PARAPHRASE: { tone: 'NEUTRAL', difficulty: 2 },
  ASSOCIATION: { tone: 'PLAYFUL', difficulty: 3 },
  SYNONYM: { tone: 'NEUTRAL', difficulty: 2 },
  WORDPLAY: { tone: 'TRICKY', difficulty: 4 },
  EXAMPLE: { tone: 'NEUTRAL', difficulty: 2 },
};

export function applyHintCandidateDefaults(
  type: HintType,
  text: string,
  options: {
    model: string;
    promptVersion: string;
  },
): HintCandidateDraft | null {
  if (!(type in TYPE_METADATA)) {
    return null;
  }

  const metadata = TYPE_METADATA[type as keyof typeof TYPE_METADATA];

  return {
    text,
    type,
    difficulty: metadata.difficulty,
    tone: metadata.tone,
    source: AI_SOURCE,
    model: options.model,
    promptVersion: options.promptVersion,
  };
}
