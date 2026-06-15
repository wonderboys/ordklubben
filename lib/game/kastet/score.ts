export function countKastetWordLetters(word: string): number {
  return word.trim().length;
}

export function countKastetTotalLetters(words: string[]): number {
  return words.reduce((sum, word) => sum + countKastetWordLetters(word), 0);
}

/** Prototype scoring — formula may change later. */
export function calculateKastetScore(totalLetters: number, elapsedSeconds: number): number {
  return totalLetters * 10 - elapsedSeconds;
}
