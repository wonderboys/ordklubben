import { ChevronDown } from "lucide-react";
import {
  AdminDefinitionList,
  AdminPanel,
  adminButtonTertiaryClass,
} from "@/components/admin/admin-ui";
import { WordManagementActions } from "@/components/admin/word-detail/word-management-actions";
import {
  formatWordSourceWithReference,
} from "@/lib/content/constants";
import type { WordDetailData } from "@/components/admin/word-detail/types";
import { cn } from "@/lib/utils";

const ADVANCED_WORD_ID = "advanced-word-fields";

function formatDate(date: Date) {
  return date.toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

export function WordMetadataPanel({
  word,
  showEditAction = true,
}: {
  word: WordDetailData;
  showEditAction?: boolean;
}) {
  const advancedItems: Array<{ label: string; value: string | number }> = [];

  if (word.difficulty != null) {
    advancedItems.push({ label: "Svårighet (legacy)", value: word.difficulty });
  }

  if (word.crosswordScore != null) {
    advancedItems.push({ label: "Korsordspoäng (legacy)", value: word.crosswordScore });
  }

  return (
    <>
      <AdminDefinitionList
        items={[
          {
            label: "Källa",
            value: formatWordSourceWithReference(word.source, word.sourceReference),
          },
          { label: "Språk", value: word.language },
          { label: "Längd", value: `${word.length} tecken` },
          {
            label: "Normaliserat",
            value: (
              <span className="font-mono text-xs uppercase">{word.normalizedAnswer}</span>
            ),
          },
          { label: "Skapad", value: formatDate(word.createdAt) },
          { label: "Uppdaterad", value: formatDate(word.updatedAt) },
        ]}
      />

      {advancedItems.length > 0 ? (
        <>
          <input id={ADVANCED_WORD_ID} type="checkbox" className="peer/advanced sr-only" />
          <div className="mt-3 peer-checked/advanced:[&_svg]:rotate-180">
            <label
              htmlFor={ADVANCED_WORD_ID}
              className={cn(adminButtonTertiaryClass, "inline-flex items-center gap-1.5")}
            >
              <ChevronDown aria-hidden className="size-3.5 shrink-0 transition-transform" />
              Avancerade fält
            </label>
          </div>
          <div className="mt-3 hidden peer-checked/advanced:block">
            <AdminDefinitionList items={advancedItems} />
            <p className="mt-2 text-xs text-print-muted">
              Dessa fält används inte i vanlig redigering. Svårighet hör främst till nycklar och
              spelkontext.
            </p>
          </div>
        </>
      ) : null}

      {showEditAction && word.status !== "ARCHIVED" ? (
        <WordManagementActions word={word} />
      ) : null}
    </>
  );
}

export function WordMetadataOverviewCard({ word }: { word: WordDetailData }) {
  return (
    <AdminPanel title="Ord">
      <WordMetadataPanel word={word} />
    </AdminPanel>
  );
}
