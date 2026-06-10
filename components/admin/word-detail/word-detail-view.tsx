import type { HintCandidateStatus } from "@prisma/client";
import {
  WordKeysSection,
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
}: {
  word: WordDetailData;
  availableThemes: AvailableTheme[];
  activeTab: WordDetailTab;
  candidateStatus?: HintCandidateStatus;
}) {
  return (
    <div>
      <WordDetailTabs wordId={word.id} activeTab={activeTab} />

      <div className="pt-8">
        {activeTab === "overview" ? <WordOverviewSection word={word} /> : null}
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
