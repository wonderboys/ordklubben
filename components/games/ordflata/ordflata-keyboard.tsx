'use client';

import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'å'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
] as const;

type OrdflataKeyboardProps = {
  disabled?: boolean;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  className?: string;
};

function KeyboardKey({
  children,
  className,
  disabled,
  onClick,
  wide,
}: {
  children: React.ReactNode;
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
        'print-button flex min-w-0 cursor-pointer items-center justify-center rounded-none border border-print-ink bg-print-surface !font-semibold uppercase tracking-[0.02em] text-print-ink shadow-[var(--print-shadow-soft)] transition-[filter,transform,colors] hover:brightness-95 active:translate-x-px active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-40',
        wide
          ? 'aspect-auto h-[2.75rem] min-w-[2.75rem] flex-[1.2] px-1 !text-[0.75rem]'
          : 'aspect-square h-[2.75rem] max-h-[2.75rem] min-w-0 flex-1 px-0 !text-[1rem] leading-none',
        className,
      )}
    >
      <span className="inline-flex translate-y-0.5 items-center justify-center leading-none">
        {children}
      </span>
    </button>
  );
}

export function OrdflataKeyboard({
  disabled = false,
  onLetter,
  onBackspace,
  className,
}: OrdflataKeyboardProps) {
  return (
    <div className={cn('w-full space-y-1', className)}>
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={row.join('-')} className="flex w-full justify-stretch gap-1">
          {rowIndex === KEYBOARD_ROWS.length - 1 ? (
            <KeyboardKey wide disabled={disabled} onClick={onBackspace}>
              <Delete className="size-4" aria-hidden />
              <span className="sr-only">Backspace</span>
            </KeyboardKey>
          ) : null}
          {row.map((letter) => (
            <KeyboardKey key={letter} disabled={disabled} onClick={() => onLetter(letter)}>
              {letter.toLocaleUpperCase('sv-SE')}
            </KeyboardKey>
          ))}
        </div>
      ))}
    </div>
  );
}
