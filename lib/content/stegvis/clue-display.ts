import type { WordBankClue } from '@/lib/content/word-bank/types';

const PREFERRED_CLUE_TYPES = [
  'DEFINITION',
  'ASSOCIATION',
  'SYNONYM',
  'WORDPLAY',
  'OTHER',
  'THEME',
] as const;

export function pickPrimaryClue(clues: WordBankClue[]): WordBankClue | null {
  if (clues.length === 0) {
    return null;
  }

  for (const type of PREFERRED_CLUE_TYPES) {
    const match = clues.find((clue) => clue.type === type);

    if (match) {
      return match;
    }
  }

  return clues[0] ?? null;
}

export function formatStegvisEndpointClue(options: {
  answer: string;
  wordId: string | null;
  clues: WordBankClue[];
}): string {
  const primary = pickPrimaryClue(options.clues);

  if (primary?.text) {
    return primary.text;
  }

  if (options.wordId) {
    return 'Nyckel saknas';
  }

  return options.answer;
}
