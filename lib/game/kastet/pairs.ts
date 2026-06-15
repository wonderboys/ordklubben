import { KASTET_ACTIVE_DICE_COUNT, KASTET_LETTERS_PER_DIE } from '@/lib/game/kastet/config';

export const KASTET_LETTER_PAIRS = [
  'AR',
  'ER',
  'OR',
  'EN',
  'AN',
  'IN',
  'AL',
  'EL',
  'ST',
  'SK',
  'TR',
  'BL',
  'BR',
  'KL',
  'KR',
  'PR',
  'FR',
  'GR',
  'AB',
  'AK',
  'AV',
  'UR',
  'OM',
  'OS',
  'OL',
  'RT',
] as const;

export type KastetLetterPair = (typeof KASTET_LETTER_PAIRS)[number];

/** Pairs matching the configured letters-per-die length. */
export function getKastetPairPool(
  lettersPerDie: number = KASTET_LETTERS_PER_DIE,
): KastetLetterPair[] {
  return KASTET_LETTER_PAIRS.filter((pair) => pair.length === lettersPerDie);
}

export function pickRandomKastetPairs(
  count: number = KASTET_ACTIVE_DICE_COUNT,
  lettersPerDie: number = KASTET_LETTERS_PER_DIE,
): KastetLetterPair[] {
  const pool = [...getKastetPairPool(lettersPerDie)];
  const picked: KastetLetterPair[] = [];

  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const [pair] = pool.splice(index, 1);
    if (pair) {
      picked.push(pair);
    }
  }

  return picked;
}

export function pickRandomKastetPair(): KastetLetterPair {
  const index = Math.floor(Math.random() * KASTET_LETTER_PAIRS.length);
  return KASTET_LETTER_PAIRS[index] ?? 'AR';
}

export function pickRandomKastetFlicker(
  count: number = KASTET_ACTIVE_DICE_COUNT,
): KastetLetterPair[] {
  return Array.from({ length: count }, () => pickRandomKastetPair());
}

export function createEmptyKastetRows<T>(createRow: () => T): T[] {
  return Array.from({ length: KASTET_ACTIVE_DICE_COUNT }, createRow);
}

export function normalizeKastetWord(value: string): string {
  return value.trim().toLocaleUpperCase('sv-SE').replace(/\s+/g, '');
}

export function validateKastetWord(
  value: string,
  pair: string,
): { ok: true } | { ok: false; message: string } {
  const normalized = normalizeKastetWord(value);

  if (normalized.length === 0) {
    return { ok: false, message: 'Skriv ett ord.' };
  }

  if (normalized.length < 3) {
    return { ok: false, message: 'Ordet måste ha minst 3 bokstäver.' };
  }

  if (!normalized.startsWith(pair.toLocaleUpperCase('sv-SE'))) {
    return { ok: false, message: `Ordet måste börja med ${pair}.` };
  }

  return { ok: true };
}

export function formatKastetClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatKastetElapsed(seconds: number): string {
  return `${seconds} sekund${seconds === 1 ? '' : 'er'}`;
}
