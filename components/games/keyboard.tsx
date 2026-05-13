"use client";

import { Delete, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLetterCount } from "@/lib/dictionary/letter-pool";
import { normalizeSwedish } from "@/lib/dictionary/normalize-swedish";
import { cn } from "@/lib/utils";

type KeyboardProps = {
  letters: string[];
  input: string;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
};

export function Keyboard({
  letters,
  input,
  onLetter,
  onBackspace,
  onSubmit,
}: KeyboardProps) {
  return (
    <div className="shell-card p-4 sm:p-5">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {letters.map((letter, index) => {
          const activeCount = input
            .split("")
            .filter(
              (inputLetter) => inputLetter === normalizeSwedish(letter),
            ).length;
          const totalCount = getLetterCount(letters.slice(0, index + 1), letter);
          const disabled = activeCount >= totalCount;

          return (
            <Button
              key={`${letter}-${index}`}
              variant="outline"
              className={cn(
                "h-14 rounded-2xl border bg-white text-xl font-semibold uppercase tracking-[0.04em]",
                disabled && "opacity-35",
              )}
              disabled={disabled}
              onClick={() => onLetter(normalizeSwedish(letter))}
            >
              {letter}
            </Button>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-[1fr_1fr] gap-2">
        <Button
          variant="ghost"
          className="h-12 rounded-2xl"
          onClick={onBackspace}
          disabled={!input.length}
        >
          <Delete className="mr-2 size-4" />
          Radera
        </Button>
        <Button
          variant="accent"
          className="h-12 rounded-2xl"
          onClick={onSubmit}
          disabled={input.length < 3}
        >
          <CornerDownLeft className="mr-2 size-4" />
          Lägg ord
        </Button>
      </div>
    </div>
  );
}
