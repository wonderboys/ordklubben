'use client';

import { type ReactNode } from 'react';
import { CornerDownLeft, Delete } from 'lucide-react';
import { type DagensOrdLetterFeedback } from '@/lib/game/dagens-ord';
import { cn } from '@/lib/utils';

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'å'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä'],
] as const;

const BOTTOM_ROW = ['z', 'x', 'c', 'v', 'b', 'n', 'm'] as const;

type DagensOrdKeyboardProps = {
  letterStates: Map<string, DagensOrdLetterFeedback>;
  canSubmit: boolean;
  canEdit: boolean;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  className?: string;
};

function keyStateClass(state?: DagensOrdLetterFeedback) {
  switch (state) {
    case 'correct':
      return 'border-print-green bg-print-green text-white';
    case 'present':
      return 'border-print-yellow bg-print-yellow-soft text-print-ink';
    case 'absent':
      return 'border-print-ink/15 bg-print-bg text-print-muted';
    default:
      return 'border-print-ink bg-print-surface text-print-ink';
  }
}

function KeyboardKey({
  children,
  className,
  disabled,
  onClick,
  wide,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'print-button flex min-w-0 cursor-pointer items-center justify-center rounded-none border !font-semibold uppercase tracking-[0.02em] shadow-[var(--print-shadow-soft)] transition-[filter,transform,colors] hover:brightness-95 active:translate-x-px active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-40',
        wide
          ? 'aspect-auto h-[3.15rem] min-w-[3.15rem] flex-[1.55] px-1 !text-[0.8rem] md:h-[3.5rem] md:max-h-none md:min-w-[5.25rem] md:flex-[1.65] md:px-2 md:!text-lg'
          : 'aspect-square h-[3.15rem] max-h-[3.15rem] min-w-0 flex-1 px-0 !text-[1.1rem] leading-none md:aspect-auto md:h-[3.5rem] md:max-h-none md:min-w-[2.35rem] md:flex-1 md:px-2 md:!text-lg',
        className,
      )}
    >
      <span className="inline-flex translate-y-0.5 items-center justify-center leading-none">
        {children}
      </span>
    </button>
  );
}

export function DagensOrdKeyboard({
  letterStates,
  canSubmit,
  canEdit,
  onLetter,
  onBackspace,
  onSubmit,
  className,
}: DagensOrdKeyboardProps) {
  return (
    <div className={cn('w-full space-y-1 md:space-y-2', className)}>
      {KEYBOARD_ROWS.map((row) => (
        <div key={row.join('-')} className="flex w-full justify-stretch gap-1 md:gap-1.5">
          {row.map((letter) => (
            <KeyboardKey
              key={letter}
              disabled={!canEdit}
              className={keyStateClass(letterStates.get(letter))}
              onClick={() => onLetter(letter)}
            >
              {letter.toLocaleUpperCase('sv-SE')}
            </KeyboardKey>
          ))}
        </div>
      ))}

      <div className="flex w-full justify-stretch gap-1 md:gap-1.5">
        <KeyboardKey
          wide
          disabled={!canEdit || !canSubmit}
          className="border-print-green bg-print-green text-white"
          onClick={onSubmit}
        >
          <CornerDownLeft className="size-[1.15rem] md:hidden" aria-hidden />
          <span className="hidden md:inline">Enter</span>
          <span className="sr-only md:hidden">Skicka gissning</span>
        </KeyboardKey>
        {BOTTOM_ROW.map((letter) => (
          <KeyboardKey
            key={letter}
            disabled={!canEdit}
            className={keyStateClass(letterStates.get(letter))}
            onClick={() => onLetter(letter)}
          >
            {letter.toLocaleUpperCase('sv-SE')}
          </KeyboardKey>
        ))}
        <KeyboardKey wide disabled={!canEdit} onClick={onBackspace}>
          <Delete className="size-[1.15rem] md:size-5" aria-hidden />
          <span className="sr-only">Backspace</span>
        </KeyboardKey>
      </div>
    </div>
  );
}
