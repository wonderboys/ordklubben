import type { PuzzleDirection } from "@prisma/client";

export type PuzzleCell = {
  row: number;
  col: number;
};

export type PuzzlePlacementDraft = {
  mode: boolean;
  cell: PuzzleCell | null;
  wordId: string | null;
  direction: PuzzleDirection | null;
};

export const EMPTY_PLACEMENT_DRAFT: PuzzlePlacementDraft = {
  mode: false,
  cell: null,
  wordId: null,
  direction: null,
};

export function getPlacementStatusMessage(draft: PuzzlePlacementDraft) {
  if (!draft.mode && !draft.cell) {
    return "Klicka på en ruta i rutnätet för att välja var ordet ska börja.";
  }

  if (!draft.cell) {
    return "Välj startcell i rutnätet.";
  }

  if (!draft.wordId) {
    return "Välj ord.";
  }

  if (!draft.direction) {
    return "Välj riktning.";
  }

  return null;
}

export function isPlacementDraftComplete(draft: PuzzlePlacementDraft) {
  return Boolean(draft.mode && draft.cell && draft.wordId && draft.direction);
}
