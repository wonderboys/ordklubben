export type DagensOrdLetterFeedback = 'correct' | 'present' | 'absent';

export type DagensOrdGuess = {
  word: string;
  feedback: DagensOrdLetterFeedback[];
};

export type DagensOrdRound = {
  targetWord: string;
  dayKey: string;
  guesses: DagensOrdGuess[];
  currentInput: string;
};

export type DagensOrdWordCatalog = {
  dayKey: string;
  targetWord: string;
  allowedWords: string[];
};
