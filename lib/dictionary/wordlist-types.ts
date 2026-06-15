export type WordListKind = 'allowed' | 'common' | 'seed';

export type RawWordSource = 'hunspell' | 'kelly' | 'text';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type FilterReason =
  | 'empty'
  | 'contains_digits'
  | 'contains_symbol'
  | 'contains_whitespace'
  | 'contains_uppercase'
  | 'too_short'
  | 'too_long'
  | 'not_swedish_letters'
  | 'proper_noun'
  | 'duplicate'
  | 'verb_like'
  | 'low_playability'
  | 'cefr_excluded'
  | 'phrase'
  | 'abbrev_consonant_block'
  | 'abbrev_org_pattern'
  | 'never_allow';

export type FilteredWordExample = {
  word: string;
  reason: FilterReason;
  source: RawWordSource;
};

export type WordEntry = {
  word: string;
  source: RawWordSource;
  raw: string;
};

export type KellyEntry = {
  rank: number;
  rawFreq: number | null;
  wpm: number | null;
  cefr: CefrLevel | '';
  lemma: string;
  wordClass: string;
  raw: string;
};

export type KellyWordMetadata = {
  rank: number;
  cefr: CefrLevel;
  wpm: number | null;
};

export type CefrDistribution = {
  all: Partial<Record<CefrLevel, number>>;
  common: Partial<Record<CefrLevel, number>>;
};

export type SeedCandidate = {
  word: string;
  playableWordCount: number;
  playableWords: string[];
  kellyRank: number | null;
  cefr: CefrLevel | null;
  wpm: number | null;
  source: 'preferred' | 'generated';
  score: number;
};

export type BuildWordlistsReport = {
  kellyWords: number;
  rawWords: number;
  allowedWords: number;
  commonWords: number;
  seedSource: 'common' | 'allowed_fallback';
  seedCandidatesBeforeFilter: number;
  seedCandidates: number;
  cefrDistribution: CefrDistribution;
  topSeeds: SeedCandidate[];
  filteredExamples: FilteredWordExample[];
};
