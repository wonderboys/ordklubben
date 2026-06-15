import type { PuzzleDirection } from '@prisma/client';
import { PUZZLE_DIRECTION_LABELS } from '@/lib/content/constants';
import { getAnswerLength } from '@/lib/content/puzzle/grid';

export type PuzzleClueEntry = {
  id: string;
  number: number | null;
  direction: PuzzleDirection;
  answerSnapshot: string;
  hintSnapshot: string | null;
  hintText: string | null;
};

function sortEntries(entries: PuzzleClueEntry[]) {
  return [...entries].sort((left, right) => {
    const leftNumber = left.number ?? Number.MAX_SAFE_INTEGER;
    const rightNumber = right.number ?? Number.MAX_SAFE_INTEGER;

    if (leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }

    return left.answerSnapshot.localeCompare(right.answerSnapshot, 'sv-SE');
  });
}

function ClueSection({ title, entries }: { title: string; entries: PuzzleClueEntry[] }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-print-muted">
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-print-muted">Inga ord ännu.</p>
      ) : (
        <ol className="space-y-2 text-sm">
          {entries.map((entry) => {
            const clue = entry.hintSnapshot ?? entry.hintText ?? 'Ingen nyckel vald';
            const length = getAnswerLength(entry.answerSnapshot);

            return (
              <li key={entry.id} className="border-b border-print-ink/10 pb-2 last:border-b-0">
                <span className="font-medium text-print-ink">
                  {entry.number ?? '–'}. {clue}
                </span>
                <span className="ml-2 text-print-muted">({length})</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function PuzzleCluePanel({ entries }: { entries: PuzzleClueEntry[] }) {
  const across = sortEntries(entries.filter((entry) => entry.direction === 'ACROSS'));
  const down = sortEntries(entries.filter((entry) => entry.direction === 'DOWN'));

  return (
    <div className="space-y-5">
      <ClueSection title={PUZZLE_DIRECTION_LABELS.ACROSS} entries={across} />
      <ClueSection title={PUZZLE_DIRECTION_LABELS.DOWN} entries={down} />
    </div>
  );
}
