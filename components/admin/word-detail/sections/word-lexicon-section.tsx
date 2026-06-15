import type { LexicalEntryType } from '@prisma/client';
import { ChevronDown } from 'lucide-react';
import {
  AdminActionGroup,
  AdminPanel,
  AdminPanelEmpty,
  AdminToolbar,
  AdminToolbarSection,
  Field,
  SelectInput,
  SubmitButton,
  TextArea,
  TextInput,
  adminButtonTertiaryClass,
} from '@/components/admin/admin-ui';
import { createLexicalEntry, deleteLexicalEntry, updateLexicalEntry } from '@/lib/content/actions';
import {
  LEXICAL_ENTRY_TYPES,
  LEXICAL_ENTRY_TYPE_LABELS,
  WORD_SOURCES,
  WORD_SOURCE_LABELS,
  formatLexicalEntryType,
  formatWordSourceWithReference,
} from '@/lib/content/constants';
import type { WordDetailData, WordDetailLexicalEntry } from '@/components/admin/word-detail/types';
import { cn } from '@/lib/utils';

const KEYS_TAB = 'lexicon';
const NEW_ENTRY_FORM_ID = 'new-lexical-entry';

function LexicalEntryCard({ wordId, entry }: { wordId: string; entry: WordDetailLexicalEntry }) {
  const editFormId = `lexical-edit-${entry.id}`;

  return (
    <article className="rounded-sm border border-print-ink/10 bg-print-ink/[0.015]">
      <div className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm bg-print-ink/[0.06] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em] text-print-muted">
            {formatLexicalEntryType(entry.type)}
          </span>
          <span className="text-xs text-print-muted">
            {formatWordSourceWithReference(entry.source, entry.sourceReference)}
          </span>
        </div>
        <p className="mt-2 text-base font-medium leading-snug text-print-ink">{entry.value}</p>
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
        <form action={updateLexicalEntry} className="grid gap-3">
          <input type="hidden" name="wordId" value={wordId} />
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="tab" value={KEYS_TAB} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Typ" htmlFor={`lexical-type-${entry.id}`}>
              <SelectInput id={`lexical-type-${entry.id}`} name="type" defaultValue={entry.type}>
                {LEXICAL_ENTRY_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {LEXICAL_ENTRY_TYPE_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Källa" htmlFor={`lexical-source-${entry.id}`}>
              <SelectInput
                id={`lexical-source-${entry.id}`}
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
          <Field label="Värde" htmlFor={`lexical-value-${entry.id}`}>
            <TextInput
              id={`lexical-value-${entry.id}`}
              name="value"
              defaultValue={entry.value}
              required
            />
          </Field>
          <Field label="Anteckningar" htmlFor={`lexical-notes-${entry.id}`} hint="Valfritt">
            <TextArea
              id={`lexical-notes-${entry.id}`}
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
        <form action={deleteLexicalEntry}>
          <input type="hidden" name="wordId" value={wordId} />
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="tab" value={KEYS_TAB} />
          <SubmitButton variant="tertiary">Ta bort</SubmitButton>
        </form>
      </div>
    </article>
  );
}

export function WordLexiconSection({
  word,
  entryType,
}: {
  word: WordDetailData;
  entryType?: LexicalEntryType;
}) {
  const filteredEntries = entryType
    ? word.lexicalEntries.filter((entry) => entry.type === entryType)
    : word.lexicalEntries;

  return (
    <>
      <AdminToolbar className="mb-4">
        <AdminToolbarSection label="Ny post">
          <label
            htmlFor={NEW_ENTRY_FORM_ID}
            className="admin-control inline-flex h-8 cursor-pointer items-center rounded-sm border border-print-ink/15 bg-print-surface px-2.5 text-sm font-medium text-print-ink hover:bg-print-ink/[0.04]"
          >
            Lägg till lexikal post
          </label>
        </AdminToolbarSection>

        {word.lexicalEntries.length > 0 ? (
          <AdminToolbarSection label="Filtrera">
            <form method="get">
              <AdminActionGroup>
                <input type="hidden" name="tab" value={KEYS_TAB} />
                <SelectInput name="entryType" defaultValue={entryType ?? ''} className="min-w-44">
                  <option value="">Alla typer</option>
                  {LEXICAL_ENTRY_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {LEXICAL_ENTRY_TYPE_LABELS[value]}
                    </option>
                  ))}
                </SelectInput>
                <SubmitButton variant="secondary">Filtrera</SubmitButton>
              </AdminActionGroup>
            </form>
          </AdminToolbarSection>
        ) : null}
      </AdminToolbar>

      <input id={NEW_ENTRY_FORM_ID} type="checkbox" className="peer sr-only" />
      <div className="mb-4 hidden rounded-sm border border-print-ink/10 bg-print-ink/[0.02] p-3 peer-checked:block">
        <p className="mb-3 text-sm font-medium text-print-ink">Ny lexikal post</p>
        <p className="mb-3 text-xs text-print-muted">
          Lexikala poster är inte spelnycklar. De beskriver ordets betydelse och relationer.
        </p>
        <form action={createLexicalEntry} className="grid gap-3">
          <input type="hidden" name="wordId" value={word.id} />
          <input type="hidden" name="tab" value={KEYS_TAB} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Typ" htmlFor="lexical-new-type">
              <SelectInput id="lexical-new-type" name="type" defaultValue="DEFINITION">
                {LEXICAL_ENTRY_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {LEXICAL_ENTRY_TYPE_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Källa" htmlFor="lexical-new-source">
              <SelectInput id="lexical-new-source" name="source" defaultValue="manual">
                {WORD_SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {WORD_SOURCE_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Field label="Värde" htmlFor="lexical-new-value">
            <TextInput id="lexical-new-value" name="value" required />
          </Field>
          <Field label="Anteckningar" htmlFor="lexical-new-notes" hint="Valfritt">
            <TextArea id="lexical-new-notes" name="notes" className="min-h-16" />
          </Field>
          <SubmitButton variant="primary">Spara post</SubmitButton>
        </form>
      </div>

      {filteredEntries.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredEntries.map((entry) => (
            <LexicalEntryCard key={entry.id} wordId={word.id} entry={entry} />
          ))}
        </div>
      ) : (
        <AdminPanelEmpty message="Inga lexikala poster finns ännu." />
      )}
    </>
  );
}

export function WordLexiconPanel({
  word,
  entryType,
}: {
  word: WordDetailData;
  entryType?: LexicalEntryType;
}) {
  return (
    <AdminPanel title="Lexikon">
      <div className="mb-4 text-sm leading-relaxed text-print-muted">
        <p>Lexikon beskriver ordets betydelse, relationer och användning.</p>
        <p className="mt-2">Exempel:</p>
        <ul className="mt-1 list-inside list-disc text-sm">
          <li>definitioner</li>
          <li>synonymer</li>
          <li>motsatsord</li>
          <li>uttryck</li>
          <li>närliggande ord</li>
        </ul>
        <p className="mt-2 text-xs">
          Lexikondata används som grund för framtida spel, nycklar och AI-generering. Det är inte
          samma sak som spelnycklar.
        </p>
      </div>
      <WordLexiconSection word={word} entryType={entryType} />
    </AdminPanel>
  );
}
