"use client";

import type { PuzzleDirection } from "@prisma/client";
import { AdminStatusBadge } from "@/components/admin/admin-ui";
import { PUZZLE_DIRECTION_LABELS } from "@/lib/content/constants";
import { getAnswerLength } from "@/lib/content/puzzle/grid";
import { cn } from "@/lib/utils";

export type PuzzlePlacedEntryHint = {
  id: string;
  text: string;
  status: "DRAFT" | "APPROVED" | "REJECTED";
  type: "DEFINITION" | "SYNONYM" | "ASSOCIATION" | "WORDPLAY" | "THEME" | "OTHER";
  difficulty: number | null;
};

export type PuzzlePlacedEntry = {
  id: string;
  wordId: string;
  answerSnapshot: string;
  hintId: string | null;
  hintSnapshot: string | null;
  hintText: string | null;
  hintType: "DEFINITION" | "SYNONYM" | "ASSOCIATION" | "WORDPLAY" | "THEME" | "OTHER" | null;
  hintStatus: "DRAFT" | "APPROVED" | "REJECTED" | null;
  row: number;
  col: number;
  direction: PuzzleDirection;
  number: number | null;
  availableHints: PuzzlePlacedEntryHint[];
};

export function entryMissingHint(entry: Pick<PuzzlePlacedEntry, "hintId" | "hintSnapshot">) {
  return !entry.hintId && !entry.hintSnapshot;
}

export function countEntriesMissingHint(
  entries: Array<Pick<PuzzlePlacedEntry, "hintId" | "hintSnapshot">>,
) {
  return entries.filter(entryMissingHint).length;
}

export function getPlacedEntryHintPreview(entry: PuzzlePlacedEntry) {
  if (entryMissingHint(entry)) {
    return null;
  }

  return entry.hintSnapshot ?? entry.hintText ?? null;
}

function formatPlacedEntryMeta(entry: PuzzlePlacedEntry) {
  const length = getAnswerLength(entry.answerSnapshot);

  return `${PUZZLE_DIRECTION_LABELS[entry.direction]} · rad ${entry.row + 1}, kolumn ${entry.col + 1} · ${length} bokstäver`;
}

function sortPlacedEntries(entries: PuzzlePlacedEntry[]) {
  return [...entries].sort((left, right) => {
    const leftNumber = left.number ?? Number.POSITIVE_INFINITY;
    const rightNumber = right.number ?? Number.POSITIVE_INFINITY;

    if (leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }

    if (left.row !== right.row) {
      return left.row - right.row;
    }

    if (left.col !== right.col) {
      return left.col - right.col;
    }

    return left.answerSnapshot.localeCompare(right.answerSnapshot, "sv-SE");
  });
}

type PuzzlePlacedEntriesPanelProps = {
  entries: PuzzlePlacedEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entryId: string) => void;
  disabled?: boolean;
  className?: string;
};

export function PuzzlePlacedEntriesPanel({
  entries,
  selectedEntryId,
  onSelectEntry,
  disabled = false,
  className,
}: PuzzlePlacedEntriesPanelProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-print-muted">Inga ord placerade ännu.</p>;
  }

  const sortedEntries = sortPlacedEntries(entries);

  return (
    <ul
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-1.5",
        disabled && "pointer-events-none opacity-45",
        className,
      )}
    >
      {sortedEntries.map((entry) => {
        const isSelected = !disabled && selectedEntryId === entry.id;
        const missingHint = entryMissingHint(entry);
        const hintPreview = getPlacedEntryHintPreview(entry);
        const meta = formatPlacedEntryMeta(entry);

        return (
          <li key={entry.id} className="min-h-0">
            <button
              type="button"
              data-puzzle-entry-id={entry.id}
              disabled={disabled}
              onClick={() => onSelectEntry(entry.id)}
              className={cn(
                "flex w-full cursor-pointer flex-col gap-1 rounded-sm border px-3 py-2.5 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-print-ink/25 focus-visible:ring-offset-1",
                isSelected
                  ? "border-print-ink/25 border-l-2 border-l-print-ink bg-print-bg/70 shadow-sm"
                  : "border-print-ink/10 bg-print-surface hover:border-print-ink/20 hover:bg-print-ink/[0.04] active:bg-print-ink/[0.06]",
              )}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "w-5 shrink-0 text-xs font-semibold tabular-nums",
                    isSelected ? "text-print-ink" : "text-print-muted",
                  )}
                >
                  {entry.number ?? "–"}
                </span>
                <span className="truncate text-sm font-semibold uppercase tracking-wide text-print-ink">
                  {entry.answerSnapshot}
                </span>
              </div>
              <p className="pl-7 text-xs text-print-muted">{meta}</p>
              {missingHint ? (
                <div className="pl-7">
                  <AdminStatusBadge tone="warning">Saknar nyckel</AdminStatusBadge>
                </div>
              ) : (
                <p className="line-clamp-2 pl-7 text-sm text-print-ink/80">{hintPreview}</p>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
