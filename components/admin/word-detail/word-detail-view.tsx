import type { HintCandidateStatus, LexicalEntryType, WordRelationType } from '@prisma/client';
import {
  WordKeysSection,
  WordLanguagePanel,
  WordLexiconPanel,
  WordMediaPanel,
  WordOverviewSection,
  WordPlaceholderSection,
  WordRebusPanel,
  WordRelationsPanel,
  WordThemesSection,
} from '@/components/admin/word-detail/sections';
import { WordDetailTabs } from '@/components/admin/word-detail/word-detail-tabs';
import type { WordDetailTab } from '@/lib/content/word-detail-path';
import type {
  AvailableTheme,
  WordDetailData,
  WordPickerWord,
} from '@/components/admin/word-detail/types';

export function WordDetailView({
  word,
  availableThemes,
  wordPickerWords,
  activeTab,
  candidateStatus,
  entryType,
  relationType,
}: {
  word: WordDetailData;
  availableThemes: AvailableTheme[];
  wordPickerWords: WordPickerWord[];
  activeTab: WordDetailTab;
  candidateStatus?: HintCandidateStatus;
  entryType?: LexicalEntryType;
  relationType?: WordRelationType;
}) {
  const wordPickerOptions = wordPickerWords.map((entry) => ({
    id: entry.id,
    answer: entry.answer,
    length: entry.length,
    status: entry.status,
  }));

  return (
    <div>
      <WordDetailTabs wordId={word.id} activeTab={activeTab} />

      <div className="pt-8">
        {activeTab === 'overview' ? <WordOverviewSection word={word} /> : null}
        {activeTab === 'language' ? <WordLanguagePanel word={word} /> : null}
        {activeTab === 'lexicon' ? <WordLexiconPanel word={word} entryType={entryType} /> : null}
        {activeTab === 'relations' ? (
          <WordRelationsPanel
            word={word}
            wordOptions={wordPickerOptions}
            relationType={relationType}
          />
        ) : null}
        {activeTab === 'keys' ? (
          <WordKeysSection word={word} candidateStatus={candidateStatus} />
        ) : null}
        {activeTab === 'rebus' ? <WordRebusPanel word={word} /> : null}
        {activeTab === 'media' ? <WordMediaPanel word={word} /> : null}
        {activeTab === 'themes' ? (
          <WordThemesSection word={word} availableThemes={availableThemes} />
        ) : null}
        {activeTab === 'history' ? (
          <WordPlaceholderSection message="Historik kommer senare." />
        ) : null}
        {activeTab === 'statistics' ? (
          <WordPlaceholderSection message="Statistik kommer senare." />
        ) : null}
      </div>
    </div>
  );
}
