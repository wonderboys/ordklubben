'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ContentStatus } from '@prisma/client';
import { STATUS_LABELS } from '@/lib/content/constants';
import { cn } from '@/lib/utils';

export type WordPickerOption = {
  id: string;
  answer: string;
  length: number;
  hintCount?: number;
  status?: ContentStatus;
};

export function formatWordPickerMeta(option: WordPickerOption) {
  const parts: string[] = [`${option.length} bokstäver`];

  if (option.hintCount != null) {
    parts.push(option.hintCount === 1 ? '1 nyckel' : `${option.hintCount} nycklar`);
  }

  if (option.status) {
    parts.push(STATUS_LABELS[option.status]);
  }

  return parts.join(' · ');
}

function filterWordPickerOptions(options: WordPickerOption[], query: string) {
  const normalized = query.trim().toLocaleLowerCase('sv-SE');

  if (!normalized) {
    return options;
  }

  return options.filter((option) => option.answer.toLocaleLowerCase('sv-SE').includes(normalized));
}

type WordPickerProps = {
  id?: string;
  name?: string;
  value: string | null;
  onChange: (wordId: string | null) => void;
  options: WordPickerOption[];
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  focusKey?: string | number | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
};

const inputClassName = cn(
  'admin-control h-8 w-full rounded-sm border border-print-ink/15 bg-print-surface px-2.5 font-normal text-print-ink outline-none transition-[border-color,box-shadow] focus:border-print-green focus:ring-2 focus:ring-print-green/15',
);

export function WordPicker({
  id: idProp,
  name,
  value,
  onChange,
  options,
  placeholder = 'Sök ord…',
  required = false,
  autoFocus = false,
  focusKey = null,
  open: openProp,
  onOpenChange,
  disabled = false,
  emptyMessage = 'Inga ord matchar sökningen.',
  className,
}: WordPickerProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listboxId = `${id}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (openProp == null) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [openProp, onOpenChange],
  );

  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);

  const filteredOptions = useMemo(() => filterWordPickerOptions(options, query), [options, query]);

  useEffect(() => {
    if ((!autoFocus && focusKey == null) || value) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();

      if (openProp == null) {
        setOpen(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [autoFocus, focusKey, value, openProp, setOpen]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);

        if (selected) {
          setQuery('');
        }
      }
    }

    document.addEventListener('pointerdown', onPointerDown);

    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [selected, setOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }

    window.addEventListener('keydown', onKeyDown, true);

    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, setOpen]);

  function selectOption(option: WordPickerOption) {
    onChange(option.id);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlightIndex((index) => Math.min(index + 1, Math.max(filteredOptions.length - 1, 0)));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      const option = filteredOptions[highlightIndex];

      if (option) {
        selectOption(option);
      }

      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setQuery('');
    }
  }

  const displayValue = open ? query : (selected?.answer ?? query);

  return (
    <div ref={containerRef} className={cn('relative min-w-0', className)}>
      {name ? <input type="hidden" name={name} value={value ?? ''} required={required} /> : null}

      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && filteredOptions[highlightIndex]
            ? `${id}-option-${filteredOptions[highlightIndex]?.id}`
            : undefined
        }
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        autoComplete="off"
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlightIndex(0);
          setOpen(true);

          if (value) {
            onChange(null);
          }
        }}
        onFocus={() => {
          if (!value) {
            setOpen(true);
          }
        }}
        onKeyDown={handleInputKeyDown}
        className={inputClassName}
      />

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-sm border border-print-ink/15 bg-print-surface py-1 shadow-md"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-print-muted">{emptyMessage}</li>
          ) : (
            filteredOptions.map((option, index) => {
              const isHighlighted = index === highlightIndex;
              const isSelected = option.id === value;

              return (
                <li key={option.id} role="presentation">
                  <button
                    id={`${id}-option-${option.id}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => selectOption(option)}
                    className={cn(
                      'flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors',
                      isHighlighted ? 'bg-print-green-soft' : 'hover:bg-print-ink/[0.04]',
                    )}
                  >
                    <span className="text-sm font-semibold uppercase tracking-wide text-print-ink">
                      {option.answer}
                    </span>
                    <span className="text-xs text-print-muted">{formatWordPickerMeta(option)}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      {selected ? (
        <div className="mt-2 rounded-sm border border-print-ink/10 bg-print-surface px-3 py-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-print-ink">
            {selected.answer}
          </p>
          <p className="mt-0.5 text-xs text-print-muted">{formatWordPickerMeta(selected)}</p>
        </div>
      ) : null}
    </div>
  );
}
