'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { SubmitButton, adminButtonSecondaryClass } from '@/components/admin/admin-ui';
import type { PuzzlePlacedEntry } from '@/components/admin/puzzle/puzzle-placed-entries-panel';
import { getPlacedEntryHintPreview } from '@/components/admin/puzzle/puzzle-placed-entries-panel';
import { formatPuzzleHintOptionLabel } from '@/lib/content/puzzle/hint-label';
import { PuzzleRemoveEntryConfirm } from '@/components/admin/puzzle/puzzle-remove-entry-confirm';
import { updatePuzzleEntryHint } from '@/lib/content/puzzle-actions';
import { cn } from '@/lib/utils';

type PuzzleEntryEditorPanelProps = {
  puzzleId: string;
  entry: PuzzlePlacedEntry;
};

function InspectorRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-print-muted">
        {label}
      </h3>
      {children}
    </section>
  );
}

function WordDetailLink({ wordId }: { wordId: string }) {
  return (
    <Link
      href={`/admin/words/${wordId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-print-ink underline-offset-2 hover:underline"
    >
      Öppna ordets detaljsida
      <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
    </Link>
  );
}

function hintOptionClassName(isActive: boolean) {
  return cn(
    'flex cursor-pointer gap-2 rounded-sm border px-2.5 py-1.5 transition-colors',
    isActive
      ? 'border-print-ink/20 border-l-2 border-l-print-ink bg-print-bg/70'
      : 'border-print-ink/10 hover:border-print-ink/20 hover:bg-print-ink/[0.03]',
  );
}

export function PuzzleEntryEditorPanel({ puzzleId, entry }: PuzzleEntryEditorPanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hints = entry.availableHints;
  const hasHints = hints.length > 0;
  const currentHint = getPlacedEntryHintPreview(entry) ?? 'Saknar nyckel';

  return (
    <>
      <div className="space-y-3 border-t border-print-ink/10 px-4 py-3">
        <InspectorRow label="Nyckel">
          <p className="text-sm text-print-ink">{currentHint}</p>

          {hasHints ? (
            <form action={updatePuzzleEntryHint} className="space-y-2">
              <input type="hidden" name="puzzleId" value={puzzleId} />
              <input type="hidden" name="entryId" value={entry.id} />

              <fieldset className="space-y-1">
                <legend className="sr-only">Välj nyckel för {entry.answerSnapshot}</legend>

                <label className={hintOptionClassName(entry.hintId == null)}>
                  <input
                    type="radio"
                    name="hintId"
                    value=""
                    defaultChecked={entry.hintId == null}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-print-muted">Ingen nyckel vald</span>
                </label>

                {hints.map((hint) => (
                  <label key={hint.id} className={hintOptionClassName(entry.hintId === hint.id)}>
                    <input
                      type="radio"
                      name="hintId"
                      value={hint.id}
                      defaultChecked={entry.hintId === hint.id}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="min-w-0 text-sm text-print-ink">
                      {formatPuzzleHintOptionLabel(hint)}
                    </span>
                  </label>
                ))}
              </fieldset>

              <SubmitButton variant="secondary">Spara nyckel</SubmitButton>
            </form>
          ) : (
            <p className="text-sm text-print-muted">Det här ordet har inga nycklar ännu.</p>
          )}
        </InspectorRow>

        <InspectorRow label="Ord">
          <WordDetailLink wordId={entry.wordId} />
        </InspectorRow>

        <InspectorRow label="Åtgärder">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className={adminButtonSecondaryClass}
          >
            Ta bort ord
          </button>
        </InspectorRow>
      </div>

      <PuzzleRemoveEntryConfirm
        open={confirmOpen}
        word={entry.answerSnapshot}
        puzzleId={puzzleId}
        entryId={entry.id}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
