export { formatStegvisEndpointClue, pickPrimaryClue } from "@/lib/content/stegvis/clue-display";
export { generatedPuzzleToBundle } from "@/lib/content/stegvis/generated-puzzle-to-bundle";
export { logStegvisGeneratorMetrics } from "@/lib/content/stegvis/generator-metrics";
export { loadStegvisPuzzleBundle } from "@/lib/content/stegvis/load-puzzle-bundle";
export { loadStegvisPuzzleBundles } from "@/lib/content/stegvis/load-puzzles";
export {
  chainMeetsPlayRequirement,
  STEGVIS_CHAIN_WORD_COUNT,
  STEGVIS_MIDDLE_STEP_COUNT,
} from "@/lib/content/stegvis/play-chain";
export {
  loadStegvisPlaySession,
  type StegvisGeneratorDebugInfo,
  type StegvisPlaySession,
  type StegvisPuzzleSource,
} from "@/lib/content/stegvis/load-play-session";
export type {
  StegvisChainStep,
  StegvisPuzzleBundle,
  StegvisWordEndpoint,
} from "@/lib/content/stegvis/types";

export {
  buildWordGraph,
  buildWordGraphForLength,
  DEFAULT_WORD_GRAPH_LENGTH,
  findShortestPath,
  getNeighbors,
  groupWordsByLength,
  isOneLetterApart,
  loadApprovedWordsForGraph,
  loadWordGraphFromBank,
  normalizeGraphWord,
  type WordGraph,
  type WordGraphLoadOptions,
} from "@/lib/content/stegvis/word-graph";

export {
  buildStegvisGeneratorCorpus,
  DEFAULT_STEGVIS_GENERATOR_OPTIONS,
  generateStegvisPuzzle,
  generateStegvisPuzzleFromCorpus,
  scoreStegvisPuzzle,
  toWordSlot,
  type GenerateStegvisPuzzleOptions,
  type GenerateStegvisPuzzleResult,
  type StegvisDifficultyBand,
  type StegvisGeneratedPuzzle,
  type StegvisGeneratedWordSlot,
  type StegvisGeneratorCorpus,
} from "@/lib/content/stegvis/generator";
