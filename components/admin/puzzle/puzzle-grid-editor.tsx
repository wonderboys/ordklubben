'use client';

import { useMemo, useTransition } from 'react';
import {
  buildCellOwnershipMap,
  buildPuzzleGrid,
  computeStartCellNumbers,
  getPlacementCells,
  type PuzzleBlockedCellInput,
  type PuzzlePlacementInput,
} from '@/lib/content/puzzle/grid';
import type { PuzzleGhostPlacement } from '@/components/admin/puzzle/puzzle-ghost-placement';
import { togglePuzzleBlockedCell } from '@/lib/content/puzzle-actions';
import { cn } from '@/lib/utils';

export type PuzzleGridEntry = PuzzlePlacementInput & {
  id: string;
  number?: number | null;
};

export type PuzzleGridCellInteraction =
  | { type: 'entry'; entryId: string; row: number; col: number }
  | { type: 'placement'; row: number; col: number }
  | { type: 'blocked'; row: number; col: number };

type PuzzleGridEditorProps = {
  puzzleId: string;
  width: number;
  height: number;
  entries: PuzzleGridEntry[];
  blockedCells: PuzzleBlockedCellInput[];
  activeEntryId: string | null;
  selectedCell: { row: number; col: number } | null;
  selectedBlockedCell: { row: number; col: number } | null;
  blockMode: boolean;
  ghostPlacement: PuzzleGhostPlacement | null;
  allowPlacementOnOccupiedCells: boolean;
  onCellInteract: (interaction: PuzzleGridCellInteraction) => void;
  /** Reserved for future hover-preview. */
  onCellHover?: (cell: { row: number; col: number } | null) => void;
};

export function PuzzleGridEditor({
  puzzleId,
  width,
  height,
  entries,
  blockedCells,
  activeEntryId,
  selectedCell,
  selectedBlockedCell,
  blockMode,
  ghostPlacement,
  allowPlacementOnOccupiedCells,
  onCellInteract,
  onCellHover,
}: PuzzleGridEditorProps) {
  const [isPending, startTransition] = useTransition();
  const grid = buildPuzzleGrid({ width, height, entries, blockedCells });

  const ownershipMap = useMemo(() => buildCellOwnershipMap(entries), [entries]);

  const startCellNumbers = useMemo(() => computeStartCellNumbers(entries), [entries]);

  const activeCells = useMemo(() => {
    if (!activeEntryId) {
      return new Set<string>();
    }

    const entry = entries.find((item) => item.id === activeEntryId);

    if (!entry) {
      return new Set<string>();
    }

    return new Set(getPlacementCells(entry).map((cell) => `${cell.row}:${cell.col}`));
  }, [activeEntryId, entries]);

  const activeStartKey = useMemo(() => {
    if (!activeEntryId) {
      return null;
    }

    const entry = entries.find((item) => item.id === activeEntryId);

    if (!entry) {
      return null;
    }

    return `${entry.row}:${entry.col}`;
  }, [activeEntryId, entries]);

  function handleCellClick(row: number, col: number) {
    const cell = grid[row]?.[col];

    if (!cell) {
      return;
    }

    if (blockMode) {
      if (cell.letter) {
        return;
      }

      const formData = new FormData();
      formData.set('puzzleId', puzzleId);
      formData.set('row', String(row));
      formData.set('col', String(col));
      startTransition(() => togglePuzzleBlockedCell(formData));
      return;
    }

    if (cell.blocked) {
      onCellInteract({ type: 'blocked', row, col });
      return;
    }

    const ownership = ownershipMap.get(`${row}:${col}`);

    if (ownership && !allowPlacementOnOccupiedCells) {
      onCellInteract({
        type: 'entry',
        entryId: ownership.entryId,
        row,
        col,
      });
      return;
    }

    onCellInteract({ type: 'placement', row, col });
  }

  const cellSize = width <= 9 ? '2.85rem' : width <= 12 ? '2.45rem' : '2.1rem';

  return (
    <div className={cn('w-full', isPending && 'opacity-70')}>
      <div
        className="inline-grid w-full max-w-full gap-0.5 rounded-sm border-2 border-print-ink/25 bg-print-ink/10 p-1"
        style={{
          gridTemplateColumns: `repeat(${width}, minmax(${cellSize}, 1fr))`,
        }}
      >
        {grid.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const cellKey = `${rowIndex}:${colIndex}`;
            const ownership = ownershipMap.get(cellKey);
            const isActiveCell = activeCells.has(cellKey);
            const isActiveStart = activeStartKey === cellKey;
            const isPlacementCell =
              selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            const isBlockedSelected =
              selectedBlockedCell?.row === rowIndex && selectedBlockedCell?.col === colIndex;
            const startNumber = startCellNumbers.get(cellKey);
            const ghostCell = ghostPlacement?.cells.get(cellKey);
            const isGhostCell = Boolean(ghostCell);
            const isGhostStart = ghostPlacement?.startKey === cellKey;
            const isGhostInvalid = isGhostCell && ghostPlacement && !ghostPlacement.isValid;
            const isGhostOverlap = isGhostCell && Boolean(ghostCell?.overlapsExisting);
            const displayLetter = isGhostCell ? ghostCell?.letter : cell.letter;

            return (
              <button
                key={cellKey}
                type="button"
                data-puzzle-cell=""
                data-row={rowIndex}
                data-col={colIndex}
                data-entry-id={ownership?.entryId ?? undefined}
                data-is-start={ownership?.isStart ? 'true' : undefined}
                data-ghost-cell={isGhostCell ? 'true' : undefined}
                data-cell-kind={cell.blocked ? 'blocked' : displayLetter ? 'letter' : 'empty'}
                onMouseEnter={() => onCellHover?.({ row: rowIndex, col: colIndex })}
                onMouseLeave={() => onCellHover?.(null)}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className={cn(
                  '@container group relative flex aspect-square items-center justify-center border uppercase transition-[colors,box-shadow,transform]',
                  !blockMode && 'hover:z-10 hover:ring-2 hover:ring-print-ink/20',
                  blockMode &&
                    !cell.letter &&
                    'cursor-crosshair hover:z-10 hover:ring-2 hover:ring-print-yellow/45',
                  blockMode && cell.letter && 'cursor-not-allowed opacity-75 hover:ring-0',
                  cell.blocked
                    ? cn(
                        'border-print-ink/20 bg-[#5a5752] shadow-inner',
                        isBlockedSelected && 'ring-2 ring-print-yellow ring-offset-1',
                        !blockMode && 'hover:ring-print-yellow/50',
                      )
                    : isGhostCell
                      ? isGhostInvalid
                        ? 'z-10 border-dashed border-print-yellow/70 bg-print-yellow-soft/50 text-print-ink'
                        : isGhostOverlap
                          ? cn(
                              'z-10 border-dashed border-print-ink/35 bg-print-bg/35 text-print-ink/85 ring-1 ring-inset ring-print-ink/15',
                              isGhostStart && 'ring-2 ring-print-ink/20 ring-offset-1',
                            )
                          : cn(
                              'z-10 border-dashed border-print-ink/45 bg-print-bg/55 text-print-ink/75',
                              isGhostStart && 'ring-2 ring-print-ink/20 ring-offset-1',
                            )
                      : cell.letter
                        ? cell.conflict
                          ? 'border-print-red/40 bg-print-red-soft text-print-red'
                          : isActiveCell
                            ? cn(
                                'z-10 border-print-ink/25 bg-print-bg/90 text-print-ink shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]',
                                !isActiveStart && 'ring-1 ring-inset ring-print-ink/12',
                              )
                            : 'border-print-ink/15 bg-print-surface text-print-ink'
                        : cn(
                            'border-print-ink/10 bg-print-bg text-transparent',
                            'hover:border-print-ink/25 hover:bg-print-ink/[0.04]',
                          ),
                  isPlacementCell &&
                    !cell.blocked &&
                    !isGhostCell &&
                    'z-10 border-print-ink bg-print-ink/[0.03] ring-2 ring-print-ink/35 ring-offset-1',
                  isActiveStart &&
                    !isGhostCell &&
                    'z-20 border-print-ink ring-4 ring-print-ink/25 ring-offset-2',
                )}
                title={
                  isGhostInvalid && ghostPlacement?.message
                    ? ghostPlacement.message
                    : `Rad ${rowIndex + 1}, kolumn ${colIndex + 1}`
                }
              >
                {startNumber != null ? (
                  <span className="pointer-events-none absolute left-0.5 top-0.5 text-[0.72rem] font-semibold leading-none text-print-ink/60 group-hover:text-print-ink/80">
                    {startNumber}
                  </span>
                ) : null}
                {cell.blocked ? (
                  <span className="sr-only">Blockerad ruta</span>
                ) : displayLetter ? (
                  <span
                    className={cn(
                      'text-[clamp(1.2rem,52cqmin,1.65rem)] font-bold leading-none tracking-[0.02em]',
                      isGhostCell && !isGhostInvalid && 'opacity-80',
                      isGhostInvalid && 'opacity-95',
                    )}
                  >
                    {displayLetter}
                  </span>
                ) : (
                  '·'
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
