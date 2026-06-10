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
  PUZZLE_DIRECTIONS,
  PUZZLE_STATUSES,
  PUZZLE_TYPE_SELECT_OPTIONS,
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

function bulkWordIdsField() {
  return z
    .array(z.string().min(1))
    .min(1, "Välj minst ett ord.");
}

export const bulkWordActionSchema = z.object({
  wordIds: bulkWordIdsField(),
  returnTo: optionalTextField(),
});

export const bulkWordThemeActionSchema = z.object({
  wordIds: bulkWordIdsField(),
  themeId: requiredTextField("Tema-ID"),
  returnTo: optionalTextField(),
});

function requiredPositiveIntegerField(label: string, max?: number) {
  return z.preprocess((value) => {
    if (typeof value === "number") {
      return value;
    }

    return Number.parseInt(String(value), 10);
  }, z
    .number()
    .int(`${label} måste vara ett heltal.`)
    .min(1, `${label} måste vara minst 1.`)
    .max(max ?? 30, `${label} får vara högst ${max ?? 30}.`));
}

function optionalPositiveIntegerField(label: string) {
  return z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) {
      return undefined;
    }

    if (typeof normalized === "number") {
      return normalized;
    }

    return Number.parseInt(String(normalized), 10);
  }, z.number().int(`${label} måste vara ett heltal.`).min(1).optional());
}

function optionalDateField() {
  return z.preprocess(emptyToUndefined, z.string().optional());
}

function checkboxField() {
  return z.preprocess((value) => value === "on" || value === true, z.boolean());
}

export const createPuzzleSchema = z.object({
  title: requiredTextField("Titel"),
  type: z.enum(PUZZLE_TYPE_SELECT_OPTIONS),
  status: z.enum(PUZZLE_STATUSES),
  width: requiredPositiveIntegerField("Bredd", 30),
  height: requiredPositiveIntegerField("Höjd", 30),
  description: optionalTextField(),
  slug: optionalTextField(),
  publishDate: optionalDateField(),
});

export const createGeneratedPuzzleSchema = z.object({
  title: requiredTextField("Titel"),
  themeId: optionalTextField(),
  width: requiredPositiveIntegerField("Bredd", 30),
  height: requiredPositiveIntegerField("Höjd", 30),
  difficulty: requiredPositiveIntegerField("Svårighet", 3),
  allowDraftWords: checkboxField(),
  allowDraftHints: checkboxField(),
  status: z.enum(PUZZLE_STATUSES),
  publishDate: optionalDateField(),
});

export type CreateGeneratedPuzzleInput = z.infer<typeof createGeneratedPuzzleSchema>;

export const addPuzzleEntrySchema = z.object({
  puzzleId: requiredTextField("Pussel-ID"),
  wordId: requiredTextField("Ord-ID"),
  hintId: optionalTextField(),
  row: z.preprocess((value) => Number.parseInt(String(value), 10), z.number().int().min(0)),
  col: z.preprocess((value) => Number.parseInt(String(value), 10), z.number().int().min(0)),
  direction: z.enum(PUZZLE_DIRECTIONS),
  number: optionalPositiveIntegerField("Nummer"),
});

export const removePuzzleEntrySchema = z.object({
  puzzleId: requiredTextField("Pussel-ID"),
  entryId: requiredTextField("Placerings-ID"),
});

export const updatePuzzleEntryHintSchema = z.object({
  puzzleId: requiredTextField("Pussel-ID"),
  entryId: requiredTextField("Placerings-ID"),
  hintId: optionalTextField(),
});

export const togglePuzzleBlockedCellSchema = z.object({
  puzzleId: requiredTextField("Pussel-ID"),
  row: z.preprocess((value) => Number.parseInt(String(value), 10), z.number().int().min(0)),
  col: z.preprocess((value) => Number.parseInt(String(value), 10), z.number().int().min(0)),
});
