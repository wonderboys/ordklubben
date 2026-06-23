import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const RAW_DIR = path.join(ROOT_DIR, 'data', 'sources', 'raw');
const GENERATED_DIR = path.join(ROOT_DIR, 'data', 'legacy', 'generated');
const HUNSPELL_DIR = path.join(RAW_DIR, 'hunspell');
const KELLY_DIR = path.join(RAW_DIR, 'kelly');
const FILTER_DIR = path.join(ROOT_DIR, 'data', 'seed', 'word-filters');
const NEVER_SEED_INPUT = path.join(FILTER_DIR, 'never-seed-sv.ts');
const NEVER_ALLOW_INPUT = path.join(FILTER_DIR, 'never-allow-sv.ts');
const PREFERRED_SEED_INPUT = path.join(FILTER_DIR, 'preferred-seed-sv.ts');
const ALLOWED_ABBREV_INPUT = path.join(FILTER_DIR, 'allowed-abbrev-sv.ts');
const ALLOWED_OUTPUT = path.join(GENERATED_DIR, 'allowed-sv.generated.ts');
const COMMON_OUTPUT = path.join(GENERATED_DIR, 'common-sv.generated.ts');
const SEED_OUTPUT = path.join(GENERATED_DIR, 'seed-words-sv.generated.ts');

type RawWordSource = 'hunspell' | 'kelly' | 'text';
type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type FilterReason =
  | 'empty'
  | 'contains_digits'
  | 'contains_symbol'
  | 'contains_whitespace'
  | 'too_short'
  | 'too_long'
  | 'not_swedish_letters'
  | 'proper_noun'
  | 'duplicate'
  | 'cefr_excluded'
  | 'phrase'
  | 'abbrev_consonant_block'
  | 'abbrev_org_pattern'
  | 'never_allow';
type WordEntry = {
  word: string;
  source: RawWordSource;
  raw: string;
};
type KellyEntry = {
  rank: number;
  rawFreq: number | null;
  wpm: number | null;
  cefr: CefrLevel | '';
  lemma: string;
  wordClass: string;
  raw: string;
};
type FilteredWordExample = {
  word: string;
  reason: FilterReason;
  source: RawWordSource;
};
type SeedCandidate = {
  word: string;
  playableWordCount: number;
  playableWords: string[];
  kellyRank: number | null;
  cefr: CefrLevel | null;
  wpm: number | null;
  source: 'preferred' | 'generated';
  score: number;
};
type SeedSource = 'common' | 'allowed_fallback';
type SeedFilterReason =
  | 'not_six_letters'
  | 'placeholder'
  | 'blocked_manual'
  | 'proper_noun'
  | 'not_swedish_letters'
  | 'verb_like'
  | 'low_playability';
type SeedFilteredExample = {
  word: string;
  reason: SeedFilterReason;
};
type CefrDistribution = {
  all: Partial<Record<CefrLevel, number>>;
  common: Partial<Record<CefrLevel, number>>;
};
type KellyCommonWord = {
  word: string;
  rank: number;
  cefr: CefrLevel;
  wpm: number | null;
};
type AbbreviationFilterReport = {
  allowedWordsBefore: number;
  filteredAbbreviations: number;
  filteredAbbrevExamples: FilteredWordExample[];
  keptAllowlistedAbbreviations: string[];
};
type NeverAllowFilterReport = {
  filteredNeverAllow: number;
  filteredNeverAllowExamples: FilteredWordExample[];
};
type BuildWordlistsReport = {
  kellyWords: number;
  rawWords: number;
  allowedWords: number;
  allowedWordsBeforeAbbrevFilter: number;
  commonWords: number;
  seedSource: SeedSource;
  seedCandidatesBeforeFilter: number;
  seedCandidates: number;
  cefrDistribution: CefrDistribution;
  abbreviationFilter: AbbreviationFilterReport;
  neverAllowFilter: NeverAllowFilterReport;
  topSeeds: SeedCandidate[];
  randomAcceptedSeeds: SeedCandidate[];
  filteredExamples: FilteredWordExample[];
  filteredSeedExamples: SeedFilteredExample[];
};

const SWEDISH_WORD_PATTERN = /^[a-zåäö]+$/;
const PROPER_NOUN_PATTERN = /^[A-ZÅÄÖ][a-zåäö]+$/;
const UPPERCASE_WORD_PATTERN = /^[A-ZÅÄÖ]+$/;
const KELLY_DATA_ROW_PATTERN = /^\d+;/;
const ALLOWED_CEFR_LEVELS = new Set<CefrLevel>(['A1', 'A2', 'B1', 'B2']);
const CEFR_PRIORITY_SCORE: Record<CefrLevel, number> = {
  A1: 40,
  A2: 30,
  B1: 20,
  B2: 10,
  C1: 0,
  C2: 0,
};
const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const ABBREV_CONSONANT_BLOCK_PATTERN = /^[bcdfghjklmnpqrstvwxz]{3,5}$/;
const ABBREV_ORG_PATTERN = /^[bcdfghjklmnpqrstvwxz]{2,4}a$/;
const VERB_LIKE_ENDINGS = ['ade', 'ande', 'ar', 'at', 'er', 'or', 'ast', 'ing'];
const MINIMUM_SEED_PLAYABLE_WORDS = 15;
const PLACEHOLDER_SEEDS = new Set([
  'abcdef',
  'banan',
  'foobar',
  'demo',
  'dummy',
  'testad',
  'tester',
  'spelar',
]);
function readManualWordList(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return [] as string[];
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const matches = [...fileContents.matchAll(/"([^"]+)"/g)];
  return matches.map((match) => match[1] ?? '').filter(Boolean);
}

const NEVER_SEED_WORDS = new Set(readManualWordList(NEVER_SEED_INPUT));
const NEVER_ALLOW_WORDS = new Set(readManualWordList(NEVER_ALLOW_INPUT));
const PREFERRED_SEED_WORDS = new Set(readManualWordList(PREFERRED_SEED_INPUT));
const ALLOWED_ABBREV_WORDS = new Set(readManualWordList(ALLOWED_ABBREV_INPUT));

function normalizeSwedish(value: string) {
  return value.trim().toLocaleLowerCase('sv-SE').normalize('NFC');
}

function cleanRawWord(rawValue: string) {
  return rawValue.trim().replace(/^\uFEFF/, '');
}

function normalizeWordCandidate(rawValue: string) {
  return normalizeSwedish(cleanRawWord(rawValue));
}

function hasDigits(value: string) {
  return /\d/.test(value);
}

function hasWhitespace(value: string) {
  return /\s/.test(value);
}

function hasDisallowedSymbols(value: string) {
  return /[^A-Za-zÅÄÖåäö]/.test(value);
}

function isAllUppercaseWord(rawValue: string) {
  return UPPERCASE_WORD_PATTERN.test(cleanRawWord(rawValue));
}

function looksLikeProperNoun(rawValue: string) {
  const trimmed = cleanRawWord(rawValue);
  return PROPER_NOUN_PATTERN.test(trimmed) && !isAllUppercaseWord(rawValue);
}

function detectBaseFilterReason(
  rawValue: string,
  normalizedWord: string,
  options: { minLength: number; maxLength?: number },
): FilterReason | null {
  if (!rawValue.trim()) {
    return 'empty';
  }

  if (hasWhitespace(rawValue.trim())) {
    return 'contains_whitespace';
  }

  if (hasDigits(rawValue)) {
    return 'contains_digits';
  }

  if (hasDisallowedSymbols(rawValue)) {
    return 'contains_symbol';
  }

  if (!SWEDISH_WORD_PATTERN.test(normalizedWord)) {
    return 'not_swedish_letters';
  }

  if (normalizedWord.length < options.minLength) {
    return 'too_short';
  }

  if (options.maxLength && normalizedWord.length > options.maxLength) {
    return 'too_long';
  }

  return null;
}

function filterWordEntry(
  entry: WordEntry,
  options: { minLength: number; maxLength?: number; rejectProperNouns?: boolean },
): { ok: true; word: string } | { ok: false; reason: FilterReason } {
  const normalizedWord = normalizeWordCandidate(entry.raw);
  const baseReason = detectBaseFilterReason(entry.raw, normalizedWord, options);

  if (baseReason) {
    return { ok: false, reason: baseReason };
  }

  if (options.rejectProperNouns && looksLikeProperNoun(entry.raw)) {
    return { ok: false, reason: 'proper_noun' };
  }

  return { ok: true, word: normalizedWord };
}

function recordFilteredWord(
  examples: FilteredWordExample[],
  word: string,
  reason: FilterReason,
  source: RawWordSource,
  limit = 24,
) {
  if (examples.length >= limit) {
    return;
  }

  examples.push({ word, reason, source });
}

function isPlaceholderSeed(word: string) {
  return PLACEHOLDER_SEEDS.has(word);
}

function isVerbLikeSeed(word: string) {
  return VERB_LIKE_ENDINGS.some((ending) => word.endsWith(ending));
}

function isObviousPhrase(rawValue: string) {
  const trimmed = cleanRawWord(rawValue);

  return (
    hasWhitespace(trimmed) || /[()]/.test(trimmed) || /[/\\]/.test(trimmed) || trimmed.includes('…')
  );
}

function isKellyProperName(entry: KellyEntry) {
  if (/proper\s*name/i.test(entry.wordClass)) {
    return true;
  }

  return looksLikeProperNoun(entry.lemma) && !isAllUppercaseWord(entry.lemma);
}

function scoreKellyFrequency(rank: number | null) {
  if (!rank || rank < 1) {
    return 0;
  }

  return Math.max(0, 100 - rank / 50);
}

function scoreSeedCandidate(candidate: SeedCandidate) {
  const diversityScore = new Set(candidate.word.split('')).size;
  const penalty = isVerbLikeSeed(candidate.word) ? 3 : 0;
  const preferredBonus = candidate.source === 'preferred' ? 1000 : 0;
  const playabilityScore = candidate.playableWordCount * 10;
  const frequencyScore = scoreKellyFrequency(candidate.kellyRank);
  const cefrScore = candidate.cefr ? CEFR_PRIORITY_SCORE[candidate.cefr] : 0;

  return playabilityScore + frequencyScore + cefrScore + diversityScore - penalty + preferredBonus;
}

function recordSeedFilteredExample(
  examples: SeedFilteredExample[],
  word: string,
  reason: SeedFilterReason,
  limit = 24,
) {
  if (examples.length >= limit) {
    return;
  }

  examples.push({ word, reason });
}

function rankSeedCandidates(candidates: SeedCandidate[]) {
  return [...candidates].sort((a, b) => {
    return (
      b.score - a.score ||
      b.playableWordCount - a.playableWordCount ||
      (a.kellyRank ?? Number.MAX_SAFE_INTEGER) - (b.kellyRank ?? Number.MAX_SAFE_INTEGER) ||
      a.word.localeCompare(b.word, 'sv-SE')
    );
  });
}

function sortSeedsByPlayability(candidates: SeedCandidate[]) {
  const scored = candidates.map((candidate) => ({
    ...candidate,
    score: scoreSeedCandidate(candidate),
  }));

  return rankSeedCandidates(scored);
}

function pickRandomSeeds(candidates: SeedCandidate[], count: number) {
  const copy = [...candidates];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy.slice(0, count);
}

function canBuildWordFromSeed(word: string, seed: string) {
  const pool = new Map<string, number>();

  for (const letter of seed) {
    pool.set(letter, (pool.get(letter) ?? 0) + 1);
  }

  for (const letter of word) {
    const count = pool.get(letter) ?? 0;
    if (count < 1) {
      return false;
    }
    pool.set(letter, count - 1);
  }

  return true;
}

function listFiles(directory: string) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((name) => !name.startsWith('.'))
    .map((name) => path.join(directory, name))
    .filter((filePath) => fs.statSync(filePath).isFile());
}

function readTextFile(filePath: string) {
  return fs.readFileSync(filePath, 'utf8');
}

function appendEntries(target: WordEntry[], source: WordEntry[]) {
  for (const entry of source) {
    target.push(entry);
  }
}

function mergeUniqueWords(primary: string[], secondary: string[]) {
  const merged = new Set<string>();

  for (const word of primary) {
    merged.add(word);
  }

  for (const word of secondary) {
    merged.add(word);
  }

  return [...merged].sort((a, b) => a.localeCompare(b, 'sv-SE'));
}

function extractWordsFromDic(filePath: string, source: RawWordSource) {
  const lines = readTextFile(filePath).split(/\r?\n/);
  const entries: WordEntry[] = [];

  for (const [index, line] of lines.entries()) {
    if (index === 0 && /^\d+$/.test(line.trim())) {
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const stem = trimmed.split('/')[0]?.trim() ?? '';
    if (!stem) {
      continue;
    }

    entries.push({ word: stem, raw: stem, source });
  }

  return entries;
}

function extractWordsFromDelimitedFile(filePath: string, source: RawWordSource) {
  const text = readTextFile(filePath);
  const rows = text.split(/\r?\n/);
  const entries: WordEntry[] = [];

  for (const row of rows) {
    const trimmed = row.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const columns = trimmed
      .split(/[;,|\t]/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (columns.length > 1) {
      const candidate = columns.find((value) => /[A-Za-zÅÄÖåäö]/.test(value)) ?? columns[0];
      entries.push({ word: candidate, raw: candidate, source });
      continue;
    }

    entries.push({ word: trimmed, raw: trimmed, source });
  }

  return entries;
}

function parseKellyNumber(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseKellyCsv(filePath: string) {
  const lines = readTextFile(filePath).split(/\r?\n/);
  const entries: KellyEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !KELLY_DATA_ROW_PATTERN.test(trimmed)) {
      continue;
    }

    const columns = trimmed.split(';');
    if (columns.length < 8) {
      continue;
    }

    const rank = Number.parseInt(columns[0] ?? '', 10);
    const rawFreqValue = columns[1]?.trim() ?? '';
    const rawFreq = rawFreqValue ? Number.parseInt(rawFreqValue, 10) : null;
    const wpm = parseKellyNumber(columns[2] ?? '');
    const cefr = (columns[3]?.trim() ?? '') as CefrLevel | '';
    const lemma = columns[6]?.trim() ?? '';
    const wordClass = columns[7]?.trim() ?? '';

    if (!lemma || Number.isNaN(rank)) {
      continue;
    }

    entries.push({
      rank,
      rawFreq: rawFreq !== null && !Number.isNaN(rawFreq) ? rawFreq : null,
      wpm,
      cefr,
      lemma,
      wordClass,
      raw: lemma,
    });
  }

  return entries;
}

function loadHunspellEntries() {
  const hunspellFiles = listFiles(HUNSPELL_DIR);
  const entries: WordEntry[] = [];

  for (const filePath of hunspellFiles) {
    if (filePath.endsWith('.dic')) {
      appendEntries(entries, extractWordsFromDic(filePath, 'hunspell'));
      continue;
    }

    if (/\.(txt|csv)$/i.test(filePath)) {
      appendEntries(entries, extractWordsFromDelimitedFile(filePath, 'hunspell'));
    }
  }

  return entries;
}

function loadKellyEntries() {
  const kellyFiles = listFiles(KELLY_DIR);
  const entries: KellyEntry[] = [];

  for (const filePath of kellyFiles) {
    if (/\.csv$/i.test(filePath)) {
      entries.push(...parseKellyCsv(filePath));
    }
  }

  return entries;
}

function recordCefrCount(distribution: Partial<Record<CefrLevel, number>>, level: CefrLevel | '') {
  if (!level) {
    return;
  }

  distribution[level] = (distribution[level] ?? 0) + 1;
}

function buildKellyLemmaSet(kellyEntries: KellyEntry[]) {
  const lemmas = new Set<string>();

  for (const entry of kellyEntries) {
    const lemma = normalizeWordCandidate(entry.lemma);
    if (lemma) {
      lemmas.add(lemma);
    }
  }

  return lemmas;
}

function matchesAbbreviationPattern(word: string) {
  return ABBREV_CONSONANT_BLOCK_PATTERN.test(word) || ABBREV_ORG_PATTERN.test(word);
}

function detectAllowedAbbreviationFilterReason(
  word: string,
  kellyLemmas: Set<string>,
): FilterReason | null {
  if (word.length < 3 || word.length > 5) {
    return null;
  }

  if (kellyLemmas.has(word)) {
    return null;
  }

  if (/[åäö]/.test(word)) {
    return null;
  }

  if (ALLOWED_ABBREV_WORDS.has(word)) {
    return null;
  }

  if (ABBREV_CONSONANT_BLOCK_PATTERN.test(word)) {
    return 'abbrev_consonant_block';
  }

  if (ABBREV_ORG_PATTERN.test(word)) {
    return 'abbrev_org_pattern';
  }

  return null;
}

function filterNeverAllowWords(
  words: string[],
  filteredExamples: FilteredWordExample[],
): { report: NeverAllowFilterReport; words: string[] } {
  const kept: string[] = [];
  const filteredNeverAllowExamples: FilteredWordExample[] = [];

  for (const word of words) {
    if (NEVER_ALLOW_WORDS.has(word)) {
      if (filteredNeverAllowExamples.length < 24) {
        filteredNeverAllowExamples.push({
          word,
          reason: 'never_allow',
          source: 'hunspell',
        });
      }
      recordFilteredWord(filteredExamples, word, 'never_allow', 'hunspell');
      continue;
    }

    kept.push(word);
  }

  return {
    report: {
      filteredNeverAllow: words.length - kept.length,
      filteredNeverAllowExamples,
    },
    words: kept,
  };
}

function filterAllowedAbbreviations(
  words: string[],
  kellyLemmas: Set<string>,
  filteredExamples: FilteredWordExample[],
): { report: AbbreviationFilterReport; words: string[] } {
  const kept: string[] = [];
  const keptAllowlisted: string[] = [];
  const filteredAbbrevExamples: FilteredWordExample[] = [];

  for (const word of words) {
    const reason = detectAllowedAbbreviationFilterReason(word, kellyLemmas);

    if (reason) {
      if (filteredAbbrevExamples.length < 24) {
        filteredAbbrevExamples.push({ word, reason, source: 'hunspell' });
      }
      recordFilteredWord(filteredExamples, word, reason, 'hunspell');
      continue;
    }

    kept.push(word);

    if (
      ALLOWED_ABBREV_WORDS.has(word) &&
      !kellyLemmas.has(word) &&
      matchesAbbreviationPattern(word)
    ) {
      keptAllowlisted.push(word);
    }
  }

  return {
    report: {
      allowedWordsBefore: words.length,
      filteredAbbreviations: words.length - kept.length,
      filteredAbbrevExamples,
      keptAllowlistedAbbreviations: keptAllowlisted.sort((a, b) => a.localeCompare(b, 'sv-SE')),
    },
    words: kept,
  };
}

function filterAllowedWords(entries: WordEntry[], filteredExamples: FilteredWordExample[]) {
  const seen = new Set<string>();
  const words: string[] = [];

  for (const entry of entries) {
    const result = filterWordEntry(entry, {
      minLength: 3,
      maxLength: 8,
      rejectProperNouns: true,
    });

    if (!result.ok) {
      recordFilteredWord(filteredExamples, entry.raw, result.reason, entry.source);
      continue;
    }

    if (seen.has(result.word)) {
      recordFilteredWord(filteredExamples, entry.raw, 'duplicate', entry.source);
      continue;
    }

    seen.add(result.word);
    words.push(result.word);
  }

  return words.sort((a, b) => a.localeCompare(b, 'sv-SE'));
}

function filterKellyToCommon(
  kellyEntries: KellyEntry[],
  filteredExamples: FilteredWordExample[],
  cefrDistribution: CefrDistribution,
) {
  const seen = new Map<string, KellyCommonWord>();
  const words: string[] = [];

  for (const entry of kellyEntries) {
    recordCefrCount(cefrDistribution.all, entry.cefr);

    if (!ALLOWED_CEFR_LEVELS.has(entry.cefr as CefrLevel)) {
      recordFilteredWord(filteredExamples, entry.lemma, 'cefr_excluded', 'kelly');
      continue;
    }

    if (isKellyProperName(entry)) {
      recordFilteredWord(filteredExamples, entry.lemma, 'proper_noun', 'kelly');
      continue;
    }

    if (isObviousPhrase(entry.lemma)) {
      recordFilteredWord(filteredExamples, entry.lemma, 'phrase', 'kelly');
      continue;
    }

    const wordEntry: WordEntry = {
      word: entry.lemma,
      raw: entry.lemma,
      source: 'kelly',
    };
    const result = filterWordEntry(wordEntry, {
      minLength: 3,
      maxLength: 12,
      rejectProperNouns: true,
    });

    if (!result.ok) {
      recordFilteredWord(filteredExamples, entry.lemma, result.reason, 'kelly');
      continue;
    }

    recordCefrCount(cefrDistribution.common, entry.cefr);

    const existing = seen.get(result.word);
    if (!existing || entry.rank < existing.rank) {
      seen.set(result.word, {
        word: result.word,
        rank: entry.rank,
        cefr: entry.cefr as CefrLevel,
        wpm: entry.wpm,
      });
    }
  }

  for (const commonWord of seen.values()) {
    words.push(commonWord.word);
  }

  return {
    commonWords: words.sort((a, b) => a.localeCompare(b, 'sv-SE')),
    kellyMetadata: seen,
  };
}

function buildSeedCandidates(
  commonWords: string[],
  allowedWords: string[],
  kellyMetadata: Map<string, KellyCommonWord>,
) {
  const playableWordPool = mergeUniqueWords(commonWords, allowedWords).filter(
    (word) => word.length >= 3 && word.length <= 6,
  );
  const seedSource: SeedSource = commonWords.length > 0 ? 'common' : 'allowed_fallback';
  const sourceWords = seedSource === 'common' ? commonWords : allowedWords;
  const commonSet = new Set(commonWords);
  const candidates: SeedCandidate[] = [];
  const filteredSeedExamples: SeedFilteredExample[] = [];
  let seedCandidatesBeforeFilter = 0;

  for (const word of sourceWords) {
    if (word.length !== 6) {
      recordSeedFilteredExample(filteredSeedExamples, word, 'not_six_letters');
      continue;
    }

    seedCandidatesBeforeFilter += 1;

    if (isPlaceholderSeed(word)) {
      recordSeedFilteredExample(filteredSeedExamples, word, 'placeholder');
      continue;
    }

    if (NEVER_SEED_WORDS.has(word)) {
      recordSeedFilteredExample(filteredSeedExamples, word, 'blocked_manual');
      continue;
    }

    if (!SWEDISH_WORD_PATTERN.test(word)) {
      recordSeedFilteredExample(filteredSeedExamples, word, 'not_swedish_letters');
      continue;
    }

    if (seedSource === 'common' && !commonSet.has(word)) {
      continue;
    }

    if (seedSource === 'allowed_fallback' && looksLikeProperNoun(word)) {
      recordSeedFilteredExample(filteredSeedExamples, word, 'proper_noun');
      continue;
    }

    if (seedSource === 'allowed_fallback' && isVerbLikeSeed(word)) {
      recordSeedFilteredExample(filteredSeedExamples, word, 'verb_like');
      continue;
    }

    const playableWords = playableWordPool.filter((candidate) =>
      canBuildWordFromSeed(candidate, word),
    );

    if (playableWords.length < MINIMUM_SEED_PLAYABLE_WORDS) {
      recordSeedFilteredExample(filteredSeedExamples, word, 'low_playability');
      continue;
    }

    const metadata = kellyMetadata.get(word);
    const source = PREFERRED_SEED_WORDS.has(word) ? 'preferred' : 'generated';
    const seedCandidate: SeedCandidate = {
      word,
      playableWordCount: playableWords.length,
      playableWords: playableWords.sort(
        (a, b) => b.length - a.length || a.localeCompare(b, 'sv-SE'),
      ),
      kellyRank: metadata?.rank ?? null,
      cefr: metadata?.cefr ?? null,
      wpm: metadata?.wpm ?? null,
      source,
      score: 0,
    };

    candidates.push({
      ...seedCandidate,
      score: scoreSeedCandidate(seedCandidate),
    });
  }

  return {
    seedSource,
    seedCandidatesBeforeFilter,
    seedCandidates: sortSeedsByPlayability(candidates),
    filteredSeedExamples,
  };
}

function formatArrayExport(exportName: string, values: string[]) {
  const lines = values.map((value) => `  "${value}",`);
  return `// This file is generated by scripts/build-wordlists.ts\nexport const ${exportName} = [\n${lines.join('\n')}\n] as const;\n`;
}

function writeGeneratedFiles(allowedWords: string[], commonWords: string[], seeds: string[]) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  fs.writeFileSync(ALLOWED_OUTPUT, formatArrayExport('allowedSvGeneratedWords', allowedWords));
  fs.writeFileSync(COMMON_OUTPUT, formatArrayExport('commonSvGeneratedWords', commonWords));
  fs.writeFileSync(SEED_OUTPUT, formatArrayExport('seedWordsSvGenerated', seeds));
}

function buildReport(
  kellyWords: number,
  rawWords: number,
  allowedWords: string[],
  abbreviationFilter: AbbreviationFilterReport,
  neverAllowFilter: NeverAllowFilterReport,
  commonWords: string[],
  seedSource: SeedSource,
  seedCandidatesBeforeFilter: number,
  seedCandidates: SeedCandidate[],
  cefrDistribution: CefrDistribution,
  filteredExamples: FilteredWordExample[],
  filteredSeedExamples: SeedFilteredExample[],
): BuildWordlistsReport {
  return {
    kellyWords,
    rawWords,
    allowedWords: allowedWords.length,
    allowedWordsBeforeAbbrevFilter: abbreviationFilter.allowedWordsBefore,
    commonWords: commonWords.length,
    seedSource,
    seedCandidatesBeforeFilter,
    seedCandidates: seedCandidates.length,
    cefrDistribution,
    abbreviationFilter,
    neverAllowFilter,
    topSeeds: rankSeedCandidates(seedCandidates).slice(0, 20),
    randomAcceptedSeeds: pickRandomSeeds(seedCandidates, 20),
    filteredExamples: filteredExamples.slice(0, 20),
    filteredSeedExamples: filteredSeedExamples.slice(0, 20),
  };
}

function formatCefrDistribution(label: string, distribution: Partial<Record<CefrLevel, number>>) {
  console.log(`- ${label}:`);
  for (const level of CEFR_LEVELS) {
    console.log(`  - ${level}: ${distribution[level] ?? 0}`);
  }
}

function printReport(report: BuildWordlistsReport) {
  console.log('Wordlist build report');
  console.log(`- Kelly words: ${report.kellyWords}`);
  console.log(`- raw Hunspell words: ${report.rawWords}`);
  console.log(
    `- allowed words (Hunspell): ${report.allowedWords} (before abbreviation filter: ${report.allowedWordsBeforeAbbrevFilter})`,
  );
  console.log(`- common words (Kelly A1-B2): ${report.commonWords}`);
  console.log(
    `- filtered abbreviations/acronyms: ${report.abbreviationFilter.filteredAbbreviations}`,
  );
  if (report.abbreviationFilter.filteredAbbreviations > 0) {
    console.log('- filtered abbreviation examples:');
    for (const example of report.abbreviationFilter.filteredAbbrevExamples) {
      console.log(`  - ${example.word} (${example.reason})`);
    }
  }
  if (report.abbreviationFilter.keptAllowlistedAbbreviations.length > 0) {
    console.log(
      `- kept allowlisted abbreviations: ${report.abbreviationFilter.keptAllowlistedAbbreviations.join(', ')}`,
    );
  }
  console.log(`- filtered never-allow words: ${report.neverAllowFilter.filteredNeverAllow}`);
  if (report.neverAllowFilter.filteredNeverAllow > 0) {
    console.log('- filtered never-allow examples:');
    for (const example of report.neverAllowFilter.filteredNeverAllowExamples) {
      console.log(`  - ${example.word}`);
    }
  }
  formatCefrDistribution('CEFR distribution (all Kelly)', report.cefrDistribution.all);
  formatCefrDistribution('CEFR distribution (common)', report.cefrDistribution.common);
  console.log(`- seed source: ${report.seedSource}`);
  if (report.seedSource === 'allowed_fallback') {
    console.log('- seed source note: common words missing, using allowed fallback');
  }
  console.log(`- seed candidates before filter: ${report.seedCandidatesBeforeFilter}`);
  console.log(`- seed candidates after filter: ${report.seedCandidates}`);
  if (report.seedCandidates === 0) {
    console.log(
      `- seed warning: no seed words reached the minimum threshold of ${MINIMUM_SEED_PLAYABLE_WORDS} playable allowed words`,
    );
  }
  console.log('- top 20 prioritized seed words:');
  for (const seed of report.topSeeds) {
    const rankLabel = seed.kellyRank ? `rank ${seed.kellyRank}` : 'no Kelly rank';
    const cefrLabel = seed.cefr ?? 'no CEFR';
    console.log(
      `  - ${seed.word}: ${seed.playableWordCount} playable, ${rankLabel}, ${cefrLabel}, score ${Math.round(seed.score)} [${seed.source}]`,
    );
  }
  console.log('- 20 random accepted seeds:');
  for (const seed of report.randomAcceptedSeeds) {
    console.log(`  - ${seed.word}: ${seed.playableWordCount} [${seed.source}]`);
  }
  console.log('- 20 rejected seed examples:');
  for (const example of report.filteredSeedExamples) {
    console.log(`  - ${example.word} (${example.reason})`);
  }
  console.log('- filtered examples:');
  for (const example of report.filteredExamples) {
    console.log(`  - ${example.word} (${example.reason}, ${example.source})`);
  }
}

function main() {
  const hunspellEntries = loadHunspellEntries();
  const kellyEntries = loadKellyEntries();
  const filteredExamples: FilteredWordExample[] = [];
  const cefrDistribution: CefrDistribution = { all: {}, common: {} };
  const allowedWordsBeforeNeverAllow = filterAllowedWords(hunspellEntries, filteredExamples);
  const { report: neverAllowFilter, words: allowedWordsBeforeAbbrevFilter } = filterNeverAllowWords(
    allowedWordsBeforeNeverAllow,
    filteredExamples,
  );
  const kellyLemmas = buildKellyLemmaSet(kellyEntries);
  const { report: abbreviationFilter, words: allowedWords } = filterAllowedAbbreviations(
    allowedWordsBeforeAbbrevFilter,
    kellyLemmas,
    filteredExamples,
  );
  const { commonWords, kellyMetadata } = filterKellyToCommon(
    kellyEntries,
    filteredExamples,
    cefrDistribution,
  );
  const { seedSource, seedCandidatesBeforeFilter, seedCandidates, filteredSeedExamples } =
    buildSeedCandidates(commonWords, allowedWords, kellyMetadata);
  writeGeneratedFiles(
    allowedWords,
    commonWords,
    seedCandidates.map((candidate) => candidate.word),
  );

  const report = buildReport(
    kellyEntries.length,
    hunspellEntries.length,
    allowedWords,
    abbreviationFilter,
    neverAllowFilter,
    commonWords,
    seedSource,
    seedCandidatesBeforeFilter,
    seedCandidates,
    cefrDistribution,
    filteredExamples,
    filteredSeedExamples,
  );

  printReport(report);
}

main();
