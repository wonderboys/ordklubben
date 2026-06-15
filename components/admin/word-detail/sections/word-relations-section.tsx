'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { WordPicker, type WordPickerOption } from '@/components/admin/word-picker';
import {
  AdminPanel,
  Field,
  SelectInput,
  SubmitButton,
  TextArea,
  adminButtonTertiaryClass,
} from '@/components/admin/admin-ui';
import { createWordRelation, deleteWordRelation, updateWordRelation } from '@/lib/content/actions';
import {
  WORD_RELATION_TYPES,
  WORD_RELATION_TYPE_LABELS,
  WORD_SOURCES,
  WORD_SOURCE_LABELS,
  formatWordRelationType,
  formatWordSourceWithReference,
} from '@/lib/content/constants';
import type { WordDetailData, WordDetailRelation } from '@/components/admin/word-detail/types';
import { cn } from '@/lib/utils';

const RELATIONS_TAB = 'relations';

function WordRelationForm({
  wordId,
  wordOptions,
  relation,
  submitLabel,
  action,
}: {
  wordId: string;
  wordOptions: WordPickerOption[];
  relation?: WordDetailRelation;
  submitLabel: string;
  action: typeof createWordRelation | typeof updateWordRelation;
}) {
  const [targetWordId, setTargetWordId] = useState<string | null>(relation?.targetWord.id ?? null);

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="wordId" value={wordId} />
      <input type="hidden" name="tab" value={RELATIONS_TAB} />
      {relation ? <input type="hidden" name="relationId" value={relation.id} /> : null}
      <input type="hidden" name="targetWordId" value={targetWordId ?? ''} required />
      <Field label="Målord" htmlFor={`relation-target-${relation?.id ?? 'new'}`}>
        <WordPicker
          id={`relation-target-${relation?.id ?? 'new'}`}
          value={targetWordId}
          onChange={setTargetWordId}
          options={wordOptions}
          placeholder="Sök ord…"
          required
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Relationstyp" htmlFor={`relation-type-${relation?.id ?? 'new'}`}>
          <SelectInput
            id={`relation-type-${relation?.id ?? 'new'}`}
            name="relationType"
            defaultValue={relation?.relationType ?? 'RELATED'}
          >
            {WORD_RELATION_TYPES.map((value) => (
              <option key={value} value={value}>
                {WORD_RELATION_TYPE_LABELS[value]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Källa" htmlFor={`relation-source-${relation?.id ?? 'new'}`}>
          <SelectInput
            id={`relation-source-${relation?.id ?? 'new'}`}
            name="source"
            defaultValue={relation?.source ?? 'manual'}
          >
            {WORD_SOURCES.map((value) => (
              <option key={value} value={value}>
                {WORD_SOURCE_LABELS[value]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <Field
        label="Anteckningar"
        htmlFor={`relation-notes-${relation?.id ?? 'new'}`}
        hint="Valfritt"
      >
        <TextArea
          id={`relation-notes-${relation?.id ?? 'new'}`}
          name="notes"
          defaultValue={relation?.notes ?? ''}
          className="min-h-16"
        />
      </Field>
      <SubmitButton variant={relation ? 'secondary' : 'primary'}>{submitLabel}</SubmitButton>
    </form>
  );
}

function WordRelationCard({
  wordId,
  relation,
  wordOptions,
}: {
  wordId: string;
  relation: WordDetailRelation;
  wordOptions: WordPickerOption[];
}) {
  const editFormId = `relation-edit-${relation.id}`;

  return (
    <article className="rounded-sm border border-print-ink/10 bg-print-ink/[0.015]">
      <div className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm bg-print-ink/[0.06] px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em] text-print-muted">
            {formatWordRelationType(relation.relationType)}
          </span>
          <span className="text-xs text-print-muted">
            {formatWordSourceWithReference(relation.source, relation.sourceReference)}
          </span>
        </div>
        <p className="mt-2 text-base font-medium text-print-ink">
          <Link
            href={`/admin/words/${relation.targetWord.id}`}
            className="underline-offset-2 hover:underline"
          >
            {relation.targetWord.answer}
          </Link>
        </p>
        {relation.notes ? <p className="mt-2 text-sm text-print-muted">{relation.notes}</p> : null}
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
        <WordRelationForm
          wordId={wordId}
          wordOptions={wordOptions}
          relation={relation}
          submitLabel="Spara relation"
          action={updateWordRelation}
        />
      </div>

      <div className="border-t border-print-ink/10 px-3 py-3">
        <form action={deleteWordRelation}>
          <input type="hidden" name="wordId" value={wordId} />
          <input type="hidden" name="relationId" value={relation.id} />
          <input type="hidden" name="tab" value={RELATIONS_TAB} />
          <SubmitButton variant="tertiary">Ta bort</SubmitButton>
        </form>
      </div>
    </article>
  );
}

export function WordRelationsSection({
  word,
  wordOptions,
  relationType,
}: {
  word: WordDetailData;
  wordOptions: WordPickerOption[];
  relationType?: WordDetailRelation['relationType'];
}) {
  const filteredRelations = relationType
    ? word.relations.filter((relation) => relation.relationType === relationType)
    : word.relations;
  const newFormId = 'new-word-relation';

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <label
          htmlFor={newFormId}
          className="admin-control inline-flex h-8 cursor-pointer items-center rounded-sm border border-print-ink/15 bg-print-surface px-2.5 text-sm font-medium text-print-ink hover:bg-print-ink/[0.04]"
        >
          Lägg till relation
        </label>

        {word.relations.length > 0 ? (
          <form method="get" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="tab" value={RELATIONS_TAB} />
            <SelectInput name="relationType" defaultValue={relationType ?? ''} className="min-w-44">
              <option value="">Alla typer</option>
              {WORD_RELATION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {WORD_RELATION_TYPE_LABELS[value]}
                </option>
              ))}
            </SelectInput>
            <SubmitButton variant="secondary">Filtrera</SubmitButton>
          </form>
        ) : null}
      </div>

      <input id={newFormId} type="checkbox" className="peer sr-only" />
      <div className="mb-4 hidden rounded-sm border border-print-ink/10 bg-print-ink/[0.02] p-3 peer-checked:block">
        <p className="mb-3 text-sm font-medium text-print-ink">Ny relation</p>
        <p className="mb-3 text-xs text-print-muted">
          Strukturerade kopplingar till andra ord i ordbanken — skilt från lexikonets
          betydelseposter.
        </p>
        <WordRelationForm
          wordId={word.id}
          wordOptions={wordOptions}
          submitLabel="Spara relation"
          action={createWordRelation}
        />
      </div>

      {filteredRelations.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredRelations.map((relation) => (
            <WordRelationCard
              key={relation.id}
              wordId={word.id}
              relation={relation}
              wordOptions={wordOptions}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-print-muted">Inga relationer finns ännu.</p>
      )}
    </>
  );
}

export function WordRelationsPanel({
  word,
  wordOptions,
  relationType,
}: {
  word: WordDetailData;
  wordOptions: WordPickerOption[];
  relationType?: WordDetailRelation['relationType'];
}) {
  return (
    <AdminPanel title="Relationer">
      <div className="mb-4 text-sm leading-relaxed text-print-muted">
        <p>Beskriver hur ordet hänger ihop med andra ord i ordbanken.</p>
        <p className="mt-2 text-xs">
          Exempel: BILNYCKEL kan vara sammansatt av BIL och NYCKEL. TRAV kan vara synonym till
          GÅNGART och antonym till GALOPP.
        </p>
      </div>
      <WordRelationsSection word={word} wordOptions={wordOptions} relationType={relationType} />
    </AdminPanel>
  );
}
