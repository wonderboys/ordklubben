import type { HintCandidateStatus, LexicalEntryType } from "@prisma/client";
import {
  WordKeysSection,
  WordLexiconPanel,
  WordOverviewSection,
  WordPlaceholderSection,
  WordThemesSection,
} from "@/components/admin/word-detail/sections";
import { WordDetailTabs } from "@/components/admin/word-detail/word-detail-tabs";
import type { WordDetailTab } from "@/lib/content/word-detail-path";
import type { AvailableTheme, WordDetailData } from "@/components/admin/word-detail/types";

export function WordDetailView({
  word,
  availableThemes,
  activeTab,
  candidateStatus,
  entryType,
}: {
  word: WordDetailData;
  availableThemes: AvailableTheme[];
  activeTab: WordDetailTab;
  candidateStatus?: HintCandidateStatus;
  entryType?: LexicalEntryType;
}) {
  return (
    <div>
      <WordDetailTabs wordId={word.id} activeTab={activeTab} />

      <div className="pt-8">
        {activeTab === "overview" ? <WordOverviewSection word={word} /> : null}
        {activeTab === "lexicon" ? (
          <WordLexiconPanel word={word} entryType={entryType} />
        ) : null}
        {activeTab === "keys" ? (
          <WordKeysSection word={word} candidateStatus={candidateStatus} />
        ) : null}
        {activeTab === "themes" ? (
          <WordThemesSection word={word} availableThemes={availableThemes} />
        ) : null}
        {activeTab === "history" ? (
          <WordPlaceholderSection message="Historik kommer senare." />
        ) : null}
        {activeTab === "statistics" ? (
          <WordPlaceholderSection message="Statistik kommer senare." />
        ) : null}
      </div>
    </div>
  );
}
