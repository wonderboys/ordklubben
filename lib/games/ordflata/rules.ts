export function normalizeOrdflataAnswer(answerSnapshot: string) {
  return answerSnapshot
    .trim()
    .toLocaleUpperCase('sv-SE')
    .replace(/[\s'’\-‐‑‒–—]+/g, '');
}
