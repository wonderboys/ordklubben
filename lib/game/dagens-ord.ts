export {
  DAGENS_ORD_MAX_GUESSES,
  DAGENS_ORD_REVEAL_ANIMATION_MS,
  DAGENS_ORD_REVEAL_STEP_MS,
  DAGENS_ORD_WORD_LENGTH,
  createDailyRound,
  evaluateGuess,
  getKeyboardLetterStates,
  isDagensOrdLost,
  isDagensOrdWon,
  isSolved,
  isValidDagensOrdGuess,
} from '@/lib/games/dagens-ord/rules';

export type {
  DagensOrdGuess,
  DagensOrdLetterFeedback,
  DagensOrdRound,
} from '@/lib/games/dagens-ord/types';
