'use client';

import { Button } from '@/components/ui/button';
import { MonoLabel } from '@/components/ui/typography';

export type DagensOrdResultData = {
  outcome: 'won' | 'lost';
  targetWord: string;
  attemptCount?: number;
  /** Reserved for future stats UI. */
  durationMs?: number;
  guessDistribution?: number[];
  streak?: number;
};

type DagensOrdResultModalProps = {
  open: boolean;
  result: DagensOrdResultData;
  onClose: () => void;
};

export function DagensOrdResultModal({ open, result, onClose }: DagensOrdResultModalProps) {
  if (!open) {
    return null;
  }

  const displayWord = result.targetWord.toLocaleUpperCase('sv-SE');
  const isWin = result.outcome === 'won';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Stäng"
        className="absolute inset-0 cursor-pointer bg-print-ink/15"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dagens-ord-result-title"
        className="relative w-full max-w-md border border-print-ink bg-print-surface p-6 shadow-[var(--print-shadow-strong)] sm:p-8"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p
              id="dagens-ord-result-title"
              className="text-2xl font-black uppercase text-print-ink sm:text-3xl"
            >
              {isWin ? 'Rätt.' : 'Slut.'}
            </p>
            {isWin && result.attemptCount !== undefined ? (
              <p className="text-sm text-print-ink sm:text-base">
                Du löste dagens ord på {result.attemptCount}{' '}
                {result.attemptCount === 1 ? 'försök' : 'försök'}.
              </p>
            ) : null}
            {!isWin ? (
              <p className="text-sm text-print-ink sm:text-base">
                Dagens ord var <span className="font-black uppercase">{displayWord}</span>.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5 border-t border-print-ink/10 pt-4">
            <MonoLabel muted>Dagens ord</MonoLabel>
            <p className="text-3xl font-black uppercase text-print-ink sm:text-4xl">
              {displayWord}
            </p>
          </div>

          <Button variant="accent" className="w-full" onClick={onClose}>
            Stäng
          </Button>
        </div>
      </div>
    </div>
  );
}
