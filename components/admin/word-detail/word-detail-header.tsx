import {
  AdminBreadcrumb,
  StatusBadge,
} from "@/components/admin/admin-ui";
import type { WordDetailData } from "@/components/admin/word-detail/types";
import { formatPartOfSpeech, formatWordSource } from "@/lib/content/constants";

function formatCount(count: number, singular: string, plural: string) {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

export function WordDetailHeader({ word }: { word: WordDetailData }) {
  const pendingCount = word.hintCandidates.filter(
    (proposal) => proposal.status === "PENDING",
  ).length;

  const summaryParts = [
    formatWordSource(word.source),
    word.languageData?.partOfSpeech
      ? formatPartOfSpeech(word.languageData.partOfSpeech)
      : null,
    formatCount(word.lexicalEntries.length, "lexikal post", "lexikala poster"),
    formatCount(word.relations.length, "relation", "relationer"),
    formatCount(word.hints.length, "nyckel", "nycklar"),
    pendingCount > 0
      ? `${formatCount(word.hintCandidates.length, "förslag", "förslag")} (${pendingCount} väntar)`
      : formatCount(word.hintCandidates.length, "förslag", "förslag"),
    formatCount(word.themes.length, "tema", "teman"),
  ];

  return (
    <header className="border-b border-print-ink/10 pb-4">
      <AdminBreadcrumb
        items={[
          { label: "Ord", href: "/admin/words" },
          { label: word.answer },
        ]}
      />
      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-print-ink sm:text-3xl">
            {word.answer}
          </h1>
          <StatusBadge status={word.status} />
        </div>
        <p className="text-sm text-print-muted">
          {summaryParts.filter(Boolean).join(" · ")}
        </p>
      </div>
    </header>
  );
}
