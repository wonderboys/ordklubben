export {
  createOrdstormLexicon,
  createRound,
  createRoundFromSeedWord,
  GAME_DURATION_SECONDS,
  getRoundPotentialScore,
  getWordScore,
  isOrdstormCommonWord,
  ORDSTORM_FULL_WORD_BONUS,
  ORDSTORM_MAX_WORD_LENGTH,
  ORDSTORM_MIN_WORD_LENGTH,
  ORDSTORM_RECENT_SEED_LIMIT,
  selectSeedWord,
  splitOrdstormWordsByCategory,
} from '@/lib/games/ordstorm/rules';
export type { OrdstormRound, OrdstormStats, OrdstormWordCatalog } from '@/lib/games/ordstorm/types';
export {
  getLetterTilePlayState,
  getPlayingIdleMessage,
  getRoundResultCopy,
  getSubmitLengthHint,
  getSuccessMessage,
  getTypingHint,
  indicesToWord,
  wordToSelectedIndices,
  type LetterTilePlayState,
  type RoundResultCopy,
  type TypingHint,
} from '@/lib/games/ordstorm/ux';
