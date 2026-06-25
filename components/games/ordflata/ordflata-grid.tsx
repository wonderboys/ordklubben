'use client';

import { useMemo } from 'react';
import {
  buildPuzzleGrid,
  computeStartCellNumbers,
  getPlacementCells,
  type PuzzleBlockedCellInput,
} from '@/lib/content/puzzle/grid';
import {
  getPuzzleGridCellSize,
  ORDFLATA_BOARD_WRAPPER_CLASS,
  PUZZLE_GRID_BOARD_CLASS,
  PUZZLE_GRID_CELL_CLASS,
} from '@/lib/content/puzzle/grid-layout';
import type { OrdflataPlayerEntry } from '@/lib/games/ordflata/types';
import { cn } from '@/lib/utils';

type OrdflataGridProps = {
  width: number;
  height: number;
  entries: OrdflataPlayerEntry[];
  blockedCells: PuzzleBlockedCellInput[];
  filledCells: Map<string, string>;
  selectedCell: { row: number; col: number } | null;
  activeEntryId: string | null;
  onSelectCell: (row: number, col: number) => void;
};

export function OrdflataGrid({
  width,
  height,
  entries,
  blockedCells,
  filledCells,
  selectedCell,
  activeEntryId,
  onSelectCell,
}: OrdflataGridProps) {
  const placementEntries = useMemo(
    () =>
      entries.map((entry) => ({
        id: entry.id,
        answerSnapshot: entry.answer,
        row: entry.row,
        col: entry.col,
        direction: entry.direction,
        number: entry.number,
      })),
    [entries],
  );

  const grid = useMemo(
    () =>
      buildPuzzleGrid({
        width,
        height,
        entries: placementEntries,
        blockedCells,
      }),
    [blockedCells, height, placementEntries, width],
  );

  const startCellNumbers = useMemo(
    () => computeStartCellNumbers(placementEntries),
    [placementEntries],
  );

  const activeCells = useMemo(() => {
    if (!activeEntryId) {
      return new Set<string>();
    }

    const entry = entries.find((item) => item.id === activeEntryId);

    if (!entry) {
      return new Set<string>();
    }

    return new Set(
      getPlacementCells({
        answerSnapshot: entry.answer,
        row: entry.row,
        col: entry.col,
        direction: entry.direction,
      }).map((cell) => `${cell.row}:${cell.col}`),
    );
  }, [activeEntryId, entries]);

  const cellSize = getPuzzleGridCellSize(width);

  return (
    <div className={cn('w-full overflow-x-auto', ORDFLATA_BOARD_WRAPPER_CLASS)}>
      <div
        className={PUZZLE_GRID_BOARD_CLASS}
        style={{
          gridTemplateColumns: `repeat(${width}, minmax(${cellSize}, 1fr))`,
        }}
      >
        {grid.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const cellKey = `${rowIndex}:${colIndex}`;
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            const isActiveWordCell = activeCells.has(cellKey);
            const isLetterCell = Boolean(cell.letter) && !cell.blocked;
            const startNumber = startCellNumbers.get(cellKey);
            const displayLetter = filledCells.get(cellKey) ?? null;

            return (
              <button
                key={cellKey}
                type="button"
                data-puzzle-cell=""
                data-row={rowIndex}
                data-col={colIndex}
                data-cell-kind={cell.blocked ? 'blocked' : cell.letter ? 'letter' : 'empty'}
                onClick={() => {
                  if (!isLetterCell) {
                    return;
                  }

                  onSelectCell(rowIndex, colIndex);
                }}
                className={cn(
                  PUZZLE_GRID_CELL_CLASS,
                  isLetterCell &&
                    'hover:z-10 hover:ring-2 hover:ring-inset hover:ring-print-ink/15',
                  cell.blocked &&
                    'cursor-default border-print-ink/20 bg-[#5a5752] shadow-inner hover:ring-0',
                  !cell.blocked &&
                    !cell.letter &&
                    'cursor-default border-print-ink/10 bg-print-bg hover:ring-0',
                  isLetterCell &&
                    !isActiveWordCell &&
                    !isSelected &&
                    'border-print-ink/15 bg-print-surface text-print-ink',
                  isLetterCell &&
                    isActiveWordCell &&
                    !isSelected &&
                    'z-10 border-print-ink/20 bg-print-bg text-print-ink',
                  isLetterCell &&
                    isSelected &&
                    'z-20 border-print-ink bg-print-surface text-print-ink shadow-[inset_0_0_0_2px_var(--print-ink)]',
                )}
                title={`Rad ${rowIndex + 1}, kolumn ${colIndex + 1}`}
              >
                {startNumber != null ? (
                  <span className="pointer-events-none absolute left-0.5 top-0.5 text-[0.72rem] font-semibold leading-none text-print-ink/60 group-hover:text-print-ink/80">
                    {startNumber}
                  </span>
                ) : null}
                {cell.blocked ? (
                  <span className="sr-only">Blockerad ruta</span>
                ) : displayLetter ? (
                  <span className="text-[clamp(1.2rem,52cqmin,1.65rem)] font-bold leading-none tracking-[0.02em]">
                    {displayLetter}
                  </span>
                ) : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
