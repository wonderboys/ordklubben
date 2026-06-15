import { normalizeSwedish } from '@/lib/dictionary/normalize-swedish';

export type LetterPool = Record<string, number>;

export function createLetterPool(letters: string[] | string) {
  const normalizedLetters = Array.isArray(letters)
    ? letters.map((letter) => normalizeSwedish(letter))
    : normalizeSwedish(letters).split('');

  return normalizedLetters.reduce<LetterPool>((pool, letter) => {
    if (!letter) {
      return pool;
    }

    pool[letter] = (pool[letter] ?? 0) + 1;
    return pool;
  }, {});
}

export function getLetterCount(letters: string[] | string, letter: string) {
  return createLetterPool(letters)[normalizeSwedish(letter)] ?? 0;
}

export function shuffleLetters(letters: string[]) {
  const copy = [...letters];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}
