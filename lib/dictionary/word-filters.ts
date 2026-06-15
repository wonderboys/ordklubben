import { normalizeSwedish } from './normalize-swedish';
import type {
  CefrLevel,
  FilterReason,
  FilteredWordExample,
  KellyEntry,
  KellyWordMetadata,
  RawWordSource,
  SeedCandidate,
  WordEntry,
} from './wordlist-types';

export const ALLOWED_CEFR_LEVELS = new Set<CefrLevel>(['A1', 'A2', 'B1', 'B2']);

export const ABBREV_CONSONANT_BLOCK_PATTERN = /^[bcdfghjklmnpqrstvwxz]{3,5}$/;
export const ABBREV_ORG_PATTERN = /^[bcdfghjklmnpqrstvwxz]{2,4}a$/;

export const CEFR_PRIORITY_SCORE: Record<CefrLevel, number> = {
  A1: 40,
  A2: 30,
  B1: 20,
  B2: 10,
  C1: 0,
  C2: 0,
};

const SWEDISH_LETTER_PATTERN = /^[a-zåäö]+$/;
const PROPER_NOUN_PATTERN = /^[A-ZÅÄÖ][a-zåäö]+$/;
const UPPERCASE_WORD_PATTERN = /^[A-ZÅÄÖ]+$/;
const VERB_LIKE_ENDINGS = ['ade', 'ande', 'ar', 'at', 'er', 'or', 'ade', 'ast', 'ing'];
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

function hasDigits(value: string) {
  return /\d/.test(value);
}

function hasWhitespace(value: string) {
  return /\s/.test(value);
}

function hasDisallowedSymbols(value: string) {
  return /[^A-Za-zÅÄÖåäö]/.test(value);
}

export function cleanRawWord(rawValue: string) {
  return rawValue.trim().replace(/^\uFEFF/, '');
}

export function normalizeWordCandidate(rawValue: string) {
  return normalizeSwedish(cleanRawWord(rawValue));
}

export function detectBaseFilterReason(
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

  if (!SWEDISH_LETTER_PATTERN.test(normalizedWord)) {
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

export function looksLikeProperNoun(rawValue: string) {
  const trimmed = cleanRawWord(rawValue);

  if (!trimmed) {
    return false;
  }

  if (PROPER_NOUN_PATTERN.test(trimmed)) {
    return true;
  }

  return false;
}

export function isAllUppercaseWord(rawValue: string) {
  const trimmed = cleanRawWord(rawValue);
  return UPPERCASE_WORD_PATTERN.test(trimmed);
}

export function filterWordEntry(
  entry: WordEntry,
  options: { minLength: number; maxLength?: number; rejectProperNouns?: boolean },
): { ok: true; word: string } | { ok: false; reason: FilterReason } {
  const normalizedWord = normalizeWordCandidate(entry.raw);
  const baseReason = detectBaseFilterReason(entry.raw, normalizedWord, options);

  if (baseReason) {
    return { ok: false, reason: baseReason };
  }

  if (
    options.rejectProperNouns &&
    looksLikeProperNoun(entry.raw) &&
    !isAllUppercaseWord(entry.raw)
  ) {
    return { ok: false, reason: 'proper_noun' };
  }

  return { ok: true, word: normalizedWord };
}

export function recordFilteredWord(
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

export function isObviousPhrase(rawValue: string) {
  const trimmed = cleanRawWord(rawValue);

  return (
    hasWhitespace(trimmed) || /[()]/.test(trimmed) || /[/\\]/.test(trimmed) || trimmed.includes('…')
  );
}

export function isKellyProperName(entry: KellyEntry) {
  if (/proper\s*name/i.test(entry.wordClass)) {
    return true;
  }

  return looksLikeProperNoun(entry.lemma) && !isAllUppercaseWord(entry.lemma);
}

export function scoreKellyFrequency(rank: number | null) {
  if (!rank || rank < 1) {
    return 0;
  }

  return Math.max(0, 100 - rank / 50);
}

export function scoreSeedCandidate(candidate: SeedCandidate) {
  const diversityScore = new Set(candidate.word.split('')).size;
  const penalty = isVerbLikeSeed(candidate.word) ? 3 : 0;
  const preferredBonus = candidate.source === 'preferred' ? 1000 : 0;
  const playabilityScore = candidate.playableWordCount * 10;
  const frequencyScore = scoreKellyFrequency(candidate.kellyRank);
  const cefrScore = candidate.cefr ? CEFR_PRIORITY_SCORE[candidate.cefr] : 0;

  return playabilityScore + frequencyScore + cefrScore + diversityScore - penalty + preferredBonus;
}

export function rankSeedCandidates(candidates: SeedCandidate[]) {
  return [...candidates].sort((a, b) => {
    return (
      b.score - a.score ||
      b.playableWordCount - a.playableWordCount ||
      (a.kellyRank ?? Number.MAX_SAFE_INTEGER) - (b.kellyRank ?? Number.MAX_SAFE_INTEGER) ||
      a.word.localeCompare(b.word, 'sv-SE')
    );
  });
}

export function isVerbLikeSeed(word: string) {
  return VERB_LIKE_ENDINGS.some((ending) => word.endsWith(ending));
}

export function isPlaceholderSeed(word: string) {
  return PLACEHOLDER_SEEDS.has(word);
}

export function sortSeedsByPlayability(candidates: SeedCandidate[]) {
  const scored = candidates.map((candidate) => ({
    ...candidate,
    score: scoreSeedCandidate(candidate),
  }));

  return rankSeedCandidates(scored);
}

export function buildKellyMetadataMap(
  entries: Array<{ word: string; rank: number; cefr: CefrLevel; wpm: number | null }>,
) {
  const metadata = new Map<string, KellyWordMetadata>();

  for (const entry of entries) {
    metadata.set(entry.word, {
      rank: entry.rank,
      cefr: entry.cefr,
      wpm: entry.wpm,
    });
  }

  return metadata;
}

export function matchesAbbreviationPattern(word: string) {
  return ABBREV_CONSONANT_BLOCK_PATTERN.test(word) || ABBREV_ORG_PATTERN.test(word);
}

export function detectAllowedAbbreviationFilterReason(
  word: string,
  kellyLemmas: ReadonlySet<string>,
  allowedAbbreviations: ReadonlySet<string>,
): Extract<FilterReason, 'abbrev_consonant_block' | 'abbrev_org_pattern'> | null {
  if (word.length < 3 || word.length > 5) {
    return null;
  }

  if (kellyLemmas.has(word)) {
    return null;
  }

  if (/[åäö]/.test(word)) {
    return null;
  }

  if (allowedAbbreviations.has(word)) {
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

export function filterAllowedAbbreviations(
  words: string[],
  kellyLemmas: ReadonlySet<string>,
  allowedAbbreviations: ReadonlySet<string>,
  filteredExamples: FilteredWordExample[],
) {
  const kept: string[] = [];
  const keptAllowlisted: string[] = [];

  for (const word of words) {
    const reason = detectAllowedAbbreviationFilterReason(word, kellyLemmas, allowedAbbreviations);

    if (reason) {
      recordFilteredWord(filteredExamples, word, reason, 'hunspell');
      continue;
    }

    kept.push(word);

    if (
      allowedAbbreviations.has(word) &&
      !kellyLemmas.has(word) &&
      matchesAbbreviationPattern(word)
    ) {
      keptAllowlisted.push(word);
    }
  }

  return {
    words: kept,
    keptAllowlistedAbbreviations: keptAllowlisted.sort((a, b) => a.localeCompare(b, 'sv-SE')),
  };
}
