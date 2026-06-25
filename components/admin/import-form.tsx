'use client';

import { useState } from 'react';
import {
  Field,
  FileInput,
  SelectInput,
  SubmitButton,
  TextArea,
  TextInput,
} from '@/components/admin/admin-ui';
import { importContentAction } from '@/lib/content/actions';
import {
  CONTENT_STATUSES,
  IMPORT_BATCH_TYPE_LABELS,
  IMPORT_BATCH_TYPES,
  STATUS_LABELS,
} from '@/lib/content/constants';
import type { ImportBatchType } from '@prisma/client';

export function AdminImportForm() {
  const [importType, setImportType] = useState<ImportBatchType>('WORDS_AND_HINTS');
  const isLexiconImport = importType === 'LEXICON';

  return (
    <form action={importContentAction} className="grid gap-5">
      <section className="grid gap-3">
        <h3 className="text-sm font-semibold text-print-ink">Import</h3>

        <Field label="Importtyp" htmlFor="importType">
          <SelectInput
            id="importType"
            name="importType"
            value={importType}
            onChange={(event) => setImportType(event.target.value as ImportBatchType)}
          >
            {IMPORT_BATCH_TYPES.map((value) => (
              <option key={value} value={value}>
                {IMPORT_BATCH_TYPE_LABELS[value]}
              </option>
            ))}
          </SelectInput>
        </Field>

        {!isLexiconImport ? (
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Standardstatus for nya ord"
              htmlFor="wordStatus"
              hint="Galler bara nya ord som skapas av importen."
            >
              <SelectInput id="wordStatus" name="wordStatus" defaultValue="DRAFT">
                {CONTENT_STATUSES.filter((status) => status !== 'REJECTED').map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field
              label="Standardstatus for nya nycklar"
              htmlFor="hintStatus"
              hint="Galler bara nya nycklar som skapas av importen."
            >
              <SelectInput id="hintStatus" name="hintStatus" defaultValue="DRAFT">
                {CONTENT_STATUSES.filter((status) => status !== 'REJECTED').map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
        ) : (
          <p className="text-sm text-print-muted">
            Lexikonimport lagger till poster pa befintliga ord. Inga nya ord eller nycklar skapas.
          </p>
        )}

        <Field
          label="CSV-fil"
          htmlFor="file"
          hint={
            isLexiconImport
              ? 'Kolumner: word, type, value, notes.'
              : 'Kolumner varierar med importtyp. Se importguiden till hoger.'
          }
        >
          <FileInput id="file" name="file" type="file" accept=".csv,text/csv" required />
        </Field>
      </section>

      <section className="grid gap-3 border-t border-print-ink/10 pt-4">
        <h3 className="text-sm font-semibold text-print-ink">Datakalla</h3>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Namn" htmlFor="sourceName" hint="Till exempel Hunspell, Kelly eller SALDO.">
            <TextInput id="sourceName" name="sourceName" required />
          </Field>

          <Field label="Version" htmlFor="sourceVersion">
            <TextInput id="sourceVersion" name="sourceVersion" placeholder="2025-01" />
          </Field>

          <Field label="Licens" htmlFor="sourceLicense">
            <TextInput id="sourceLicense" name="sourceLicense" placeholder="LGPL" />
          </Field>

          <Field label="URL" htmlFor="sourceUrl">
            <TextInput id="sourceUrl" name="sourceUrl" placeholder="https://..." />
          </Field>
        </div>

        <Field
          label="Referens"
          htmlFor="sourceReference"
          hint="Filnamn, datasetnamn eller annan kallreferens."
        >
          <TextInput id="sourceReference" name="sourceReference" />
        </Field>

        <Field label="Kommentar" htmlFor="sourceComment">
          <TextArea id="sourceComment" name="sourceComment" />
        </Field>
      </section>

      <div>
        <SubmitButton variant="primary">Importera</SubmitButton>
      </div>
    </form>
  );
}
