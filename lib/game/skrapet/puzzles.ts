export type SkrapetPuzzle = {
  word: string;
  clues: string[];
};

/** Local prototype puzzles — no database. */
export const SKRAPET_PUZZLES: SkrapetPuzzle[] = [
  {
    word: 'BILNYCKEL',
    clues: [
      'Används för att låsa upp',
      'Har ofta metall',
      'Hör ihop med ett fordon',
      'Börjar på B',
      '9 bokstäver',
      '🚗',
    ],
  },
  {
    word: 'HUND',
    clues: ['Ett djur', 'Kan skälla', 'Vanligt husdjur', '4 bokstäver', '🐶', 'Börjar på H'],
  },
  {
    word: 'PARAPLY',
    clues: [
      'Skydd mot regn',
      'Fälls ihop',
      'Bär du ovanför huvudet',
      '7 bokstäver',
      '☔',
      'Börjar på P',
    ],
  },
  {
    word: 'BIBLIOTEK',
    clues: ['Fullt av böcker', 'Man lånar här', 'Tyst zon', '9 bokstäver', '📚', 'Börjar på B'],
  },
  {
    word: 'REGNBÅGE',
    clues: [
      'Syns efter regn',
      'Har många färger',
      'Båge på himlen',
      '8 bokstäver',
      '🌈',
      'Börjar på R',
    ],
  },
  {
    word: 'CYKEL',
    clues: ['Två hjul', 'Trampas fram', 'Har pedaler', '5 bokstäver', '🚲', 'Börjar på C'],
  },
  {
    word: 'KAFFEKOPP',
    clues: [
      'Innehåller en dryck',
      'Värms ofta i handen',
      'Till morgonstunden',
      '9 bokstäver',
      '☕',
      'Börjar på K',
    ],
  },
  {
    word: 'FJÄRIL',
    clues: [
      'Ett insekt',
      'Har vingar',
      'Flyger mellan blommor',
      '6 bokstäver',
      '🦋',
      'Börjar på F',
    ],
  },
  {
    word: 'TIDNING',
    clues: [
      'Kommer med nyheter',
      'Papper som viks',
      'Läsning på morgonen',
      '7 bokstäver',
      '📰',
      'Börjar på T',
    ],
  },
  {
    word: 'SOLNEDGÅNG',
    clues: [
      'Sker på kvällen',
      'Himlen färgas',
      'Solen försvinner',
      '10 bokstäver',
      '🌅',
      'Börjar på S',
    ],
  },
  {
    word: 'MOUSSAKA',
    clues: [
      'En maträtt',
      'Ofta med aubergine',
      'Från Medelhavet',
      '8 bokstäver',
      '🍆',
      'Börjar på M',
    ],
  },
  {
    word: 'GRÖNSAK',
    clues: [
      'Växer i jorden',
      'Äts till middag',
      'Morot är en sådan',
      '7 bokstäver',
      '🥕',
      'Börjar på G',
    ],
  },
  {
    word: 'SNÖBOLL',
    clues: [
      'Kastas på vintern',
      'Kall och rund',
      'Lekplats i snö',
      '7 bokstäver',
      '❄️',
      'Börjar på S',
    ],
  },
  {
    word: 'GITARR',
    clues: [
      'Ett instrument',
      'Har strängar',
      'Spelas med fingrar',
      '6 bokstäver',
      '🎸',
      'Börjar på G',
    ],
  },
  {
    word: 'STJÄRNA',
    clues: [
      'Lyser på natthimlen',
      'Kan önska på',
      'Långt bort i rymden',
      '7 bokstäver',
      '⭐',
      'Börjar på S',
    ],
  },
];

export function pickRandomSkrapetPuzzle(): SkrapetPuzzle {
  const index = Math.floor(Math.random() * SKRAPET_PUZZLES.length);
  return SKRAPET_PUZZLES[index] ?? SKRAPET_PUZZLES[0]!;
}

export function normalizeSkrapetGuess(value: string): string {
  return value.trim().toLocaleUpperCase('sv-SE').replace(/\s+/g, '');
}

export function formatSkrapetClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Prototype scoring — may change later. */
export const SKRAPET_BASE_SCORE = 500;
export const SKRAPET_CLUE_PENALTY = 50;

export function calculateSkrapetScore(revealedCount: number, elapsedSeconds: number): number {
  return SKRAPET_BASE_SCORE - revealedCount * SKRAPET_CLUE_PENALTY - elapsedSeconds;
}
