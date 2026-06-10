"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ContentStatus } from "@prisma/client";
import { AdminPagination } from "@/components/admin/admin-list-ui";
import {
  AdminActionGroup,
  SelectInput,
  StatusBadge,
  SubmitButton,
  adminButtonTertiaryClass,
} from "@/components/admin/admin-ui";
import {
  bulkAddThemeToWords,
  bulkApproveWords,
  bulkDraftWords,
  bulkRemoveThemeFromWords,
} from "@/lib/content/actions";
import type { AdminPageSize } from "@/lib/content/admin-list";
import { cn } from "@/lib/utils";

type WordRow = {
  id: string;
  answer: string;
  status: ContentStatus;
  updatedAt: string;
  hintCount: number;
  candidateCount: number;
  themeCount: number;
};

type ThemeOption = {
  id: string;
  name: string;
};

type WordsBulkTableProps = {
  words: WordRow[];
  themes: ThemeOption[];
  returnTo: string;
  page: number;
  pageSize: AdminPageSize;
  total: number;
  listQuery: Record<string, string | undefined>;
};

const adminCheckboxClass = "relative top-0.5 size-4 rounded-sm border border-print-ink/20";

function HiddenBulkFields({
  wordIds,
  returnTo,
}: {
  wordIds: string[];
  returnTo: string;
}) {
  return (
    <>
      <input type="hidden" name="returnTo" value={returnTo} />
      {wordIds.map((wordId) => (
        <input key={wordId} type="hidden" name="wordIds" value={wordId} />
      ))}
    </>
  );
}

function WordsBulkActionBar({
  selectedIds,
  selectedWords,
  themes,
  returnTo,
  onClear,
}: {
  selectedIds: string[];
  selectedWords: Array<{ id: string; status: ContentStatus }>;
  themes: ThemeOption[];
  returnTo: string;
  onClear: () => void;
}) {
  const countLabel =
    selectedIds.length === 1 ? "1 ord markerat" : `${selectedIds.length} ord markerade`;

  const allApproved =
    selectedWords.length > 0 && selectedWords.every((word) => word.status === "APPROVED");
  const allDraft =
    selectedWords.length > 0 && selectedWords.every((word) => word.status === "DRAFT");

  return (
    <div className="mb-4 rounded-sm border border-print-ink/15 bg-print-ink/[0.03] px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="shrink-0 text-sm font-medium text-print-ink">{countLabel}</p>

        <AdminActionGroup>
          <form action={bulkApproveWords} className="inline-flex">
            <HiddenBulkFields wordIds={selectedIds} returnTo={returnTo} />
            <SubmitButton variant="primary" disabled={allApproved}>
              Godkänn
            </SubmitButton>
          </form>
          <form action={bulkDraftWords} className="inline-flex">
            <HiddenBulkFields wordIds={selectedIds} returnTo={returnTo} />
            <SubmitButton variant="secondary" disabled={allDraft}>
              Sätt som utkast
            </SubmitButton>
          </form>
          <form action={bulkAddThemeToWords} className="inline-flex items-center gap-2">
            <HiddenBulkFields wordIds={selectedIds} returnTo={returnTo} />
            <SelectInput name="themeId" defaultValue="" className="min-w-36" required>
              <option value="" disabled>
                Välj tema
              </option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </SelectInput>
            <SubmitButton variant="secondary">Lägg till tema</SubmitButton>
          </form>
          <form action={bulkRemoveThemeFromWords} className="inline-flex items-center gap-2">
            <HiddenBulkFields wordIds={selectedIds} returnTo={returnTo} />
            <SelectInput name="themeId" defaultValue="" className="min-w-36" required>
              <option value="" disabled>
                Välj tema
              </option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </SelectInput>
            <SubmitButton variant="secondary">Ta bort tema</SubmitButton>
          </form>
          <button type="button" onClick={onClear} className={adminButtonTertiaryClass}>
            Rensa markering
          </button>
        </AdminActionGroup>
      </div>
    </div>
  );
}

export function WordsBulkTable({
  words,
  themes,
  returnTo,
  page,
  pageSize,
  total,
  listQuery,
}: WordsBulkTableProps) {
  const [selectedById, setSelectedById] = useState<Map<string, ContentStatus>>(new Map());
  const selectedIds = useMemo(() => [...selectedById.keys()], [selectedById]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const allPageSelected =
    words.length > 0 && words.every((word) => selectedSet.has(word.id));

  const selectedWords = useMemo(
    () =>
      selectedIds.map((id) => ({
        id,
        status: selectedById.get(id) ?? "DRAFT",
      })),
    [selectedById, selectedIds],
  );

  function toggleWord(word: WordRow) {
    setSelectedById((current) => {
      const next = new Map(current);
      if (next.has(word.id)) {
        next.delete(word.id);
      } else {
        next.set(word.id, word.status);
      }
      return next;
    });
  }

  function toggleAllOnPage() {
    if (allPageSelected) {
      const pageIds = new Set(words.map((word) => word.id));
      setSelectedById((current) => {
        const next = new Map(current);
        for (const id of pageIds) {
          next.delete(id);
        }
        return next;
      });
      return;
    }

    setSelectedById((current) => {
      const next = new Map(current);
      for (const word of words) {
        next.set(word.id, word.status);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedById(new Map());
  }

  return (
    <>
      {selectedIds.length > 0 ? (
        <WordsBulkActionBar
          selectedIds={selectedIds}
          selectedWords={selectedWords}
          themes={themes}
          returnTo={returnTo}
          onClear={clearSelection}
        />
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-print-ink/10">
              <th className="w-10 px-2.5 py-2 align-middle">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleAllOnPage}
                  aria-label="Markera alla på sidan"
                  className={adminCheckboxClass}
                />
              </th>
              {["Ord", "Status", "Nycklar", "Förslag", "Teman", "Uppdaterad"].map((header) => (
                <th
                  key={header}
                  className="px-2.5 py-2 text-xs font-medium uppercase tracking-[0.04em] text-print-muted"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {words.map((word) => {
              const isSelected = selectedSet.has(word.id);

              return (
                <tr
                  key={word.id}
                  className={cn(
                    "border-b border-print-ink/10 align-top",
                    isSelected ? "bg-print-ink/[0.03]" : null,
                  )}
                >
                  <td className="px-2.5 py-2 align-middle">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleWord(word)}
                      aria-label={`Markera ${word.answer}`}
                      className={adminCheckboxClass}
                    />
                  </td>
                  <td className="px-2.5 py-2 font-medium text-print-ink">
                    <Link
                      href={`/admin/words/${word.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {word.answer}
                    </Link>
                  </td>
                  <td className="px-2.5 py-2">
                    <StatusBadge status={word.status} />
                  </td>
                  <td className="px-2.5 py-2">{word.hintCount}</td>
                  <td className="px-2.5 py-2">{word.candidateCount}</td>
                  <td className="px-2.5 py-2">{word.themeCount}</td>
                  <td className="px-2.5 py-2 text-print-muted">
                    {new Date(word.updatedAt).toLocaleDateString("sv-SE")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {words.length === 0 ? (
        <p className="mt-3 text-sm text-print-muted">Inga ord matchade filtret.</p>
      ) : (
        <AdminPagination
          pathname="/admin/words"
          page={page}
          pageSize={pageSize}
          total={total}
          query={listQuery}
        />
      )}
    </>
  );
}
