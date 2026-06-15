"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminPanel } from "@/components/admin/admin-ui";
import { PuzzleAddEntryPanel, type PuzzleWordOption } from "@/components/admin/puzzle/puzzle-add-entry-panel";
import {
  PuzzleActiveEntryPanel,
  PuzzleBlockedCellPanel,
  PuzzleBlockModePanel,
} from "@/components/admin/puzzle/puzzle-active-entry-panel";
import {
  EMPTY_PLACEMENT_DRAFT,
  type PuzzlePlacementDraft,
} from "@/components/admin/puzzle/puzzle-editor-state";
import { PuzzleEntryEditorPanel } from "@/components/admin/puzzle/puzzle-entry-editor-panel";
import { PuzzleCluePanel, type PuzzleClueEntry } from "@/components/admin/puzzle/puzzle-clue-panel";
import { buildGhostPlacement } from "@/components/admin/puzzle/puzzle-ghost-placement";
import {
  PuzzleGridEditor,
  type PuzzleGridCellInteraction,
  type PuzzleGridEntry,
} from "@/components/admin/puzzle/puzzle-grid-editor";
import {
  PuzzlePlacedEntriesPanel,
  type PuzzlePlacedEntry,
} from "@/components/admin/puzzle/puzzle-placed-entries-panel";
import type { PuzzleBlockedCellInput } from "@/lib/content/puzzle/grid";
import { cn } from "@/lib/utils";

type PuzzleEditorWorkspaceProps = {
  puzzleId: string;
  width: number;
  height: number;
  entries: PuzzleGridEntry[];
  placedEntries: PuzzlePlacedEntry[];
  blockedCells: PuzzleBlockedCellInput[];
  clueEntries: PuzzleClueEntry[];
  words: PuzzleWordOption[];
};

export function PuzzleEditorWorkspace({
  puzzleId,
  width,
  height,
  entries,
  placedEntries,
  blockedCells,
  clueEntries,
  words,
}: PuzzleEditorWorkspaceProps) {
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [selectedBlockedCell, setSelectedBlockedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [placementDraft, setPlacementDraft] =
    useState<PuzzlePlacementDraft>(EMPTY_PLACEMENT_DRAFT);
  const [blockMode, setBlockMode] = useState(false);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [wordPickerOpen, setWordPickerOpen] = useState(false);
  const [placementFocusKey, setPlacementFocusKey] = useState<string | null>(null);

  const gridRegionRef = useRef<HTMLDivElement>(null);
  const contextPanelRef = useRef<HTMLDivElement>(null);
  const lastActiveEntryClickRef = useRef<{
    entryId: string;
    row: number;
    col: number;
  } | null>(null);

  const selectedEntry = useMemo(
    () => placedEntries.find((entry) => entry.id === activeEntryId) ?? null,
    [activeEntryId, placedEntries],
  );

  const selectedWordForPlacement = useMemo(
    () => words.find((word) => word.id === placementDraft.wordId) ?? null,
    [placementDraft.wordId, words],
  );

  const ghostPlacement = useMemo(() => {
    if (
      blockMode ||
      !placementDraft.mode ||
      !placementDraft.cell ||
      !placementDraft.wordId ||
      !placementDraft.direction ||
      !selectedWordForPlacement
    ) {
      return null;
    }

    return buildGhostPlacement({
      answerSnapshot: selectedWordForPlacement.answer,
      row: placementDraft.cell.row,
      col: placementDraft.cell.col,
      direction: placementDraft.direction,
      existing: entries,
      blockedCells,
      width,
      height,
    });
  }, [
    blockMode,
    placementDraft,
    selectedWordForPlacement,
    entries,
    blockedCells,
    width,
    height,
  ]);

  const clearActiveEntry = useCallback(() => {
    setActiveEntryId(null);
    setIsEditingEntry(false);
    lastActiveEntryClickRef.current = null;
  }, []);

  const clearPlacementDraft = useCallback(() => {
    setPlacementDraft(EMPTY_PLACEMENT_DRAFT);
    setPlacementFocusKey(null);
    setWordPickerOpen(false);
  }, []);

  const clearBlockedSelection = useCallback(() => {
    setSelectedBlockedCell(null);
  }, []);

  const clearAllSelection = useCallback(() => {
    clearActiveEntry();
    clearPlacementDraft();
    clearBlockedSelection();
  }, [clearActiveEntry, clearPlacementDraft, clearBlockedSelection]);

  function enableBlockMode() {
    clearActiveEntry();
    clearPlacementDraft();
    clearBlockedSelection();
    setIsEditingEntry(false);
    setWordPickerOpen(false);
    setBlockMode(true);
  }

  function disableBlockMode() {
    setBlockMode(false);
  }

  function handleBlockModeChange(enabled: boolean) {
    if (enabled) {
      enableBlockMode();
      return;
    }

    disableBlockMode();
  }

  function enterPlacementMode(row: number, col: number) {
    clearActiveEntry();
    clearBlockedSelection();
    setIsEditingEntry(false);
    setPlacementDraft((draft) => {
      if (!draft.wordId) {
        setWordPickerOpen(true);
      } else {
        setWordPickerOpen(false);
      }

      return {
        ...draft,
        mode: true,
        cell: { row, col },
      };
    });
    setPlacementFocusKey(`${row}:${col}`);
  }

  function handleSelectEntry(entryId: string) {
    if (blockMode) {
      return;
    }

    setIsEditingEntry(false);
    clearPlacementDraft();
    clearBlockedSelection();

    if (activeEntryId === entryId) {
      clearActiveEntry();
      return;
    }

    setActiveEntryId(entryId);
    lastActiveEntryClickRef.current = null;
  }

  function handleCellInteract(interaction: PuzzleGridCellInteraction) {
    if (blockMode) {
      return;
    }

    setIsEditingEntry(false);

    if (interaction.type === "entry") {
      const lastClick = lastActiveEntryClickRef.current;
      const isRepeatActiveClick =
        activeEntryId === interaction.entryId &&
        lastClick?.entryId === interaction.entryId &&
        lastClick.row === interaction.row &&
        lastClick.col === interaction.col;

      if (isRepeatActiveClick) {
        enterPlacementMode(interaction.row, interaction.col);
        return;
      }

      if (placementDraft.mode || placementDraft.wordId) {
        enterPlacementMode(interaction.row, interaction.col);
        return;
      }

      setActiveEntryId(interaction.entryId);
      clearPlacementDraft();
      clearBlockedSelection();
      lastActiveEntryClickRef.current = {
        entryId: interaction.entryId,
        row: interaction.row,
        col: interaction.col,
      };
      return;
    }

    if (interaction.type === "blocked") {
      clearActiveEntry();
      clearPlacementDraft();
      setSelectedBlockedCell({ row: interaction.row, col: interaction.col });
      return;
    }

    if (
      placementDraft.mode &&
      placementDraft.cell?.row === interaction.row &&
      placementDraft.cell?.col === interaction.col
    ) {
      clearPlacementDraft();
      return;
    }

    enterPlacementMode(interaction.row, interaction.col);
  }

  function handleDirectionChange(direction: "ACROSS" | "DOWN") {
    setPlacementDraft((draft) => ({ ...draft, direction }));
  }

  function handleWordIdChange(wordId: string | null) {
    setPlacementDraft((draft) => ({ ...draft, wordId }));
    setWordPickerOpen(false);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (wordPickerOpen) {
        return;
      }

      event.preventDefault();

      if (blockMode) {
        disableBlockMode();
        return;
      }

      if (isEditingEntry) {
        setIsEditingEntry(false);
        return;
      }

      if (activeEntryId) {
        clearActiveEntry();
        return;
      }

      if (placementDraft.mode || placementDraft.cell || placementDraft.wordId) {
        clearPlacementDraft();
        return;
      }

      if (selectedBlockedCell) {
        clearBlockedSelection();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    wordPickerOpen,
    blockMode,
    isEditingEntry,
    activeEntryId,
    placementDraft,
    selectedBlockedCell,
    clearActiveEntry,
    clearPlacementDraft,
    clearBlockedSelection,
  ]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (gridRegionRef.current?.contains(target)) {
        return;
      }

      if (contextPanelRef.current?.contains(target)) {
        return;
      }

      clearAllSelection();
    }

    document.addEventListener("pointerdown", onPointerDown);

    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [clearAllSelection]);

  const placementCell = placementDraft.mode ? placementDraft.cell : null;

  return (
    <>
      <AdminPanel title="Konstruktion" compact>
        <div className="grid gap-4 lg:grid-cols-[2fr_3fr] lg:items-stretch">
          <div ref={gridRegionRef} className="min-w-0">
            <div
              className={cn(
                "rounded-sm border bg-print-bg/25",
                blockMode
                  ? "border-print-yellow/50 bg-print-yellow/[0.04]"
                  : "border-print-ink/15",
              )}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-print-ink/10 px-2 py-1.5">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={blockMode}
                    onChange={(event) => handleBlockModeChange(event.target.checked)}
                    className="size-4 rounded-sm border-print-ink/20 accent-print-ink"
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      blockMode ? "text-print-ink" : "text-print-muted",
                    )}
                  >
                    Blockera rutor
                  </span>
                </label>
                {blockMode ? (
                  <p className="text-xs text-print-muted">
                    Blockeringsläge aktivt. Klicka på en ruta för att lägga till eller ta bort
                    svartrutor.
                  </p>
                ) : null}
              </div>

              <div className="p-1.5">
                <PuzzleGridEditor
                  puzzleId={puzzleId}
                  width={width}
                  height={height}
                  entries={entries}
                  blockedCells={blockedCells}
                  activeEntryId={blockMode ? null : activeEntryId}
                  selectedCell={blockMode ? null : placementCell}
                  selectedBlockedCell={blockMode ? null : selectedBlockedCell}
                  blockMode={blockMode}
                  ghostPlacement={ghostPlacement}
                  allowPlacementOnOccupiedCells={!blockMode && placementDraft.mode}
                  onCellInteract={handleCellInteract}
                />
              </div>
            </div>
          </div>

          <div
            ref={contextPanelRef}
            className="flex min-h-0 min-w-0 flex-col gap-4 lg:min-h-[28rem]"
          >
            <div className="flex min-h-0 shrink-0 flex-col gap-3">
              {blockMode ? (
                <PuzzleBlockModePanel />
              ) : selectedEntry ? (
                <div className="overflow-hidden rounded-sm border border-print-ink/15 border-l-2 border-l-print-ink bg-print-bg/50">
                  <PuzzleActiveEntryPanel
                    entry={selectedEntry}
                    isEditing={isEditingEntry}
                    onEditToggle={() => setIsEditingEntry((value) => !value)}
                  />
                  {isEditingEntry ? (
                    <PuzzleEntryEditorPanel puzzleId={puzzleId} entry={selectedEntry} />
                  ) : null}
                </div>
              ) : selectedBlockedCell ? (
                <PuzzleBlockedCellPanel
                  row={selectedBlockedCell.row}
                  col={selectedBlockedCell.col}
                />
              ) : (
                <PuzzleAddEntryPanel
                  puzzleId={puzzleId}
                  words={words}
                  placementDraft={placementDraft}
                  onWordIdChange={handleWordIdChange}
                  onDirectionChange={handleDirectionChange}
                  placementFocusKey={placementFocusKey}
                  placementValid={ghostPlacement?.isValid ?? false}
                  placementMessage={ghostPlacement?.message ?? null}
                  wordPickerOpen={wordPickerOpen}
                  onWordPickerOpenChange={setWordPickerOpen}
                />
              )}
            </div>

            <section className="flex min-h-0 flex-1 flex-col">
              <p className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-print-muted">
                Placerade ord
              </p>
              <PuzzlePlacedEntriesPanel
                entries={placedEntries}
                selectedEntryId={activeEntryId}
                onSelectEntry={handleSelectEntry}
                disabled={blockMode}
              />
            </section>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel title="Spelarförhandsvisning" compact>
        <p className="mb-3 text-sm text-print-muted">
          Så här kommer spelaren att se flätan.
        </p>
        <PuzzleCluePanel entries={clueEntries} />
      </AdminPanel>
    </>
  );
}
