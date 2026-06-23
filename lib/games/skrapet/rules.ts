import type { SkrapetPuzzle } from '@/lib/games/skrapet/types';

export function pickRandomSkrapetPuzzle(puzzles: SkrapetPuzzle[]) {
  const index = Math.floor(Math.random() * puzzles.length);
  return puzzles[index] ?? puzzles[0] ?? null;
}

export function normalizeSkrapetGuess(value: string): string {
  return value.trim().toLocaleUpperCase('sv-SE').replace(/\s+/g, '');
}

export function formatSkrapetClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const SKRAPET_BASE_SCORE = 500;
export const SKRAPET_CLUE_PENALTY = 50;

export function calculateSkrapetScore(revealedCount: number, elapsedSeconds: number): number {
  return SKRAPET_BASE_SCORE - revealedCount * SKRAPET_CLUE_PENALTY - elapsedSeconds;
}
