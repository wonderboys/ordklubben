'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Field, SelectInput, SubmitButton, TextArea, TextInput } from '@/components/admin/admin-ui';
import {
  PUZZLE_GENERATION_DIFFICULTIES,
  PUZZLE_GENERATION_DIFFICULTY_LABELS,
  PUZZLE_STATUSES,
  PUZZLE_STATUS_LABELS,
  PUZZLE_TYPE_LABELS,
  PUZZLE_TYPE_SELECT_OPTIONS,
} from '@/lib/content/constants';
import { createAndGeneratePuzzle, createPuzzle } from '@/lib/content/puzzle-actions';
import { cn } from '@/lib/utils';

export type PuzzleCreateThemeOption = {
  id: string;
  name: string;
  slug: string;
  wordCount: number;
};

type PuzzleCreateMode = 'manual' | 'generated';

type PuzzleCreateViewProps = {
  themes: PuzzleCreateThemeOption[];
  defaultMode?: PuzzleCreateMode;
};

const MODE_LABELS: Record<PuzzleCreateMode, string> = {
  manual: 'Manuell ordfläta',
  generated: 'Genererad ordfläta',
};

function GeneratedPuzzleForm({ themes }: { themes: PuzzleCreateThemeOption[] }) {
  const { pending } = useFormStatus();

  return (
    <fieldset disabled={pending} className="grid gap-3 border-0 p-0 m-0 min-w-0">
      <Field label="Titel" htmlFor="generated-title">
        <TextInput id="generated-title" name="title" required />
      </Field>

      <Field
        label="Tema"
        htmlFor="generated-themeId"
        hint={
          themes.length === 0
            ? 'Inga teman finns ännu. Du kan generera utan tema och koppla innehåll senare.'
            : 'Valfritt. Begränsar ord ur valt tema.'
        }
      >
        <SelectInput id="generated-themeId" name="themeId" defaultValue="">
          <option value="">Inget tema</option>
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name} ({theme.wordCount} ord)
            </option>
          ))}
        </SelectInput>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Bredd" htmlFor="generated-width">
          <TextInput
            id="generated-width"
            name="width"
            type="number"
            min="1"
            max="30"
            defaultValue="9"
            required
          />
        </Field>
        <Field label="Höjd" htmlFor="generated-height">
          <TextInput
            id="generated-height"
            name="height"
            type="number"
            min="1"
            max="30"
            defaultValue="9"
            required
          />
        </Field>
      </div>
      <p className="text-xs text-print-muted">
        Systemet väljer ett rimligt antal ord baserat på storlek.
      </p>

      <Field label="Svårighet" htmlFor="generated-difficulty">
        <SelectInput id="generated-difficulty" name="difficulty" defaultValue="2">
          {PUZZLE_GENERATION_DIFFICULTIES.map((value) => (
            <option key={value} value={value}>
              {PUZZLE_GENERATION_DIFFICULTY_LABELS[value]}
            </option>
          ))}
        </SelectInput>
      </Field>

      <div className="grid gap-2 rounded-sm border border-print-ink/10 bg-print-bg/30 px-3 py-2.5">
        <label className="flex items-center gap-2 text-sm text-print-ink">
          <input
            type="checkbox"
            name="allowDraftWords"
            className="size-4 rounded-sm border-print-ink/20 accent-print-ink"
          />
          Tillåt ord med status &apos;Utkast&apos;
        </label>
        <label className="flex items-center gap-2 text-sm text-print-ink">
          <input
            type="checkbox"
            name="allowDraftHints"
            className="size-4 rounded-sm border-print-ink/20 accent-print-ink"
          />
          Tillåt nycklar med status &apos;Utkast&apos;
        </label>
      </div>

      <Field label="Status" htmlFor="generated-status">
        <SelectInput id="generated-status" name="status" defaultValue="DRAFT">
          {PUZZLE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {PUZZLE_STATUS_LABELS[value]}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field label="Publiceringsdatum" htmlFor="generated-publishDate" hint="Valfritt.">
        <TextInput id="generated-publishDate" name="publishDate" type="date" />
      </Field>

      <div>
        <SubmitButton variant="primary" disabled={pending} className="gap-1.5">
          {pending ? (
            <>
              <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
              Genererar fläta...
            </>
          ) : (
            'Skapa och generera'
          )}
        </SubmitButton>
        {pending ? (
          <p className="mt-2 text-xs text-print-muted">Genereringen kan ta några sekunder.</p>
        ) : null}
      </div>
    </fieldset>
  );
}

export function PuzzleCreateView({ themes, defaultMode = 'generated' }: PuzzleCreateViewProps) {
  const [mode, setMode] = useState<PuzzleCreateMode>(defaultMode);

  return (
    <div className="grid max-w-xl gap-4">
      <div
        role="tablist"
        aria-label="Skapa ordfläta"
        className="grid grid-cols-2 gap-1 rounded-sm border border-print-ink/15 bg-print-bg/40 p-1"
      >
        {(['generated', 'manual'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              'rounded-sm px-3 py-2 text-xs font-medium transition-colors',
              mode === value
                ? 'bg-print-ink text-print-surface'
                : 'text-print-muted hover:bg-print-ink/[0.04] hover:text-print-ink',
            )}
          >
            {MODE_LABELS[value]}
          </button>
        ))}
      </div>

      {mode === 'manual' ? (
        <form action={createPuzzle} className="grid gap-3">
          <Field label="Titel" htmlFor="manual-title">
            <TextInput id="manual-title" name="title" required />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Typ" htmlFor="manual-type">
              <SelectInput id="manual-type" name="type" defaultValue="WORD_GRID">
                {PUZZLE_TYPE_SELECT_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {PUZZLE_TYPE_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Status" htmlFor="manual-status">
              <SelectInput id="manual-status" name="status" defaultValue="DRAFT">
                {PUZZLE_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {PUZZLE_STATUS_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Bredd" htmlFor="manual-width">
              <TextInput
                id="manual-width"
                name="width"
                type="number"
                min="1"
                max="30"
                defaultValue="9"
                required
              />
            </Field>
            <Field label="Höjd" htmlFor="manual-height">
              <TextInput
                id="manual-height"
                name="height"
                type="number"
                min="1"
                max="30"
                defaultValue="9"
                required
              />
            </Field>
          </div>

          <Field
            label="Slug"
            htmlFor="manual-slug"
            hint="Valfritt. Används vid framtida publicering."
          >
            <TextInput id="manual-slug" name="slug" placeholder="t.ex. ordflata-vecka-24" />
          </Field>

          <Field label="Beskrivning" htmlFor="manual-description">
            <TextArea id="manual-description" name="description" className="min-h-20" />
          </Field>

          <Field label="Publiceringsdatum" htmlFor="manual-publishDate">
            <TextInput id="manual-publishDate" name="publishDate" type="date" />
          </Field>

          <div>
            <SubmitButton variant="primary">Skapa pussel</SubmitButton>
          </div>
        </form>
      ) : (
        <form action={createAndGeneratePuzzle} className="grid gap-3">
          <GeneratedPuzzleForm themes={themes} />
        </form>
      )}
    </div>
  );
}
