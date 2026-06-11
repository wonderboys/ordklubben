"use client";

import type { ContentStatus, HintType } from "@prisma/client";
import { Field, SelectInput, adminButtonPrimaryClass } from "@/components/admin/admin-ui";
import { WordPicker, type WordPickerOption } from "@/components/admin/word-picker";
import { PUZZLE_DIRECTION_LABELS } from "@/lib/content/constants";
import { formatPuzzleHintOptionLabel } from "@/lib/content/puzzle/hint-label";
import type { PuzzlePlacementDraft } from "@/components/admin/puzzle/puzzle-editor-state";
import { getPlacementStatusMessage } from "@/components/admin/puzzle/puzzle-editor-state";
import { addPuzzleEntry } from "@/lib/content/puzzle-actions";
import { cn } from "@/lib/utils";

export type PuzzleWordOption = WordPickerOption & {
  hints: Array<{
    id: string;
    text: string;
    status: ContentStatus;
    type: HintType;
    difficulty: number | null;
  }>;
};

type PuzzleAddEntryPanelProps = {
  puzzleId: string;
  words: PuzzleWordOption[];
  placementDraft: PuzzlePlacementDraft;
  onWordIdChange: (wordId: string | null) => void;
  onDirectionChange: (direction: "ACROSS" | "DOWN") => void;
  placementFocusKey: string | null;
  placementValid: boolean;
  placementMessage: string | null;
  wordPickerOpen: boolean;
  onWordPickerOpenChange: (open: boolean) => void;
};

export function PuzzleAddEntryPanel({
  puzzleId,
  words,
  placementDraft,
  onWordIdChange,
  onDirectionChange,
  placementFocusKey,
  placementValid,
  placementMessage,
  wordPickerOpen,
  onWordPickerOpenChange,
}: PuzzleAddEntryPanelProps) {
  const selectedWord = words.find((word) => word.id === placementDraft.wordId) ?? null;

  const wordPickerOptions = words.map((word) => ({
    id: word.id,
    answer: word.answer,
    length: word.length,
    hintCount: word.hints.length,
    status: word.status,
  }));

  if (words.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-print-ink/15 bg-print-bg/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-print-muted">
          Lägg till nytt ord
        </p>
        <p className="mt-2 text-sm text-print-muted">
          Alla tillgängliga ord är redan placerade. Lägg till fler ord i ordbanken först.
        </p>
      </div>
    );
  }

  const canSubmit = Boolean(
    placementDraft.cell &&
      placementDraft.wordId &&
      placementDraft.direction &&
      placementValid,
  );

  const baseStatus = getPlacementStatusMessage(placementDraft);
  let statusMessage = baseStatus ?? "Förhandsvisning visas i rutnätet. Bekräfta när placeringen ser rätt ut.";

  if (placementDraft.cell && placementDraft.wordId && placementDraft.direction && !placementValid) {
    statusMessage = placementMessage ?? "Placeringen är ogiltig.";
  }

  const showDirectionPrompt = placementDraft.cell && placementDraft.wordId && !placementDraft.direction;

  return (
    <div className="space-y-3 rounded-sm border border-dashed border-print-ink/15 bg-print-bg/40 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-print-muted">
          Lägg till nytt ord
        </p>
        <p
          className={cn(
            "mt-2 text-sm",
            placementDraft.cell &&
              placementDraft.wordId &&
              placementDraft.direction &&
              !placementValid
              ? "text-print-ink"
              : "text-print-muted",
          )}
        >
          {statusMessage}
        </p>
      </div>

      <form action={addPuzzleEntry} className="grid gap-3">
        <input type="hidden" name="puzzleId" value={puzzleId} />
        <input type="hidden" name="row" value={placementDraft.cell?.row ?? ""} />
        <input type="hidden" name="col" value={placementDraft.cell?.col ?? ""} />
        {placementDraft.direction ? (
          <input type="hidden" name="direction" value={placementDraft.direction} />
        ) : null}

        <Field label="Ord" htmlFor="puzzle-word-picker">
          <WordPicker
            id="puzzle-word-picker"
            name="wordId"
            value={placementDraft.wordId}
            onChange={onWordIdChange}
            options={wordPickerOptions}
            focusKey={placementFocusKey}
            open={wordPickerOpen}
            onOpenChange={onWordPickerOpenChange}
            required
            emptyMessage="Inga ord matchar sökningen."
          />
        </Field>

        <div className="grid gap-1.5">
          <p className="text-xs font-medium text-print-muted">
            {showDirectionPrompt ? "Välj riktning" : "Riktning"}
          </p>
          <div className="flex gap-2">
            {(["ACROSS", "DOWN"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onDirectionChange(value)}
                className={cn(
                  "admin-control h-8 flex-1 rounded-sm border px-3 text-sm transition-colors",
                  placementDraft.direction === value
                    ? "border-print-ink bg-print-ink text-print-surface"
                    : "border-print-ink/15 bg-print-surface text-print-ink hover:bg-print-ink/[0.04]",
                )}
              >
                {PUZZLE_DIRECTION_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        <Field label="Nyckel" htmlFor="hintId">
          {selectedWord && selectedWord.hints.length === 0 ? (
            <p className="text-sm text-print-muted">Inga nycklar finns för detta ord.</p>
          ) : (
            <SelectInput
              key={placementDraft.wordId ?? "no-word"}
              id="hintId"
              name="hintId"
              defaultValue=""
              disabled={!selectedWord}
            >
              <option value="">Ingen nyckel vald</option>
              {selectedWord?.hints.map((hint) => (
                <option key={hint.id} value={hint.id}>
                  {formatPuzzleHintOptionLabel(hint)}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>

        <div>
          <button type="submit" disabled={!canSubmit} className={adminButtonPrimaryClass}>
            Lägg till i rutnätet
          </button>
        </div>
      </form>
    </div>
  );
}
