import { ChevronDown } from "lucide-react";
import {
  AdminActionGroup,
  AdminDefinitionList,
  AdminPanel,
  AdminToggleLabel,
  Field,
  SelectInput,
  SubmitButton,
  TextArea,
  TextInput,
  adminButtonTertiaryClass,
} from "@/components/admin/admin-ui";
import { updateWord } from "@/lib/content/actions";
import { CONTENT_STATUSES, STATUS_LABELS } from "@/lib/content/constants";
import type { WordDetailData } from "@/components/admin/word-detail/types";
import { cn } from "@/lib/utils";

const EDIT_METADATA_ID = "edit-word-metadata";

function formatDate(date: Date) {
  return date.toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

export function WordMetadataPanel({
  word,
  showEditAction = true,
}: {
  word: WordDetailData;
  showEditAction?: boolean;
}) {
  return (
    <>
      <AdminDefinitionList
        items={[
          { label: "Språk", value: word.language },
          { label: "Längd", value: `${word.length} tecken` },
          {
            label: "Normaliserat",
            value: (
              <span className="font-mono text-xs uppercase">{word.normalizedAnswer}</span>
            ),
          },
          { label: "Skapad", value: formatDate(word.createdAt) },
          { label: "Uppdaterad", value: formatDate(word.updatedAt) },
          { label: "Korsordspoäng", value: word.crosswordScore ?? "—" },
        ]}
      />

      {showEditAction ? (
        <>
          <input id={EDIT_METADATA_ID} type="checkbox" className="peer sr-only" />

          <div className="mt-3 peer-checked:[&_svg]:rotate-180">
            <label
              htmlFor={EDIT_METADATA_ID}
              className={cn(adminButtonTertiaryClass, "inline-flex items-center gap-1.5")}
            >
              <ChevronDown aria-hidden className="size-3.5 shrink-0 transition-transform" />
              Redigera metadata
            </label>
          </div>

          <div className="mt-3 hidden rounded-sm border border-print-ink/10 bg-print-ink/[0.02] p-3 peer-checked:block">
            <form action={updateWord} className="grid gap-3">
              <input type="hidden" name="id" value={word.id} />
              <input type="hidden" name="tab" value="overview" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Ord" htmlFor="answer-readonly">
                  <TextInput id="answer-readonly" value={word.answer} readOnly />
                </Field>
                <Field label="Normaliserat" htmlFor="normalized-readonly">
                  <TextInput id="normalized-readonly" value={word.normalizedAnswer} readOnly />
                </Field>
                <Field label="Status" htmlFor="status">
                  <SelectInput id="status" name="status" defaultValue={word.status}>
                    {CONTENT_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {STATUS_LABELS[value]}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Svårighet" htmlFor="difficulty">
                  <TextInput
                    id="difficulty"
                    name="difficulty"
                    type="number"
                    min="0"
                    defaultValue={word.difficulty ?? ""}
                  />
                </Field>
                <Field label="Korsordspoäng" htmlFor="crosswordScore">
                  <TextInput
                    id="crosswordScore"
                    name="crosswordScore"
                    type="number"
                    min="0"
                    defaultValue={word.crosswordScore ?? ""}
                  />
                </Field>
                <Field label="Språk" htmlFor="language-readonly">
                  <TextInput id="language-readonly" value={word.language} readOnly />
                </Field>
              </div>
              <Field label="Anteckningar" htmlFor="notes">
                <TextArea id="notes" name="notes" defaultValue={word.notes ?? ""} className="min-h-20" />
              </Field>
              <AdminActionGroup>
                <SubmitButton variant="primary">Spara ändringar</SubmitButton>
                <AdminToggleLabel htmlFor={EDIT_METADATA_ID} variant="secondary">
                  Avbryt
                </AdminToggleLabel>
              </AdminActionGroup>
            </form>
          </div>
        </>
      ) : null}
    </>
  );
}

export function WordMetadataOverviewCard({ word }: { word: WordDetailData }) {
  return (
    <AdminPanel title="Metadata">
      <WordMetadataPanel word={word} />
    </AdminPanel>
  );
}
