import type { PuzzleDirection } from "@prisma/client";

export type PuzzleEditorSelection =
  | { kind: "entry"; entryId: string }
  | { kind: "placement"; row: number; col: number; direction: PuzzleDirection }
  | { kind: "blocked"; row: number; col: number };

export function getSelectionCell(selection: PuzzleEditorSelection | null) {
  if (!selection || selection.kind === "entry") {
    return null;
  }

  return { row: selection.row, col: selection.col };
}

export function getSelectionEntryId(selection: PuzzleEditorSelection | null) {
  return selection?.kind === "entry" ? selection.entryId : null;
}
