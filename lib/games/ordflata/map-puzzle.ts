import type { Prisma } from '@prisma/client';
import { getAnswerLength } from '@/lib/content/puzzle/grid';
import { normalizeOrdflataAnswer } from '@/lib/games/ordflata/rules';
import type { OrdflataPlayerPuzzle } from '@/lib/games/ordflata/types';

type OrdflataPuzzleRecord = Prisma.PuzzleGetPayload<{
  include: {
    entries: {
      include: {
        hint: {
          select: {
            text: true;
          };
        };
      };
    };
    blockedCells: true;
  };
}>;

export function mapPuzzleToPlayer(puzzle: OrdflataPuzzleRecord): OrdflataPlayerPuzzle {
  return {
    title: puzzle.title,
    width: puzzle.width,
    height: puzzle.height,
    entries: puzzle.entries.map((entry) => ({
      id: entry.id,
      row: entry.row,
      col: entry.col,
      direction: entry.direction,
      number: entry.number,
      length: getAnswerLength(entry.answerSnapshot),
      answer: normalizeOrdflataAnswer(entry.answerSnapshot),
      clue: entry.hintSnapshot ?? entry.hint?.text ?? 'Ingen nyckel',
    })),
    blockedCells: puzzle.blockedCells.map((cell) => ({
      row: cell.row,
      col: cell.col,
    })),
  };
}
