import { z } from "zod";
import type { HintType } from "@prisma/client";
import {
  CONTENT_STATUSES,
  DEFAULT_HINT_TONE,
  DEFAULT_HINT_TYPE,
  HINT_TONES,
  HINT_TYPE_SELECT_OPTIONS,
  HINT_TYPES,
  IMPORT_BATCH_TYPES,
} from "@/lib/content/constants";

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function optionalIntegerField(label: string) {
  return z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) {
      return undefined;
    }

    if (typeof normalized === "number") {
      return normalized;
    }

    return Number.parseInt(String(normalized), 10);
  }, z.number().int(`${label} måste vara ett heltal.`).min(0, `${label} kan inte vara negativt.`).optional());
}

function optionalHintDifficultyField() {
  return z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) {
      return undefined;
    }

    if (typeof normalized === "number") {
      return normalized;
    }

    return Number.parseInt(String(normalized), 10);
  }, z.number().int("Svårighet måste vara ett heltal.").min(1).max(5).optional());
}

function optionalHintTypeField() {
  const hintTypeValues = [...HINT_TYPE_SELECT_OPTIONS, "THEME"] as [
    HintType,
    ...HintType[],
  ];

  return z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    return normalized ?? DEFAULT_HINT_TYPE;
  }, z.enum(hintTypeValues));
}

function optionalHintToneField() {
  return z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) {
      return DEFAULT_HINT_TONE;
    }

    return normalized;
  }, z.enum(HINT_TONES));
}

function optionalTextField() {
  return z.preprocess(emptyToUndefined, z.string().optional());
}

function requiredTextField(label: string) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().min(1, `${label} är obligatoriskt.`),
  );
}

export const createWordSchema = z.object({
  answer: requiredTextField("Ord"),
  status: z.enum(CONTENT_STATUSES),
  difficulty: optionalIntegerField("Svårighet"),
  notes: optionalTextField(),
});

export const updateWordSchema = z.object({
  id: requiredTextField("Ord-ID"),
  status: z.enum(CONTENT_STATUSES),
  difficulty: optionalIntegerField("Svårighet"),
  crosswordScore: optionalIntegerField("Korsordspoäng"),
  notes: optionalTextField(),
});

export const createHintSchema = z.object({
  wordId: requiredTextField("Ord-ID"),
  text: requiredTextField("Nyckeltext"),
  type: z.enum(HINT_TYPES),
  status: z.enum(CONTENT_STATUSES),
  difficulty: optionalIntegerField("Svårighet"),
  tone: optionalTextField(),
  source: optionalTextField(),
  notes: optionalTextField(),
});

export const updateHintStatusSchema = z.object({
  wordId: requiredTextField("Ord-ID"),
  hintId: requiredTextField("Nyckel-ID"),
  status: z.enum(CONTENT_STATUSES),
});

export const createThemeSchema = z.object({
  name: requiredTextField("Namn"),
  slug: optionalTextField(),
  description: optionalTextField(),
});

export const importContentSchema = z.object({
  importType: z.enum(IMPORT_BATCH_TYPES),
  wordStatus: z.enum(["DRAFT", "APPROVED"]),
  hintStatus: z.enum(["DRAFT", "APPROVED"]),
});

export const addThemeToWordSchema = z.object({
  wordId: requiredTextField("Ord-ID"),
  themeId: requiredTextField("Tema-ID"),
});

export const removeThemeFromWordSchema = z.object({
  wordId: requiredTextField("Ord-ID"),
  themeId: requiredTextField("Tema-ID"),
});

export const createHintCandidateSchema = z.object({
  wordId: requiredTextField("Ord-ID"),
  text: requiredTextField("Nyckeltext"),
  type: optionalHintTypeField(),
  difficulty: optionalHintDifficultyField(),
  tone: optionalHintToneField(),
  notes: optionalTextField(),
});

export const hintCandidateActionSchema = z.object({
  wordId: requiredTextField("Ord-ID"),
  candidateId: requiredTextField("Kandidat-ID"),
});

export const approveEditedHintCandidateSchema = z.object({
  wordId: requiredTextField("Ord-ID"),
  candidateId: requiredTextField("Kandidat-ID"),
  text: requiredTextField("Nyckeltext"),
  type: optionalHintTypeField(),
  difficulty: optionalHintDifficultyField(),
  tone: optionalHintToneField(),
});

export const generateMockHintCandidatesSchema = z.object({
  wordId: requiredTextField("Ord-ID"),
});
