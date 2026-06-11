import type { LexicalEntryType } from "@prisma/client";
import { LEXICAL_ENTRY_TYPES } from "@/lib/content/constants";

const LEXICAL_ENTRY_TYPE_SET = new Set<string>(LEXICAL_ENTRY_TYPES);

export function parseLexicalEntryTypeInput(value: string): LexicalEntryType | null {
  const normalized = value.trim().toLocaleUpperCase("sv-SE");

  if (!normalized) {
    return null;
  }

  if (LEXICAL_ENTRY_TYPE_SET.has(normalized)) {
    return normalized as LexicalEntryType;
  }

  return null;
}
