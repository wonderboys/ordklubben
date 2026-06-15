import { Prisma } from "@prisma/client";

export const NOUN_INFLECTION_FIELDS = [
  { key: "definiteSingular", label: "Bestämd form" },
  { key: "indefinitePlural", label: "Plural" },
  { key: "definitePlural", label: "Plural bestämd" },
] as const;

export type NounInflectionKey = (typeof NOUN_INFLECTION_FIELDS)[number]["key"];

export type WordNounInflections = Partial<Record<NounInflectionKey, string>>;

/** Inflection groups shown in the language tab. Add verb/adjective groups here later. */
export const WORD_LANGUAGE_INFLECTION_GROUPS = [
  {
    id: "noun",
    label: "Substantivböjningar",
    fields: NOUN_INFLECTION_FIELDS,
  },
] as const;

export type WordLanguageInflectionGroup =
  (typeof WORD_LANGUAGE_INFLECTION_GROUPS)[number];

export function parseWordInflections(value: unknown): WordNounInflections {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;
  const inflections: WordNounInflections = {};

  for (const field of NOUN_INFLECTION_FIELDS) {
    const raw = record[field.key];
    if (typeof raw === "string" && raw.trim().length > 0) {
      inflections[field.key] = raw.trim();
    }
  }

  return inflections;
}

export function buildWordInflectionsFromForm(input: {
  definiteSingular?: string;
  indefinitePlural?: string;
  definitePlural?: string;
}): WordNounInflections {
  const inflections: WordNounInflections = {};

  for (const field of NOUN_INFLECTION_FIELDS) {
    const value = input[field.key]?.trim();
    if (value) {
      inflections[field.key] = value;
    }
  }

  return inflections;
}

export function serializeWordInflections(
  inflections: WordNounInflections,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  const entries = Object.entries(inflections).filter(
    ([, value]) => typeof value === "string" && value.trim().length > 0,
  );

  if (entries.length === 0) {
    return Prisma.DbNull;
  }

  return Object.fromEntries(entries);
}

export function hasWordInflections(inflections: WordNounInflections): boolean {
  return Object.values(inflections).some((value) => value && value.trim().length > 0);
}
