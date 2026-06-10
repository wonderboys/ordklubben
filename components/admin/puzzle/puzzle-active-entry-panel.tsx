"use client";

import {
  adminButtonPrimaryClass,
  adminButtonSecondaryClass,
} from "@/components/admin/admin-ui";
import { PUZZLE_DIRECTION_LABELS } from "@/lib/content/constants";
import type { PuzzlePlacedEntry } from "@/components/admin/puzzle/puzzle-placed-entries-panel";
import { getPlacedEntryHintPreview } from "@/components/admin/puzzle/puzzle-placed-entries-panel";
import { cn } from "@/lib/utils";

type PuzzleActiveEntryPanelProps = {
  entry: PuzzlePlacedEntry;
  isEditing: boolean;
  onEditToggle: () => void;
};

export function PuzzleActiveEntryPanel({
  entry,
  isEditing,
  onEditToggle,
}: PuzzleActiveEntryPanelProps) {
  const hintText = getPlacedEntryHintPreview(entry) ?? "Saknar nyckel";

  return (
    <div className="space-y-3 p-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-print-muted">
          Aktivt ord
        </p>
        <p className="mt-1.5 text-xl font-bold uppercase tracking-wide text-print-ink">
          {entry.answerSnapshot}
        </p>
        <p className="mt-0.5 text-sm text-print-muted">
          {PUZZLE_DIRECTION_LABELS[entry.direction]} · rad {entry.row + 1}, kolumn{" "}
          {entry.col + 1}
        </p>
      </div>

      <div className="grid gap-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-print-muted">
          Nyckel
        </p>
        <p className="text-sm text-print-ink">{hintText}</p>
      </div>

      <button
        type="button"
        onClick={onEditToggle}
        className={cn(isEditing ? adminButtonSecondaryClass : adminButtonPrimaryClass)}
      >
        {isEditing ? "Stäng redigering" : "Redigera ord"}
      </button>
    </div>
  );
}

export function PuzzleBlockedCellPanel({
  row,
  col,
}: {
  row: number;
  col: number;
}) {
  return (
    <div className="space-y-2 rounded-sm border border-print-ink/15 border-l-2 border-l-print-ink bg-print-bg/50 p-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-print-muted">
          Blockerad ruta
        </p>
        <p className="mt-1.5 text-sm text-print-ink">
          Rad {row + 1}, kolumn {col + 1}
        </p>
      </div>
      <p className="text-sm text-print-muted">
        Aktivera &quot;Blockera rutor&quot; och klicka på rutan för att ta bort blockeringen.
      </p>
    </div>
  );
}

export function PuzzleBlockModePanel() {
  return (
    <div className="rounded-sm border border-dashed border-print-ink/15 bg-print-bg/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-print-muted">
        Blockeringsläge
      </p>
      <p className="mt-2 text-sm text-print-muted">
        Klicka på en tom ruta för att blockera den, eller på en blockerad ruta för att ta bort
        blockeringen. Avmarkera &quot;Blockera rutor&quot; för att återgå till ordplacering.
      </p>
    </div>
  );
}
