"use client";

import { useState } from "react";
import {
  AdminActionGroup,
  Field,
  SelectInput,
  SubmitButton,
  TextArea,
  TextInput,
  adminButtonSecondaryClass,
  adminButtonTertiaryClass,
} from "@/components/admin/admin-ui";
import { archiveWord, updateWord } from "@/lib/content/actions";
import {
  CONTENT_STATUSES,
  STATUS_LABELS,
  WORD_SOURCES,
  WORD_SOURCE_LABELS,
} from "@/lib/content/constants";
import type { WordDetailData } from "@/components/admin/word-detail/types";
import { cn } from "@/lib/utils";

type PanelMode = "closed" | "edit" | "archive";

export function WordManagementActions({ word }: { word: WordDetailData }) {
  const [mode, setMode] = useState<PanelMode>("closed");
  const { relationCounts } = word;

  function closePanel() {
    setMode("closed");
  }

  function openEdit() {
    setMode((current) => (current === "edit" ? "closed" : "edit"));
  }

  function openArchive() {
    setMode((current) => (current === "archive" ? "closed" : "archive"));
  }

  return (
    <div className="mt-4 border-t border-print-ink/10 pt-4">
      <AdminActionGroup>
        <button
          type="button"
          onClick={openEdit}
          aria-expanded={mode === "edit"}
          className={cn(
            adminButtonSecondaryClass,
            mode === "edit" && "border-print-ink/30 bg-print-ink/[0.06]",
          )}
        >
          {mode === "edit" ? "Stäng redigering" : "Redigera ord"}
        </button>
        <button
          type="button"
          onClick={openArchive}
          aria-expanded={mode === "archive"}
          className={cn(
            adminButtonTertiaryClass,
            mode === "archive" && "bg-print-ink/[0.04] text-print-ink",
          )}
        >
          {mode === "archive" ? "Avbryt" : "Arkivera ord…"}
        </button>
      </AdminActionGroup>

      {mode === "edit" ? (
        <div className="mt-3 rounded-sm border border-print-ink/10 bg-print-ink/[0.02] p-3">
          <form action={updateWord} className="grid gap-3">
            <input type="hidden" name="id" value={word.id} />
            <input type="hidden" name="tab" value="overview" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ord" htmlFor="answer">
                <TextInput id="answer" name="answer" defaultValue={word.answer} required />
              </Field>
              <Field
                label="Normaliserat"
                htmlFor="normalizedAnswer"
                hint="Utan mellanslag och skiljetecken."
              >
                <TextInput
                  id="normalizedAnswer"
                  name="normalizedAnswer"
                  defaultValue={word.normalizedAnswer}
                  className="font-mono uppercase"
                  required
                />
              </Field>
              <Field label="Status" htmlFor="status">
                <SelectInput id="status" name="status" defaultValue={word.status}>
                  {CONTENT_STATUSES.filter((value) => value !== "ARCHIVED").map((value) => (
                    <option key={value} value={value}>
                      {STATUS_LABELS[value]}
                    </option>
                  ))}
                </SelectInput>
              </Field>
                <Field label="Språk" htmlFor="language">
                  <TextInput id="language" name="language" defaultValue={word.language} required />
                </Field>
                <div className="sm:col-span-2">
                <Field label="Källa" htmlFor="source">
                  <SelectInput id="source" name="source" defaultValue={word.source}>
                    {WORD_SOURCES.map((value) => (
                      <option key={value} value={value}>
                        {WORD_SOURCE_LABELS[value]}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-print-ink">
              <input
                type="checkbox"
                name="normalizeFromAnswer"
                className="size-4 rounded-sm border-print-ink/20 accent-print-ink"
              />
              Regenerera normaliserat ord från ordet vid sparning
            </label>
            <Field label="Anteckningar" htmlFor="notes">
              <TextArea id="notes" name="notes" defaultValue={word.notes ?? ""} className="min-h-20" />
            </Field>
            <AdminActionGroup>
              <SubmitButton variant="primary">Spara ändringar</SubmitButton>
              <button type="button" onClick={closePanel} className={adminButtonSecondaryClass}>
                Avbryt
              </button>
            </AdminActionGroup>
          </form>
        </div>
      ) : null}

      {mode === "archive" ? (
        <div className="mt-3 rounded-sm border border-print-ink/15 bg-print-ink/[0.02] p-3">
          <p className="text-sm font-medium text-print-ink">Arkivera ord</p>
          <p className="mt-1.5 text-sm leading-relaxed text-print-muted">
            Ordet försvinner från ordlistan. Nycklar, lexikon och teman behålls.
          </p>
          <p className="mt-2 text-xs text-print-muted">
            {relationCounts.hints} nycklar · {relationCounts.hintCandidates} förslag ·{" "}
            {relationCounts.lexicalEntries} lexikonposter · {relationCounts.wordRelations} relationer ·{" "}
            {relationCounts.themes} teman
            {relationCounts.puzzleEntries > 0
              ? ` · ${relationCounts.puzzleEntries} pusselplaceringar`
              : ""}
          </p>
          {relationCounts.puzzleEntries > 0 ? (
            <p className="mt-2 text-xs text-print-muted">
              Ordet används i pussel — arkivering döljer det utan att påverka befintliga spel.
            </p>
          ) : null}

          <form action={archiveWord} className="mt-3 space-y-3">
            <input type="hidden" name="wordId" value={word.id} />
            <input type="hidden" name="tab" value="overview" />
            <input type="hidden" name="confirm" value="yes" />
            <label className="flex items-start gap-2 text-sm text-print-ink">
              <input
                type="checkbox"
                required
                className="mt-0.5 size-4 shrink-0 rounded-sm border-print-ink/20 accent-print-ink"
              />
              Jag förstår att ordet arkiveras
            </label>
            <AdminActionGroup>
              <SubmitButton variant="secondary">Arkivera ord</SubmitButton>
              <button type="button" onClick={closePanel} className={adminButtonTertiaryClass}>
                Avbryt
              </button>
            </AdminActionGroup>
          </form>
        </div>
      ) : null}
    </div>
  );
}
