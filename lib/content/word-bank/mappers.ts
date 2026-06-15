import type { Theme } from '@prisma/client';
import type { wordBankClueSelect, wordBankWordSelect } from '@/lib/content/word-bank/queries';
import type { WordBankClue, WordBankThemeRef, WordBankWord } from '@/lib/content/word-bank/types';
import type { Prisma } from '@prisma/client';

type WordBankWordRow = Prisma.WordGetPayload<{
  select: typeof wordBankWordSelect;
}>;

type WordBankClueRow = Prisma.HintGetPayload<{
  select: typeof wordBankClueSelect;
}>;

export function mapThemeRef(theme: Pick<Theme, 'id' | 'slug' | 'name'>): WordBankThemeRef {
  return {
    id: theme.id,
    slug: theme.slug,
    name: theme.name,
  };
}

export function mapWordBankWord(word: WordBankWordRow): WordBankWord {
  return {
    id: word.id,
    answer: word.answer,
    normalizedAnswer: word.normalizedAnswer,
    length: word.length,
    language: word.language,
    difficulty: word.difficulty,
    frequency: word.frequency,
    crosswordScore: word.crosswordScore,
    themes: word.themes.map((entry) => mapThemeRef(entry.theme)),
  };
}

export function mapWordBankClue(hint: WordBankClueRow): WordBankClue {
  return {
    id: hint.id,
    wordId: hint.wordId,
    text: hint.text,
    type: hint.type,
    status: hint.status,
    difficulty: hint.difficulty,
    tone: hint.tone,
    source: hint.source,
  };
}
