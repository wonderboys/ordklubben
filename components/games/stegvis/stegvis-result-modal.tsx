'use client';

import { Button } from '@/components/ui/button';

export type StegvisResultData = {
  startWord: string;
  targetWord: string;
};

type StegvisResultModalProps = {
  open: boolean;
  result: StegvisResultData;
  onPlayAgain: () => void;
  onNewPuzzle: () => void;
  onClose: () => void;
};

export function StegvisResultModal({
  open,
  result,
  onPlayAgain,
  onNewPuzzle,
  onClose,
}: StegvisResultModalProps) {
  if (!open) {
    return null;
  }

  const startWord = result.startWord.toLocaleUpperCase('sv-SE');
  const targetWord = result.targetWord.toLocaleUpperCase('sv-SE');

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
        aria-labelledby="stegvis-result-title"
        className="relative w-full max-w-md border border-print-ink bg-print-surface p-6 shadow-[var(--print-shadow-strong)] sm:p-8"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p
              id="stegvis-result-title"
              className="text-2xl font-black uppercase text-print-ink sm:text-3xl"
            >
              Klart.
            </p>
            <p className="text-sm text-print-ink sm:text-base">
              Du löste kedjan från <span className="font-black uppercase">{startWord}</span> till{' '}
              <span className="font-black uppercase">{targetWord}</span>.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="accent" className="w-full sm:flex-1" onClick={onPlayAgain}>
              Spela igen
            </Button>
            <Button
              variant="outline"
              className="w-full bg-print-bg sm:flex-1"
              onClick={onNewPuzzle}
            >
              Nytt pussel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
