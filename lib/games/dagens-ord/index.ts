export {
  createDailyRound,
  DAGENS_ORD_MAX_GUESSES,
  DAGENS_ORD_REVEAL_ANIMATION_MS,
  DAGENS_ORD_REVEAL_STEP_MS,
  DAGENS_ORD_WORD_LENGTH,
  evaluateGuess,
  getKeyboardLetterStates,
  isDagensOrdLost,
  isDagensOrdWon,
  isSolved,
  isValidDagensOrdGuess,
} from '@/lib/games/dagens-ord/rules';
export { loadSavedRound, persistRound } from '@/lib/games/dagens-ord/storage';
export type {
  DagensOrdGuess,
  DagensOrdLetterFeedback,
  DagensOrdRound,
  DagensOrdWordCatalog,
} from '@/lib/games/dagens-ord/types';
