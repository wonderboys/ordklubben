import { KASTET_ACTIVE_DICE_COUNT, KASTET_LETTERS_PER_DIE } from '@/lib/game/kastet/config';

export type KastetLetterPair = string;

export function pickRandomKastetPairsFromPool(
  pairPool: readonly string[],
  count: number = KASTET_ACTIVE_DICE_COUNT,
  lettersPerDie: number = KASTET_LETTERS_PER_DIE,
) {
  const pool = pairPool.filter((pair) => pair.length === lettersPerDie);
  const available = [...pool];
  const picked: KastetLetterPair[] = [];

  while (picked.length < count && available.length > 0) {
    const index = Math.floor(Math.random() * available.length);
    const [pair] = available.splice(index, 1);

    if (pair) {
      picked.push(pair);
    }
  }

  return picked;
}
