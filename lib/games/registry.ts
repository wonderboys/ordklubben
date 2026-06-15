export type GameStatus = 'playable' | 'coming-soon';
export type GameLibrarySection = 'library' | 'test';

export type GameDefinition = {
  id: string;
  title: string;
  href: string;
  status: GameStatus;
  badgeLabel: string;
  secondaryBadgeLabel?: string;
  description: string;
  /** Short line for library tiles; falls back to description. */
  libraryDescription?: string;
  showOnHome?: boolean;
  librarySection?: GameLibrarySection;
  highlightOnHome?: boolean;
};

export const games = [
  {
    id: 'dagens-ord',
    title: 'Dagens Ord',
    href: '/dagens-ord',
    status: 'playable',
    badgeLabel: 'Dagligt',
    description: 'Gissa dagens ord på fem bokstäver. Sex försök.',
    showOnHome: true,
    librarySection: 'library',
    highlightOnHome: false,
  },
  {
    id: 'ordstorm',
    title: 'Ordstorm',
    href: '/ordstorm',
    status: 'playable',
    badgeLabel: 'Fritt',
    description: 'Sex bokstäver. En minut. Hitta så många ord du kan.',
    showOnHome: true,
    librarySection: 'library',
    highlightOnHome: false,
  },
  {
    id: 'stegvis',
    title: 'Stegvis',
    href: '/stegvis',
    status: 'playable',
    badgeLabel: 'Dagligt',
    description: 'Förvandla ett ord till ett annat. Ett steg i taget.',
    showOnHome: true,
    librarySection: 'library',
    highlightOnHome: false,
  },
  {
    id: 'emojirebus',
    title: 'Emojirebus',
    href: '/emojirebus',
    status: 'playable',
    badgeLabel: 'Test',
    description: 'Gissa ordet utifrån emojis. Tidig test av en ny spelidé.',
    libraryDescription: 'Gissa ordet utifrån emojis.',
    showOnHome: false,
    librarySection: 'test',
    highlightOnHome: false,
  },
  {
    id: 'kastet',
    title: 'Kastet',
    href: '/kastet',
    status: 'playable',
    badgeLabel: 'Test',
    description: 'Skaka bokstavstärningarna och bygg ord av det du får.',
    libraryDescription: 'Kasta tärningar och bygg ord.',
    showOnHome: false,
    librarySection: 'test',
    highlightOnHome: false,
  },
  {
    id: 'skrapet',
    title: 'Skrapet',
    href: '/skrapet',
    status: 'playable',
    badgeLabel: 'Test',
    description: 'Skrapa fram ledtrådar och gissa ordet innan du avslöjar för mycket.',
    libraryDescription: 'Skrapa ledtrådar och gissa ordet.',
    showOnHome: false,
    librarySection: 'test',
    highlightOnHome: false,
  },
  {
    id: 'bildjakten',
    title: 'Bildjakten',
    href: '/test/bildjakten',
    status: 'playable',
    badgeLabel: 'Test',
    description: 'Gissa ordet utifrån bilden. Tidig test av en ny spelidé.',
    libraryDescription: 'Gissa ordet utifrån bilden.',
    showOnHome: false,
    librarySection: 'test',
    highlightOnHome: false,
  },
  {
    id: 'ordflata',
    title: 'Ordfläta',
    href: '/ordflata',
    status: 'playable',
    badgeLabel: 'Beta',
    secondaryBadgeLabel: 'Dagligt',
    description:
      'Lös ordflätan med hjälp av nycklarna. Ett tidigt test av ett nytt dagligt pussel.',
    libraryDescription: 'Lös flätan med nycklarna. Tidigt test.',
    showOnHome: false,
    librarySection: 'library',
    highlightOnHome: true,
  },
] as const satisfies readonly GameDefinition[];

export const testGames = games.filter(
  (game): game is (typeof games)[number] => game.librarySection === 'test',
);

export const libraryGames = games.filter(
  (game): game is (typeof games)[number] => game.librarySection === 'library',
);

export const homeGames = games.filter(
  (game): game is (typeof games)[number] => game.showOnHome === true,
);

export const ordflataBetaGame = games.find(
  (game): game is Extract<(typeof games)[number], { id: 'ordflata' }> =>
    game.highlightOnHome === true,
)!;

export type GameId = (typeof games)[number]['id'];

export function getGameStatusLabel(status: GameStatus): string {
  if (status === 'playable') {
    return 'Spelbar';
  }

  return 'Kommer snart';
}
