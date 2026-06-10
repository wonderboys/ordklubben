import {
  AdminLinkButton,
  AdminPanel,
  AdminPanelEmpty,
} from "@/components/admin/admin-ui";
import { wordDetailHref } from "@/lib/content/word-detail-path";
import type { WordDetailData } from "@/components/admin/word-detail/types";
import { WordMetadataOverviewCard } from "./word-metadata-section";

function formatCount(count: number, singular: string, plural: string) {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

export function WordOverviewSection({ word }: { word: WordDetailData }) {
  const pendingCount = word.hintCandidates.filter(
    (proposal) => proposal.status === "PENDING",
  ).length;
  const latestHint = word.hints[0];
  const themeNames = word.themes.map(({ theme }) => theme.name);

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
      <AdminPanel
        title="Nycklar"
        footer={
          <AdminLinkButton href={wordDetailHref(word.id, "keys")} variant="secondary">
            Hantera nycklar
          </AdminLinkButton>
        }
      >
        <div className="space-y-3 text-sm">
          <div className="space-y-1 text-print-ink">
            <p>{formatCount(word.hints.length, "nyckel", "nycklar")}</p>
            <p className="text-print-muted">
              {formatCount(pendingCount, "väntande förslag", "väntande förslag")}
            </p>
          </div>

          {latestHint ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.04em] text-print-muted">
                Senaste nyckel
              </p>
              <p className="mt-1 leading-relaxed text-print-ink">{latestHint.text}</p>
            </div>
          ) : null}
        </div>
      </AdminPanel>

      <AdminPanel
        title="Teman"
        footer={
          <AdminLinkButton href={wordDetailHref(word.id, "themes")} variant="secondary">
            Hantera teman
          </AdminLinkButton>
        }
      >
        {themeNames.length > 0 ? (
          <div className="space-y-3 text-sm">
            <p className="text-print-ink">
              {formatCount(themeNames.length, "tema", "teman")}
            </p>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.04em] text-print-muted">
                Valda teman
              </p>
              <p className="mt-1 leading-relaxed text-print-ink">{themeNames.join(", ")}</p>
            </div>
          </div>
        ) : (
          <AdminPanelEmpty message="Det här ordet är inte kopplat till några teman än." />
        )}
      </AdminPanel>

      <WordMetadataOverviewCard word={word} />
    </div>
  );
}
