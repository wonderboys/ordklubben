import type { HintType } from "@prisma/client";
import {
  DEFAULT_HINT_TONE,
  DEFAULT_HINT_TYPE,
  HINT_TONES,
  type HintTone,
} from "@/lib/content/constants";

export function resolveHintType(type: HintType | null | undefined): HintType {
  return type ?? DEFAULT_HINT_TYPE;
}

export function resolveHintDifficulty(
  difficulty: number | null | undefined,
): number | null {
  return difficulty ?? null;
}

export function resolveHintTone(tone: string | null | undefined): HintTone {
  if (!tone) {
    return DEFAULT_HINT_TONE;
  }

  if ((HINT_TONES as readonly string[]).includes(tone)) {
    return tone as HintTone;
  }

  return DEFAULT_HINT_TONE;
}

export function normalizeApprovedHintMetadata(input: {
  type?: HintType | null;
  difficulty?: number | null;
  tone?: string | null;
}) {
  return {
    type: resolveHintType(input.type),
    difficulty: resolveHintDifficulty(input.difficulty),
    tone: resolveHintTone(input.tone),
  };
}
