import type { ContentStatus } from '@prisma/client';

export type WordSourceRecordSnapshot = {
  sourceKey: string;
  sourceReference: string | null;
  observedAnswer: string | null;
  frequency: number | null;
  rank: number | null;
  cefr: string | null;
  isExcluded: boolean;
};

export type WordEditorialOverrideSnapshot = {
  answer: string | null;
  status: ContentStatus | null;
  difficulty: number | null;
  frequency: number | null;
  crosswordScore: number | null;
  notes: string | null;
};

export type WordCanonicalSnapshot = {
  answer: string;
  status: ContentStatus;
  source: string;
  sourceReference: string | null;
  difficulty: number | null;
  frequency: number | null;
  crosswordScore: number | null;
  notes: string | null;
};

const SOURCE_PRIORITY = ['manual_curated', 'kelly-cefr', 'kelly', 'hunspell'] as const;

function getSourcePriority(sourceKey: string) {
  const index = SOURCE_PRIORITY.indexOf(sourceKey as (typeof SOURCE_PRIORITY)[number]);
  return index === -1 ? SOURCE_PRIORITY.length : index;
}

export function sortWordSourceRecords(records: WordSourceRecordSnapshot[]) {
  return [...records].sort((left, right) => {
    const priorityDiff = getSourcePriority(left.sourceKey) - getSourcePriority(right.sourceKey);

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    if ((left.rank ?? Number.MAX_SAFE_INTEGER) !== (right.rank ?? Number.MAX_SAFE_INTEGER)) {
      return (left.rank ?? Number.MAX_SAFE_INTEGER) - (right.rank ?? Number.MAX_SAFE_INTEGER);
    }

    return (left.sourceReference ?? '').localeCompare(right.sourceReference ?? '', 'sv-SE');
  });
}

export function pickPrimaryWordSourceRecord(records: WordSourceRecordSnapshot[]) {
  return sortWordSourceRecords(records.filter((record) => !record.isExcluded))[0] ?? null;
}

export function pickFrequencySourceRecord(records: WordSourceRecordSnapshot[]) {
  const eligible = records.filter((record) => !record.isExcluded && record.frequency != null);

  return sortWordSourceRecords(eligible)[0] ?? null;
}

export function resolveCanonicalWord(options: {
  normalizedAnswer: string;
  currentWord: {
    answer: string;
    status: ContentStatus;
    source: string;
    sourceReference: string | null;
    difficulty: number | null;
    frequency: number | null;
    crosswordScore: number | null;
    notes: string | null;
  };
  sourceRecords: WordSourceRecordSnapshot[];
  editorialOverride: WordEditorialOverrideSnapshot | null;
}): WordCanonicalSnapshot {
  const primarySource = pickPrimaryWordSourceRecord(options.sourceRecords);
  const frequencySource = pickFrequencySourceRecord(options.sourceRecords);
  const editorial = options.editorialOverride;

  return {
    answer:
      editorial?.answer?.trim() ||
      primarySource?.observedAnswer?.trim() ||
      options.currentWord.answer ||
      options.normalizedAnswer,
    status: editorial?.status ?? options.currentWord.status,
    source: primarySource ? 'import' : options.currentWord.source,
    sourceReference: primarySource
      ? [primarySource.sourceKey, primarySource.sourceReference].filter(Boolean).join(':') || null
      : options.currentWord.sourceReference,
    difficulty: editorial?.difficulty ?? options.currentWord.difficulty,
    frequency: editorial?.frequency ?? frequencySource?.frequency ?? options.currentWord.frequency,
    crosswordScore: editorial?.crosswordScore ?? options.currentWord.crosswordScore,
    notes: editorial?.notes ?? options.currentWord.notes,
  };
}
