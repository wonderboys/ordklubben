export type OrdstormRound = {
  seedWord: string;
  originalLetters: string[];
  letters: string[];
  shuffleAttempts: number;
  validWords: string[];
  validWordSet: Set<string>;
};

export type OrdstormStats = {
  roundsPlayed: number;
  bestScore: number;
  totalScore: number;
  totalWordsFound: number;
  bestWords: string[];
};

export type OrdstormWordCatalog = {
  allowedWords: string[];
  commonWords: string[];
  seedWords: string[];
};
