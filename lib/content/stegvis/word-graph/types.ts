/** Adjacency map: normalized word → set of neighboring normalized words. */
export type WordGraph = Map<string, Set<string>>;

/** Default word length for first Stegvis graph builds (4-letter puzzles). */
export const DEFAULT_WORD_GRAPH_LENGTH = 4;

export type WordGraphLoadOptions = {
  /** When set, only include words of this length. */
  length?: number;
};
