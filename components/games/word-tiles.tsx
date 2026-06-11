"use client";

import { LetterTile } from "@/components/games/letter-tile";
import { cn } from "@/lib/utils";

export const WORD_TILE_SHELL_CLASS = "aspect-square w-full";
export const WORD_TILE_CLASS =
  "!size-full !h-full !w-full max-w-none text-[1.12rem] leading-none md:text-[1.5rem]";
const ACTIVE_EMPTY_TILE_CLASS =
  "rounded-none border border-print-ink bg-print-surface shadow-[var(--print-shadow-soft)]";
const INACTIVE_EMPTY_TILE_CLASS =
  "rounded-none border border-print-ink/25 bg-print-surface shadow-[var(--print-shadow-soft)]";

/** Matches Dagens Ord board tile width scaled to four columns. */
export const WORD_TILE_ROW_WIDTH_CLASS = "w-[14.75rem] shrink-0 sm:w-[15.5rem]";

function tileClassName(...classes: string[]) {
  return [WORD_TILE_CLASS, ...classes].join(" ");
}

export function WordTileEmpty({ active = false }: { active?: boolean }) {
  return (
    <div className={WORD_TILE_SHELL_CLASS}>
      <div
        className={tileClassName(
          active ? ACTIVE_EMPTY_TILE_CLASS : INACTIVE_EMPTY_TILE_CLASS,
        )}
      />
    </div>
  );
}

export type WordTileCellState = "idle" | "used";

export function WordTileCell({
  letter,
  state = "idle",
  emptyActive = false,
}: {
  letter?: string;
  state?: WordTileCellState;
  emptyActive?: boolean;
}) {
  if (!letter) {
    return <WordTileEmpty active={emptyActive} />;
  }

  return (
    <div className={WORD_TILE_SHELL_CLASS}>
      <LetterTile
        letter={letter}
        size="xs"
        state={state === "used" ? "used" : "idle"}
        disableEntryAnimation
        className={tileClassName("transition-colors duration-150")}
      />
    </div>
  );
}

export type WordTileRowCell = {
  letter?: string;
  state?: WordTileCellState;
  emptyActive?: boolean;
};

export function WordTileRow({
  length,
  cells,
  className,
}: {
  length: number;
  cells: WordTileRowCell[];
  className?: string;
}) {
  const columnClass =
    length === 4
      ? "grid-cols-4"
      : length === 5
        ? "grid-cols-5"
        : length === 6
          ? "grid-cols-6"
          : "grid-cols-4";

  return (
    <div
      className={cn(
        WORD_TILE_ROW_WIDTH_CLASS,
        "grid gap-1.5",
        columnClass,
        className,
      )}
    >
      {Array.from({ length }, (_, index) => {
        const cell = cells[index];

        return (
          <WordTileCell
            key={index}
            letter={cell?.letter}
            state={cell?.state}
            emptyActive={cell?.emptyActive}
          />
        );
      })}
    </div>
  );
}
