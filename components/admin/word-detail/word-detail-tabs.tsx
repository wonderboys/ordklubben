import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  WORD_DETAIL_TABS,
  type WordDetailTab,
  wordDetailHref,
} from "@/lib/content/word-detail-path";

const TAB_LABELS: Record<WordDetailTab, string> = {
  overview: "Översikt",
  lexicon: "Lexikon",
  keys: "Nycklar",
  themes: "Teman",
  history: "Historik",
  statistics: "Statistik",
};

export function WordDetailTabs({
  wordId,
  activeTab,
}: {
  wordId: string;
  activeTab: WordDetailTab;
}) {
  return (
    <nav
      aria-label="Ordvyer"
      className="-mb-px flex gap-1 overflow-x-auto border-b border-print-ink/10"
    >
      {WORD_DETAIL_TABS.map((tab) => {
        const isActive = tab === activeTab;

        return (
          <Link
            key={tab}
            href={wordDetailHref(wordId, tab)}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm no-underline transition-colors",
              isActive
                ? "border-print-ink font-medium text-print-ink"
                : "border-transparent text-print-muted hover:border-print-ink/20 hover:text-print-ink",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {TAB_LABELS[tab]}
          </Link>
        );
      })}
    </nav>
  );
}
