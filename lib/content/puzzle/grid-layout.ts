export function getPuzzleGridCellSize(width: number): string {
  if (width <= 9) {
    return "2.85rem";
  }

  if (width <= 12) {
    return "2.45rem";
  }

  return "2.1rem";
}

/** Typography isolation wrapper for the public player grid only. */
export const ORDFLATA_BOARD_WRAPPER_CLASS = "ordflata-board";

export const PUZZLE_GRID_BOARD_CLASS =
  "inline-grid w-full max-w-full gap-0.5 rounded-sm border-2 border-print-ink/25 bg-print-ink/10 p-1";

export const PUZZLE_GRID_CELL_CLASS =
  "@container group relative flex aspect-square items-center justify-center border uppercase transition-[colors,box-shadow,transform]";
