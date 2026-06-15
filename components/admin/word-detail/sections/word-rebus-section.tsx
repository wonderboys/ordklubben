import { ChevronDown } from 'lucide-react';
import {
  AdminActionGroup,
  AdminPanel,
  AdminPanelEmpty,
  AdminToolbar,
  AdminToolbarSection,
  Field,
  SelectInput,
  StatusBadge,
  SubmitButton,
  TextArea,
  TextInput,
  adminButtonTertiaryClass,
} from '@/components/admin/admin-ui';
import { createRebusEntry, deleteRebusEntry, updateRebusEntry } from '@/lib/content/actions';
import {
  CONTENT_STATUSES,
  HINT_DIFFICULTY_OPTIONS,
  STATUS_LABELS,
  WORD_SOURCES,
  WORD_SOURCE_LABELS,
  formatHintDifficulty,
  formatWordSourceWithReference,
} from '@/lib/content/constants';
import type { WordDetailData, WordDetailRebusEntry } from '@/components/admin/word-detail/types';
import { cn } from '@/lib/utils';

const REBUS_TAB = 'rebus';
const NEW_ENTRY_FORM_ID = 'new-rebus-entry';

function RebusEntryCard({ wordId, entry }: { wordId: string; entry: WordDetailRebusEntry }) {
  const editFormId = `rebus-edit-${entry.id}`;

  return (
    <article className="rounded-sm border border-print-ink/10 bg-print-ink/[0.015]">
      <div className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={entry.status} />
          <span className="text-xs text-print-muted">
            {formatWordSourceWithReference(entry.source, entry.sourceReference)}
          </span>
          <span className="text-xs text-print-muted">
            Svårighet: {formatHintDifficulty(entry.difficulty)}
          </span>
        </div>
        <p className="mt-2 text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-snug tracking-[0.06em] text-print-ink">
          {entry.value}
        </p>
        {entry.notes ? <p className="mt-2 text-sm text-print-muted">{entry.notes}</p> : null}
      </div>

      <input id={editFormId} type="checkbox" className="peer/edit sr-only" />
      <div className="border-t border-print-ink/10 px-3 py-2.5 peer-checked/edit:[&_svg]:rotate-180">
        <label
          htmlFor={editFormId}
          className={cn(adminButtonTertiaryClass, 'inline-flex items-center gap-1.5')}
        >
          <ChevronDown aria-hidden className="size-3.5 shrink-0 transition-transform" />
          Redigera
        </label>
      </div>
      <div className="hidden border-t border-print-ink/10 px-3 py-3 peer-checked/edit:block">
        <form action={updateRebusEntry} className="grid gap-3">
          <input type="hidden" name="wordId" value={wordId} />
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="tab" value={REBUS_TAB} />
          <Field label="Rebus" htmlFor={`rebus-value-${entry.id}`}>
            <TextInput
              id={`rebus-value-${entry.id}`}
              name="value"
              defaultValue={entry.value}
              required
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Status" htmlFor={`rebus-status-${entry.id}`}>
              <SelectInput
                id={`rebus-status-${entry.id}`}
                name="status"
                defaultValue={entry.status}
              >
                {CONTENT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Svårighet" htmlFor={`rebus-difficulty-${entry.id}`} hint="Valfritt">
              <SelectInput
                id={`rebus-difficulty-${entry.id}`}
                name="difficulty"
                defaultValue={entry.difficulty == null ? '' : String(entry.difficulty)}
              >
                {HINT_DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option.value || 'unset'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Källa" htmlFor={`rebus-source-${entry.id}`}>
              <SelectInput
                id={`rebus-source-${entry.id}`}
                name="source"
                defaultValue={entry.source}
              >
                {WORD_SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {WORD_SOURCE_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Field label="Anteckningar" htmlFor={`rebus-notes-${entry.id}`} hint="Valfritt">
            <TextArea
              id={`rebus-notes-${entry.id}`}
              name="notes"
              defaultValue={entry.notes ?? ''}
              className="min-h-16"
            />
          </Field>
          <AdminActionGroup>
            <SubmitButton variant="secondary">Spara</SubmitButton>
          </AdminActionGroup>
        </form>
      </div>

      <div className="border-t border-print-ink/10 px-3 py-3">
        <form action={deleteRebusEntry}>
          <input type="hidden" name="wordId" value={wordId} />
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="tab" value={REBUS_TAB} />
          <SubmitButton variant="tertiary">Ta bort</SubmitButton>
        </form>
      </div>
    </article>
  );
}

export function WordRebusSection({ word }: { word: WordDetailData }) {
  return (
    <>
      <AdminToolbar className="mb-4">
        <AdminToolbarSection label="Ny rebus">
          <label
            htmlFor={NEW_ENTRY_FORM_ID}
            className="admin-control inline-flex h-8 cursor-pointer items-center rounded-sm border border-print-ink/15 bg-print-surface px-2.5 text-sm font-medium text-print-ink hover:bg-print-ink/[0.04]"
          >
            Lägg till rebus
          </label>
        </AdminToolbarSection>
      </AdminToolbar>

      <input id={NEW_ENTRY_FORM_ID} type="checkbox" className="peer sr-only" />
      <div className="mb-4 hidden rounded-sm border border-print-ink/10 bg-print-ink/[0.02] p-3 peer-checked:block">
        <p className="mb-3 text-sm font-medium text-print-ink">Ny rebus</p>
        <p className="mb-3 text-xs text-print-muted">
          En rebus representerar ordet med symboler, till exempel 🚗🔑 för BILNYCKEL.
        </p>
        <form action={createRebusEntry} className="grid gap-3">
          <input type="hidden" name="wordId" value={word.id} />
          <input type="hidden" name="tab" value={REBUS_TAB} />
          <Field label="Rebus" htmlFor="rebus-new-value">
            <TextInput id="rebus-new-value" name="value" placeholder="🚗🔑" required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Status" htmlFor="rebus-new-status">
              <SelectInput id="rebus-new-status" name="status" defaultValue="DRAFT">
                {CONTENT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Källa" htmlFor="rebus-new-source">
              <SelectInput id="rebus-new-source" name="source" defaultValue="manual">
                {WORD_SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {WORD_SOURCE_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Field label="Anteckningar" htmlFor="rebus-new-notes" hint="Valfritt">
            <TextArea id="rebus-new-notes" name="notes" className="min-h-16" />
          </Field>
          <SubmitButton variant="primary">Spara rebus</SubmitButton>
        </form>
      </div>

      {word.rebusEntries.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {word.rebusEntries.map((entry) => (
            <RebusEntryCard key={entry.id} wordId={word.id} entry={entry} />
          ))}
        </div>
      ) : (
        <AdminPanelEmpty message="Inga rebusar finns ännu." />
      )}
    </>
  );
}

export function WordRebusPanel({ word }: { word: WordDetailData }) {
  return (
    <AdminPanel title="Rebus">
      <div className="mb-4 text-sm leading-relaxed text-print-muted">
        <p>Rebus visar ordet som symboler — inte som textledtråd.</p>
        <p className="mt-2 text-xs">
          Godkända rebusar kan användas i emojirebus och framtida spel.
        </p>
      </div>
      <WordRebusSection word={word} />
    </AdminPanel>
  );
}
