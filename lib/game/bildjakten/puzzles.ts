import { normalizeNormalizedAnswerInput } from '@/lib/content/normalize-answer';
import { createBildjaktPuzzle, type BildjaktPuzzle } from '@/lib/game/bildjakten/types';

type PrototypePuzzleInput = {
  id: string;
  answer: string;
  imageSrc: string;
  imageAlt: string;
};

const PROTOTYPE_PUZZLES: PrototypePuzzleInput[] = [
  {
    id: 'proto-bilnyckel',
    answer: 'BILNYCKEL',
    imageSrc: '/test/bildjakten/bilnyckel.svg',
    imageAlt: 'En bilnyckel med liten bilsymbol',
  },
  {
    id: 'proto-hund',
    answer: 'HUND',
    imageSrc: '/test/bildjakten/hund.svg',
    imageAlt: 'En hund som sitter',
  },
  {
    id: 'proto-paraply',
    answer: 'PARAPLY',
    imageSrc: '/test/bildjakten/paraply.svg',
    imageAlt: 'Ett öppet paraply',
  },
  {
    id: 'proto-cykel',
    answer: 'CYKEL',
    imageSrc: '/test/bildjakten/cykel.svg',
    imageAlt: 'En cykel i sidovy',
  },
  {
    id: 'proto-regnbage',
    answer: 'REGNBÅGE',
    imageSrc: '/test/bildjakten/regnbage.svg',
    imageAlt: 'En regnbåge över ett landskap',
  },
];

export function mapPrototypeToBildjaktPuzzle(input: PrototypePuzzleInput): BildjaktPuzzle {
  return createBildjaktPuzzle({
    id: input.id,
    answer: input.answer,
    normalizedAnswer: normalizeNormalizedAnswerInput(input.answer),
    imageUrl: input.imageSrc,
    altText: input.imageAlt,
  });
}

/** Hardcoded fallback dataset when no approved MediaAsset images exist. */
export const BILDJAKT_PROTOTYPE_PUZZLES: BildjaktPuzzle[] = PROTOTYPE_PUZZLES.map(
  mapPrototypeToBildjaktPuzzle,
);
