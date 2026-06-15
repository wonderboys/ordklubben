'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { OrdflataClues } from '@/components/games/ordflata/ordflata-clues';
import { OrdflataGrid } from '@/components/games/ordflata/ordflata-grid';
import { OrdflataKeyboard } from '@/components/games/ordflata/ordflata-keyboard';
import { GameToast, useGameToast } from '@/components/games/game-toast';
import { PUZZLE_DIRECTION_LABELS } from '@/lib/content/constants';
import { getPlacementCells } from '@/lib/content/puzzle/grid';
import type { OrdflataPlayerPuzzle } from '@/lib/content/ordflata-alpha';
import { normalizeSwedish } from '@/lib/dictionary/normalize-swedish';

const SWEDISH_LETTER_PATTERN = /^[a-zåäö]$/;

function cellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function getEntryCells(entry: OrdflataPlayerPuzzle['entries'][number]) {
  return getPlacementCells({
    answerSnapshot: entry.answer,
    row: entry.row,
    col: entry.col,
    direction: entry.direction,
  });
}

function findEntriesAtCell(entries: OrdflataPlayerPuzzle['entries'], row: number, col: number) {
  return entries.filter((entry) =>
    getEntryCells(entry).some((cell) => cell.row === row && cell.col === col),
  );
}

function pickActiveEntry(
  entriesAtCell: OrdflataPlayerPuzzle['entries'],
  preferredEntryId: string | null,
) {
  if (entriesAtCell.length === 0) {
    return null;
  }

  if (preferredEntryId && entriesAtCell.some((entry) => entry.id === preferredEntryId)) {
    return preferredEntryId;
  }

  const across = entriesAtCell.find((entry) => entry.direction === 'ACROSS');
  return (across ?? entriesAtCell[0]).id;
}

function getFocusCellForEntry(
  entry: OrdflataPlayerPuzzle['entries'][number],
  filledCells: Map<string, string>,
) {
  const cells = getEntryCells(entry);
  const firstEmpty = cells.find((cell) => !filledCells.has(cellKey(cell.row, cell.col)));
  const target = firstEmpty ?? cells[0];

  return target ? { row: target.row, col: target.col } : null;
}

function getAdjacentCellInEntry(
  entry: OrdflataPlayerPuzzle['entries'][number],
  row: number,
  col: number,
  forward: boolean,
) {
  const cells = getEntryCells(entry);
  const index = cells.findIndex((cell) => cell.row === row && cell.col === col);

  if (index === -1) {
    return null;
  }

  const next = cells[index + (forward ? 1 : -1)];
  return next ? { row: next.row, col: next.col } : null;
}

function getInitialSelection(entries: OrdflataPlayerPuzzle['entries']) {
  const firstEntry = [...entries].sort((left, right) => {
    const leftNumber = left.number ?? Number.MAX_SAFE_INTEGER;
    const rightNumber = right.number ?? Number.MAX_SAFE_INTEGER;
    return leftNumber - rightNumber;
  })[0];

  if (!firstEntry) {
    return { selectedCell: null, activeEntryId: null };
  }

  return {
    selectedCell: { row: firstEntry.row, col: firstEntry.col },
    activeEntryId: firstEntry.id,
  };
}

type OrdflataGameProps = {
  puzzle: OrdflataPlayerPuzzle;
};

export function OrdflataGame({ puzzle }: OrdflataGameProps) {
  const initialSelection = useMemo(() => getInitialSelection(puzzle.entries), [puzzle.entries]);
  const { toast, showToast } = useGameToast(1800);
  const [filledCells, setFilledCells] = useState<Map<string, string>>(() => new Map());
  const [selectedCell, setSelectedCell] = useState(initialSelection.selectedCell);
  const [activeEntryId, setActiveEntryId] = useState(initialSelection.activeEntryId);
  const lastSelectedRef = useRef<{ row: number; col: number } | null>(
    initialSelection.selectedCell,
  );
  const completionToastShownRef = useRef(false);

  const answerMap = useMemo(() => {
    const map = new Map<string, string>();

    for (const entry of puzzle.entries) {
      for (const cell of getEntryCells(entry)) {
        map.set(cellKey(cell.row, cell.col), cell.letter);
      }
    }

    return map;
  }, [puzzle.entries]);

  const letterCellKeys = useMemo(() => new Set(answerMap.keys()), [answerMap]);

  const checkCompletion = useCallback(
    (nextFilled: Map<string, string>) => {
      for (const key of letterCellKeys) {
        const expected = answerMap.get(key);
        const actual = nextFilled.get(key)?.toLocaleUpperCase('sv-SE');

        if (!actual || actual !== expected) {
          return false;
        }
      }

      return letterCellKeys.size > 0;
    },
    [answerMap, letterCellKeys],
  );

  const isComplete = useMemo(() => checkCompletion(filledCells), [checkCompletion, filledCells]);

  const maybeCelebrateCompletion = useCallback(
    (nextFilled: Map<string, string>) => {
      if (completionToastShownRef.current || !checkCompletion(nextFilled)) {
        return;
      }

      completionToastShownRef.current = true;
      showToast('Flätan är klar!', 'win');
    },
    [checkCompletion, showToast],
  );

  const focusCell = useCallback((row: number, col: number) => {
    lastSelectedRef.current = { row, col };
    setSelectedCell({ row, col });
  }, []);

  const selectCell = useCallback(
    (row: number, col: number) => {
      const key = cellKey(row, col);

      if (!letterCellKeys.has(key)) {
        return;
      }

      const entriesAtCell = findEntriesAtCell(puzzle.entries, row, col);
      const isSameCell =
        lastSelectedRef.current?.row === row && lastSelectedRef.current?.col === col;

      let nextEntryId = pickActiveEntry(entriesAtCell, activeEntryId);

      if (isSameCell && entriesAtCell.length > 1 && activeEntryId) {
        const other = entriesAtCell.find((entry) => entry.id !== activeEntryId);
        if (other) {
          nextEntryId = other.id;
        }
      }

      setActiveEntryId(nextEntryId);
      focusCell(row, col);
    },
    [activeEntryId, focusCell, letterCellKeys, puzzle.entries],
  );

  const selectEntry = useCallback(
    (entryId: string) => {
      const entry = puzzle.entries.find((item) => item.id === entryId);

      if (!entry) {
        return;
      }

      const focus = getFocusCellForEntry(entry, filledCells);

      setActiveEntryId(entry.id);

      if (focus) {
        focusCell(focus.row, focus.col);
      }
    },
    [filledCells, focusCell, puzzle.entries],
  );

  const activeEntry = useMemo(
    () => puzzle.entries.find((entry) => entry.id === activeEntryId) ?? null,
    [activeEntryId, puzzle.entries],
  );

  const applyLetter = useCallback(
    (letter: string) => {
      if (isComplete || !selectedCell || !activeEntry) {
        return;
      }

      const normalized = normalizeSwedish(letter).toLocaleUpperCase('sv-SE');
      const key = cellKey(selectedCell.row, selectedCell.col);
      const nextFilled = new Map(filledCells);
      nextFilled.set(key, normalized);
      setFilledCells(nextFilled);
      maybeCelebrateCompletion(nextFilled);

      const nextCell = getAdjacentCellInEntry(
        activeEntry,
        selectedCell.row,
        selectedCell.col,
        true,
      );

      if (nextCell) {
        focusCell(nextCell.row, nextCell.col);
      }
    },
    [activeEntry, filledCells, focusCell, isComplete, maybeCelebrateCompletion, selectedCell],
  );

  const applyBackspace = useCallback(() => {
    if (isComplete || !selectedCell || !activeEntry) {
      return;
    }

    const key = cellKey(selectedCell.row, selectedCell.col);
    const hasLetter = filledCells.has(key);

    if (hasLetter) {
      setFilledCells((current) => {
        const next = new Map(current);
        next.delete(key);
        return next;
      });
      return;
    }

    const previousCell = getAdjacentCellInEntry(
      activeEntry,
      selectedCell.row,
      selectedCell.col,
      false,
    );

    if (previousCell) {
      const previousKey = cellKey(previousCell.row, previousCell.col);
      setFilledCells((current) => {
        const next = new Map(current);
        next.delete(previousKey);
        return next;
      });
      focusCell(previousCell.row, previousCell.col);
    }
  }, [activeEntry, filledCells, focusCell, isComplete, selectedCell]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isComplete) {
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        applyBackspace();
        return;
      }

      if (event.key === ' ' || event.key === 'Tab') {
        return;
      }

      const letter = normalizeSwedish(event.key);

      if (!SWEDISH_LETTER_PATTERN.test(letter)) {
        return;
      }

      event.preventDefault();
      applyLetter(letter);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [applyBackspace, applyLetter, isComplete]);

  return (
    <div className="relative w-full md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] md:items-start md:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:gap-6">
      <div className="relative flex min-w-0 flex-col gap-4">
        <GameToast message={toast?.message ?? null} tone={toast?.tone} toastId={toast?.id} />

        <OrdflataGrid
          width={puzzle.width}
          height={puzzle.height}
          entries={puzzle.entries}
          blockedCells={puzzle.blockedCells}
          filledCells={filledCells}
          selectedCell={selectedCell}
          activeEntryId={activeEntryId}
          onSelectCell={selectCell}
        />

        {activeEntry ? (
          <div className="border border-print-ink/15 bg-print-surface px-3 py-2 md:hidden">
            <p className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.08em] text-print-muted">
              {PUZZLE_DIRECTION_LABELS[activeEntry.direction]}
            </p>
            <p className="mt-0.5 text-sm leading-snug text-print-ink">
              <span className="font-semibold">{activeEntry.number ?? '–'}.</span> {activeEntry.clue}
              <span className="text-print-muted"> ({activeEntry.length})</span>
            </p>
          </div>
        ) : null}

        <OrdflataKeyboard
          disabled={isComplete}
          onLetter={applyLetter}
          onBackspace={applyBackspace}
        />

        {isComplete ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-sm border border-print-green/30 bg-print-green-soft px-4 py-3 text-center"
          >
            <p className="font-mono text-sm font-bold uppercase tracking-[0.06em] text-print-green">
              Klart — hela flätan är löst
            </p>
          </motion.div>
        ) : null}
      </div>

      <OrdflataClues
        entries={puzzle.entries}
        activeEntryId={activeEntryId}
        onSelectEntry={selectEntry}
        className="md:sticky md:top-4"
      />
    </div>
  );
}
