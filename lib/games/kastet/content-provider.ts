import { isWordBankAvailable, listActiveWords } from '@/lib/server/words/provider';
import type { KastetContent } from '@/lib/games/kastet/types';

export async function loadKastetContent(): Promise<KastetContent | null> {
  if (!isWordBankAvailable()) {
    return null;
  }

  const words = await listActiveWords({
    minLength: 3,
  });

  const pairPool = [
    ...new Set(
      words
        .map((word) => word.answer.trim().toLocaleUpperCase('sv-SE').slice(0, 2))
        .filter((pair) => /^[A-ZÅÄÖ]{2}$/.test(pair)),
    ),
  ].sort((a, b) => a.localeCompare(b, 'sv-SE'));

  if (pairPool.length === 0) {
    return null;
  }

  return { pairPool };
}
