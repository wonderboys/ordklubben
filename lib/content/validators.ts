import { z } from 'zod';
import type { HintType } from '@prisma/client';
import {
  CONTENT_STATUSES,
  DEFAULT_HINT_TONE,
  DEFAULT_HINT_TYPE,
  HINT_TONES,
  HINT_TYPE_SELECT_OPTIONS,
  HINT_TYPES,
  IMPORT_BATCH_TYPES,
  LEXICAL_ENTRY_TYPES,
  MEDIA_TYPES,
  PART_OF_SPEECH_VALUES,
  PUZZLE_DIRECTIONS,
  PUZZLE_STATUSES,
  PUZZLE_TYPE_SELECT_OPTIONS,
  WORD_RELATION_TYPES,
  WORD_SOURCES,
  GRAMMATICAL_GENDERS,
} from '@/lib/content/constants';

function emptyToUndefined(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function optionalHintDifficultyField() {
  return z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) {
      return undefined;
    }

    if (typeof normalized === 'number') {
      return normalized;
    }

    return Number.parseInt(String(normalized), 10);
  }, z.number().int('Svårighet måste vara ett heltal.').min(1).max(5).optional());
}

function optionalHintTypeField() {
  const hintTypeValues = [...HINT_TYPE_SELECT_OPTIONS, 'THEME', 'OTHER'] as [
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

function optionalPartOfSpeechField() {
  return z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    return normalized ?? null;
  }, z.enum(PART_OF_SPEECH_VALUES).nullable());
}

function optionalGrammaticalGenderField() {
  return z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    return normalized ?? null;
  }, z.enum(GRAMMATICAL_GENDERS).nullable());
}

function requiredTextField(label: string) {
  return z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() : value),
    z.string().min(1, `${label} är obligatoriskt.`),
  );
}

export const createWordSchema = z.object({
  answer: requiredTextField('Ord'),
  status: z.enum(CONTENT_STATUSES),
  notes: optionalTextField(),
});

export const updateWordSchema = z.object({
  id: requiredTextField('Ord-ID'),
  answer: requiredTextField('Ord'),
  normalizedAnswer: requiredTextField('Normaliserat ord'),
  normalizeFromAnswer: checkboxField(),
  status: z.enum(CONTENT_STATUSES),
  language: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() ? value.trim() : 'sv'),
    z.string().min(2, 'Språk måste anges.'),
  ),
  source: z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    return normalized ?? 'manual';
  }, z.enum(WORD_SOURCES)),
  notes: optionalTextField(),
});

export const upsertWordLanguageDataSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  partOfSpeech: optionalPartOfSpeechField(),
  gender: optionalGrammaticalGenderField(),
  lemma: optionalTextField(),
  pronunciation: optionalTextField(),
  definiteSingular: optionalTextField(),
  indefinitePlural: optionalTextField(),
  definitePlural: optionalTextField(),
});

export const createWordRelationSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  targetWordId: requiredTextField('Målord-ID'),
  relationType: z.enum(WORD_RELATION_TYPES),
  source: z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    return normalized ?? 'manual';
  }, z.enum(WORD_SOURCES)),
  sourceReference: optionalTextField(),
  notes: optionalTextField(),
});

export const updateWordRelationSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  relationId: requiredTextField('Relations-ID'),
  targetWordId: requiredTextField('Målord-ID'),
  relationType: z.enum(WORD_RELATION_TYPES),
  source: z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    return normalized ?? 'manual';
  }, z.enum(WORD_SOURCES)),
  sourceReference: optionalTextField(),
  notes: optionalTextField(),
});

export const deleteWordRelationSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  relationId: requiredTextField('Relations-ID'),
});

export const archiveWordSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  confirm: z.literal('yes', { message: 'Bekräfta borttagningen.' }),
});

export const createLexicalEntrySchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  type: z.enum(LEXICAL_ENTRY_TYPES),
  value: requiredTextField('Värde'),
  source: z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    return normalized ?? 'manual';
  }, z.enum(WORD_SOURCES)),
  notes: optionalTextField(),
});

export const updateLexicalEntrySchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  entryId: requiredTextField('Post-ID'),
  type: z.enum(LEXICAL_ENTRY_TYPES),
  value: requiredTextField('Värde'),
  source: z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    return normalized ?? 'manual';
  }, z.enum(WORD_SOURCES)),
  notes: optionalTextField(),
});

export const deleteLexicalEntrySchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  entryId: requiredTextField('Post-ID'),
});

function optionalContentStatusField() {
  return z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    return normalized ?? 'DRAFT';
  }, z.enum(CONTENT_STATUSES));
}

export const createRebusEntrySchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  value: requiredTextField('Rebus'),
  difficulty: optionalHintDifficultyField(),
  source: z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    return normalized ?? 'manual';
  }, z.enum(WORD_SOURCES)),
  sourceReference: optionalTextField(),
  notes: optionalTextField(),
  status: optionalContentStatusField(),
});

export const updateRebusEntrySchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  entryId: requiredTextField('Post-ID'),
  value: requiredTextField('Rebus'),
  difficulty: optionalHintDifficultyField(),
  source: z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    return normalized ?? 'manual';
  }, z.enum(WORD_SOURCES)),
  sourceReference: optionalTextField(),
  notes: optionalTextField(),
  status: optionalContentStatusField(),
});

export const deleteRebusEntrySchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  entryId: requiredTextField('Post-ID'),
});

export const createMediaAssetSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  mediaType: z.enum(MEDIA_TYPES),
  title: optionalTextField(),
  altText: optionalTextField(),
  prompt: optionalTextField(),
  source: z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    return normalized ?? 'manual';
  }, z.enum(WORD_SOURCES)),
  sourceReference: optionalTextField(),
  attribution: optionalTextField(),
  license: optionalTextField(),
  notes: optionalTextField(),
  status: optionalContentStatusField(),
});

export const updateMediaAssetSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  assetId: requiredTextField('Media-ID'),
  mediaType: z.enum(MEDIA_TYPES),
  title: optionalTextField(),
  altText: optionalTextField(),
  prompt: optionalTextField(),
  source: z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    return normalized ?? 'manual';
  }, z.enum(WORD_SOURCES)),
  sourceReference: optionalTextField(),
  attribution: optionalTextField(),
  license: optionalTextField(),
  notes: optionalTextField(),
  status: optionalContentStatusField(),
});

export const deleteMediaAssetSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  assetId: requiredTextField('Media-ID'),
});

export const createHintSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  text: requiredTextField('Nyckeltext'),
  type: z.enum(HINT_TYPES),
  status: z.enum(CONTENT_STATUSES),
  difficulty: optionalHintDifficultyField(),
  tone: optionalHintToneField(),
  source: optionalTextField(),
  notes: optionalTextField(),
});

export const updateHintStatusSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  hintId: requiredTextField('Nyckel-ID'),
  status: z.enum(CONTENT_STATUSES),
});

export const updateHintSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  hintId: requiredTextField('Nyckel-ID'),
  text: requiredTextField('Nyckeltext'),
  type: optionalHintTypeField(),
  difficulty: optionalHintDifficultyField(),
  tone: optionalHintToneField(),
  notes: optionalTextField(),
});

export const createThemeSchema = z.object({
  name: requiredTextField('Namn'),
  slug: optionalTextField(),
  description: optionalTextField(),
});

export const importContentSchema = z.object({
  importType: z.enum(IMPORT_BATCH_TYPES),
  wordStatus: z.enum(['DRAFT', 'APPROVED']).optional(),
  hintStatus: z.enum(['DRAFT', 'APPROVED']).optional(),
});

export const addThemeToWordSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  themeId: requiredTextField('Tema-ID'),
});

export const removeThemeFromWordSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  themeId: requiredTextField('Tema-ID'),
});

export const createHintCandidateSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  text: requiredTextField('Nyckeltext'),
  type: optionalHintTypeField(),
  difficulty: optionalHintDifficultyField(),
  tone: optionalHintToneField(),
  notes: optionalTextField(),
});

export const hintCandidateActionSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  candidateId: requiredTextField('Kandidat-ID'),
});

export const approveEditedHintCandidateSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
  candidateId: requiredTextField('Kandidat-ID'),
  text: requiredTextField('Nyckeltext'),
  type: optionalHintTypeField(),
  difficulty: optionalHintDifficultyField(),
  tone: optionalHintToneField(),
  notes: optionalTextField(),
});

export const generateHintCandidatesSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
});

export const generateMediaSuggestionSchema = z.object({
  wordId: requiredTextField('Ord-ID'),
});

function bulkWordIdsField() {
  return z.array(z.string().min(1)).min(1, 'Välj minst ett ord.');
}

export const bulkWordActionSchema = z.object({
  wordIds: bulkWordIdsField(),
  returnTo: optionalTextField(),
});

export const bulkWordThemeActionSchema = z.object({
  wordIds: bulkWordIdsField(),
  themeId: requiredTextField('Tema-ID'),
  returnTo: optionalTextField(),
});

function requiredPositiveIntegerField(label: string, max?: number) {
  return z.preprocess(
    (value) => {
      if (typeof value === 'number') {
        return value;
      }

      return Number.parseInt(String(value), 10);
    },
    z
      .number()
      .int(`${label} måste vara ett heltal.`)
      .min(1, `${label} måste vara minst 1.`)
      .max(max ?? 30, `${label} får vara högst ${max ?? 30}.`),
  );
}

function optionalPositiveIntegerField(label: string) {
  return z.preprocess(
    (value) => {
      const normalized = emptyToUndefined(value);
      if (normalized === undefined) {
        return undefined;
      }

      if (typeof normalized === 'number') {
        return normalized;
      }

      return Number.parseInt(String(normalized), 10);
    },
    z.number().int(`${label} måste vara ett heltal.`).min(1).optional(),
  );
}

function optionalDateField() {
  return z.preprocess(emptyToUndefined, z.string().optional());
}

function checkboxField() {
  return z.preprocess((value) => value === 'on' || value === true, z.boolean());
}

export const createPuzzleSchema = z.object({
  title: requiredTextField('Titel'),
  type: z.enum(PUZZLE_TYPE_SELECT_OPTIONS),
  status: z.enum(PUZZLE_STATUSES),
  width: requiredPositiveIntegerField('Bredd', 30),
  height: requiredPositiveIntegerField('Höjd', 30),
  description: optionalTextField(),
  slug: optionalTextField(),
  publishDate: optionalDateField(),
});

export const createGeneratedPuzzleSchema = z.object({
  title: requiredTextField('Titel'),
  themeId: optionalTextField(),
  width: requiredPositiveIntegerField('Bredd', 30),
  height: requiredPositiveIntegerField('Höjd', 30),
  difficulty: requiredPositiveIntegerField('Svårighet', 3),
  allowDraftWords: checkboxField(),
  allowDraftHints: checkboxField(),
  status: z.enum(PUZZLE_STATUSES),
  publishDate: optionalDateField(),
});

export type CreateGeneratedPuzzleInput = z.infer<typeof createGeneratedPuzzleSchema>;

export const addPuzzleEntrySchema = z.object({
  puzzleId: requiredTextField('Pussel-ID'),
  wordId: requiredTextField('Ord-ID'),
  hintId: optionalTextField(),
  row: z.preprocess((value) => Number.parseInt(String(value), 10), z.number().int().min(0)),
  col: z.preprocess((value) => Number.parseInt(String(value), 10), z.number().int().min(0)),
  direction: z.enum(PUZZLE_DIRECTIONS),
  number: optionalPositiveIntegerField('Nummer'),
});

export const removePuzzleEntrySchema = z.object({
  puzzleId: requiredTextField('Pussel-ID'),
  entryId: requiredTextField('Placerings-ID'),
});

export const updatePuzzleEntryHintSchema = z.object({
  puzzleId: requiredTextField('Pussel-ID'),
  entryId: requiredTextField('Placerings-ID'),
  hintId: optionalTextField(),
});

export const togglePuzzleBlockedCellSchema = z.object({
  puzzleId: requiredTextField('Pussel-ID'),
  row: z.preprocess((value) => Number.parseInt(String(value), 10), z.number().int().min(0)),
  col: z.preprocess((value) => Number.parseInt(String(value), 10), z.number().int().min(0)),
});
