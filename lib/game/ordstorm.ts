export {
  GAME_DURATION_SECONDS,
  ORDSTORM_FULL_WORD_BONUS,
  ORDSTORM_MAX_WORD_LENGTH,
  ORDSTORM_MIN_WORD_LENGTH,
  ORDSTORM_RECENT_SEED_LIMIT,
  createOrdstormLexicon,
  createRound,
  createRoundFromSeedWord,
  getRoundPotentialScore,
  getWordScore,
  isOrdstormCommonWord,
  selectSeedWord,
  splitOrdstormWordsByCategory,
} from '@/lib/games/ordstorm/rules';

export type { OrdstormRound, OrdstormStats, OrdstormWordCatalog } from '@/lib/games/ordstorm/types';
