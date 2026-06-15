'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { PUZZLE_DIRECTION_LABELS } from '@/lib/content/constants';
import type { OrdflataPlayerEntry } from '@/lib/content/ordflata-alpha';
import { cn } from '@/lib/utils';

function sortEntries(entries: OrdflataPlayerEntry[]) {
  return [...entries].sort((left, right) => {
    const leftNumber = left.number ?? Number.MAX_SAFE_INTEGER;
    const rightNumber = right.number ?? Number.MAX_SAFE_INTEGER;

    if (leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }

    return left.clue.localeCompare(right.clue, 'sv-SE');
  });
}

function ClueSection({
  title,
  entries,
  activeEntryId,
  onSelectEntry,
  activeClueRef,
}: {
  title: string;
  entries: OrdflataPlayerEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entryId: string) => void;
  activeClueRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <section>
      <h3 className="mb-2 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-print-muted">
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-print-muted">Inga ord.</p>
      ) : (
        <ol className="divide-y divide-print-ink/10 border-y border-print-ink/10">
          {entries.map((entry) => {
            const isActive = entry.id === activeEntryId;

            return (
              <li key={entry.id}>
                <button
                  ref={isActive ? activeClueRef : undefined}
                  type="button"
                  onClick={() => onSelectEntry(entry.id)}
                  className={cn(
                    'w-full border-l-2 py-2 pl-2.5 pr-0 text-left text-sm leading-snug transition-colors',
                    isActive
                      ? 'border-l-print-ink bg-print-bg text-print-ink'
                      : 'border-l-transparent text-print-ink hover:bg-print-ink/[0.02]',
                  )}
                >
                  <span className={cn('font-medium', isActive && 'font-semibold')}>
                    <span className={cn(isActive && 'font-bold')}>{entry.number ?? '–'}.</span>{' '}
                    {entry.clue}
                  </span>
                  <span className="ml-1.5 text-print-muted">({entry.length})</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

type OrdflataCluesProps = {
  entries: OrdflataPlayerEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entryId: string) => void;
  className?: string;
};

export function OrdflataClues({
  entries,
  activeEntryId,
  onSelectEntry,
  className,
}: OrdflataCluesProps) {
  const activeClueRef = useRef<HTMLButtonElement>(null);
  const across = sortEntries(entries.filter((entry) => entry.direction === 'ACROSS'));
  const down = sortEntries(entries.filter((entry) => entry.direction === 'DOWN'));

  useEffect(() => {
    if (!activeEntryId) {
      return;
    }

    activeClueRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [activeEntryId]);

  return (
    <aside
      className={cn(
        'ordflata-clues-panel border border-print-ink bg-print-surface p-4 shadow-none',
        'md:max-h-[calc(100dvh-7rem)] md:overflow-y-scroll md:overscroll-contain',
        className,
      )}
    >
      <div className="mb-4 border-b border-print-ink/10 pb-3">
        <h2 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-print-ink">
          Ledtrådar
        </h2>
      </div>
      <div className="space-y-5">
        <ClueSection
          title={PUZZLE_DIRECTION_LABELS.ACROSS}
          entries={across}
          activeEntryId={activeEntryId}
          onSelectEntry={onSelectEntry}
          activeClueRef={activeClueRef}
        />
        <ClueSection
          title={PUZZLE_DIRECTION_LABELS.DOWN}
          entries={down}
          activeEntryId={activeEntryId}
          onSelectEntry={onSelectEntry}
          activeClueRef={activeClueRef}
        />
      </div>
    </aside>
  );
}
