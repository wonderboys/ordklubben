import type { HintFormat, HintType } from "@prisma/client";
import {
  DEFAULT_HINT_FORMAT,
  DEFAULT_HINT_TONE,
  DEFAULT_HINT_TYPE,
  HINT_TONES,
} from "@/lib/content/constants";

const HINT_TYPE_INPUT_ALIASES: Record<string, HintType> = {
  DEFINITION: "DEFINITION",
  PARAPHRASE: "PARAPHRASE",
  OMSKRIVNING: "PARAPHRASE",
  ASSOCIATION: "ASSOCIATION",
  SYNONYM: "SYNONYM",
  WORDPLAY: "WORDPLAY",
  ORDLEK: "WORDPLAY",
  EXAMPLE: "EXAMPLE",
  EXEMPEL: "EXAMPLE",
  THEME: "THEME",
  TEMA: "THEME",
  OTHER: "PARAPHRASE",
  ÖVRIGT: "PARAPHRASE",
};

const HINT_FORMAT_INPUT_ALIASES: Record<string, HintFormat> = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  BILD: "IMAGE",
  AUDIO: "AUDIO",
  LJUD: "AUDIO",
  EMOJI: "EMOJI",
  HYBRID: "HYBRID",
};

export function parseHintTypeInput(value: string): HintType {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return DEFAULT_HINT_TYPE;
  }

  const normalized = trimmed.toLocaleUpperCase("sv-SE");
  return HINT_TYPE_INPUT_ALIASES[normalized] ?? DEFAULT_HINT_TYPE;
}

export function parseHintFormatInput(value: string): HintFormat {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return DEFAULT_HINT_FORMAT;
  }

  const normalized = trimmed.toLocaleUpperCase("sv-SE");
  return HINT_FORMAT_INPUT_ALIASES[normalized] ?? DEFAULT_HINT_FORMAT;
}

export function resolveHintType(type: HintType | null | undefined): HintType {
  if (!type) {
    return DEFAULT_HINT_TYPE;
  }

  if (type === "OTHER") {
    return "PARAPHRASE";
  }

  return type;
}

export function resolveHintFormat(format: HintFormat | null | undefined): HintFormat {
  return format ?? DEFAULT_HINT_FORMAT;
}

export function resolveHintDifficulty(
  difficulty: number | null | undefined,
): number | null {
  return difficulty ?? null;
}

export function resolveHintTone(tone: string | null | undefined) {
  if (!tone) {
    return DEFAULT_HINT_TONE;
  }

  if ((HINT_TONES as readonly string[]).includes(tone)) {
    return tone as (typeof HINT_TONES)[number];
  }

  return DEFAULT_HINT_TONE;
}

export function normalizeApprovedHintMetadata(input: {
  type?: HintType | null;
  format?: HintFormat | null;
  difficulty?: number | null;
  tone?: string | null;
}) {
  return {
    type: resolveHintType(input.type),
    format: resolveHintFormat(input.format),
    difficulty: resolveHintDifficulty(input.difficulty),
    tone: resolveHintTone(input.tone),
  };
}

export function normalizeHintSource(
  source: string | null | undefined,
  fallback: HintSourceFallback = "manual",
): string {
  if (!source || source.trim().length === 0) {
    return fallback;
  }

  if (source === "manual_candidate") {
    return "manual";
  }

  if (source === "admin_csv") {
    return "import";
  }

  return source.trim();
}

type HintSourceFallback = "manual" | "import" | "mock_generator" | "system";
