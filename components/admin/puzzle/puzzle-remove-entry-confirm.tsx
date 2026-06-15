'use client';

import { useEffect, useRef } from 'react';
import { adminButtonSecondaryClass } from '@/components/admin/admin-ui';
import { removePuzzleEntry } from '@/lib/content/puzzle-actions';
import { cn } from '@/lib/utils';

const adminButtonDangerClass = cn(
  'admin-control inline-flex h-8 cursor-pointer items-center justify-center rounded-sm border border-print-red bg-print-red px-2.5 font-sans font-medium text-print-surface transition-colors hover:bg-print-red/90',
);

type PuzzleRemoveEntryConfirmProps = {
  open: boolean;
  word: string;
  puzzleId: string;
  entryId: string;
  onCancel: () => void;
};

export function PuzzleRemoveEntryConfirm({
  open,
  word,
  puzzleId,
  entryId,
  onCancel,
}: PuzzleRemoveEntryConfirmProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }

    window.addEventListener('keydown', onKeyDown, true);

    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Stäng"
        className="absolute inset-0 cursor-pointer bg-print-ink/15"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="puzzle-remove-entry-title"
        className="relative w-full max-w-md rounded-sm border border-print-ink/15 bg-print-surface p-5 shadow-lg"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 id="puzzle-remove-entry-title" className="text-base font-semibold text-print-ink">
              Ta bort ordet {word.toLocaleUpperCase('sv-SE')} från flätan?
            </h2>
            <p className="text-sm text-print-muted">
              Detta påverkar även tillhörande nummer och nyckelkoppling.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className={adminButtonSecondaryClass}
            >
              Avbryt
            </button>
            <form action={removePuzzleEntry}>
              <input type="hidden" name="puzzleId" value={puzzleId} />
              <input type="hidden" name="entryId" value={entryId} />
              <button type="submit" className={adminButtonDangerClass}>
                Ta bort ord
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
