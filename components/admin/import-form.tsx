"use client";

import { useState } from "react";
import {
  Field,
  FileInput,
  SelectInput,
  SubmitButton,
} from "@/components/admin/admin-ui";
import { importContentAction } from "@/lib/content/actions";
import {
  CONTENT_STATUSES,
  IMPORT_BATCH_TYPE_LABELS,
  IMPORT_BATCH_TYPES,
  STATUS_LABELS,
} from "@/lib/content/constants";
import type { ImportBatchType } from "@prisma/client";

export function AdminImportForm() {
  const [importType, setImportType] = useState<ImportBatchType>("WORDS_AND_HINTS");
  const isLexiconImport = importType === "LEXICON";

  return (
    <form action={importContentAction} className="grid gap-3">
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

      {isLexiconImport ? (
        <p className="text-sm text-print-muted">
          Lexikonimport lägger till poster på befintliga ord. Inga nya ord eller nycklar skapas.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Defaultstatus för nya ord"
            htmlFor="wordStatus"
            hint="Välj Godkänd för kurerade seed-filer. Gäller bara nya ord."
          >
            <SelectInput id="wordStatus" name="wordStatus" defaultValue="DRAFT">
              {CONTENT_STATUSES.filter((status) => status !== "REJECTED").map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field
            label="Defaultstatus för nya nycklar"
            htmlFor="hintStatus"
            hint="Välj Godkänd för kurerade seed-filer. Gäller bara nya nycklar."
          >
            <SelectInput id="hintStatus" name="hintStatus" defaultValue="DRAFT">
              {CONTENT_STATUSES.filter((status) => status !== "REJECTED").map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      )}

      <Field
        label="CSV-fil"
        htmlFor="file"
        hint={
          isLexiconImport
            ? "Kolumner: word, type, value, source, sourceReference, notes."
            : "Stöd för ord, nycklar eller kombinerad import enligt exemplen."
        }
      >
        <FileInput id="file" name="file" type="file" accept=".csv,text/csv" required />
      </Field>

      <div>
        <SubmitButton variant="primary">Importera</SubmitButton>
      </div>
    </form>
  );
}
