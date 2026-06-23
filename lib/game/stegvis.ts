export {
  countMatchingLetters,
  createStegvisRound,
  getStegvisValidationMessage,
  getAllValidStegvisNextWords,
  getDailyPuzzleIndex,
  getStegvisStepFeedback,
  getStegvisStepOptions,
  getStegvisTargetProximityHint,
  isStegvisSolved,
  normalizeStegvisWord,
  pickDailyPuzzle,
  pickRandomPuzzle,
  rankStegvisStepOptions,
  validateStegvisSampleSolution,
  validateStegvisStep,
} from '@/lib/games/stegvis/rules';

export type {
  StegvisRound,
  StegvisSampleSolutionIssue,
  StegvisSampleSolutionValidation,
  StegvisValidationContext,
  StegvisValidationReason,
  StegvisValidationResult,
} from '@/lib/games/stegvis/rules';
