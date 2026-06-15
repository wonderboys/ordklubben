export type GameStatus = "playable" | "coming-soon";

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
};

export const games = [
  {
    id: "dagens-ord",
    title: "Dagens Ord",
    href: "/dagens-ord",
    status: "playable",
    badgeLabel: "Dagligt",
    description: "Gissa dagens ord på fem bokstäver. Sex försök.",
  },
  {
    id: "ordstorm",
    title: "Ordstorm",
    href: "/ordstorm",
    status: "playable",
    badgeLabel: "Fritt",
    description: "Sex bokstäver. En minut. Hitta så många ord du kan.",
  },
  {
    id: "stegvis",
    title: "Stegvis",
    href: "/stegvis",
    status: "playable",
    badgeLabel: "Dagligt",
    description: "Förvandla ett ord till ett annat. Ett steg i taget.",
  },
  {
    id: "emojirebus",
    title: "Emojirebus",
    href: "/emojirebus",
    status: "playable",
    badgeLabel: "Test",
    description: "Gissa ordet utifrån emojis. Tidig test av en ny spelidé.",
    libraryDescription: "Gissa ordet utifrån emojis.",
  },
  {
    id: "kastet",
    title: "Kastet",
    href: "/kastet",
    status: "playable",
    badgeLabel: "Test",
    description: "Skaka bokstavstärningarna och bygg ord av det du får.",
    libraryDescription: "Kasta tärningar och bygg ord.",
  },
  {
    id: "skrapet",
    title: "Skrapet",
    href: "/skrapet",
    status: "playable",
    badgeLabel: "Test",
    description: "Skrapa fram ledtrådar och gissa ordet innan du avslöjar för mycket.",
    libraryDescription: "Skrapa ledtrådar och gissa ordet.",
  },
  {
    id: "bildjakten",
    title: "Bildjakten",
    href: "/test/bildjakten",
    status: "playable",
    badgeLabel: "Test",
    description: "Gissa ordet utifrån bilden. Tidig test av en ny spelidé.",
    libraryDescription: "Gissa ordet utifrån bilden.",
  },
  {
    id: "ordflata",
    title: "Ordfläta",
    href: "/ordflata",
    status: "playable",
    badgeLabel: "Beta",
    secondaryBadgeLabel: "Dagligt",
    description: "Lös ordflätan med hjälp av nycklarna. Ett tidigt test av ett nytt dagligt pussel.",
    libraryDescription: "Lös flätan med nycklarna. Tidigt test.",
  },
] as const satisfies readonly GameDefinition[];

export const testGames = games.filter(
  (game): game is (typeof games)[number] =>
    game.id === "emojirebus" ||
    game.id === "kastet" ||
    game.id === "skrapet" ||
    game.id === "bildjakten",
);

export const libraryGames = games.filter(
  (game): game is (typeof games)[number] =>
    game.id !== "emojirebus" &&
    game.id !== "kastet" &&
    game.id !== "skrapet" &&
    game.id !== "bildjakten",
);

export const homeGames = games.filter(
  (game): game is (typeof games)[number] =>
    game.id === "dagens-ord" || game.id === "ordstorm" || game.id === "stegvis",
);

export const ordflataBetaGame = games.find((game) => game.id === "ordflata")!;

export type GameId = (typeof games)[number]["id"];

export function getGameStatusLabel(status: GameStatus): string {
  if (status === "playable") {
    return "Spelbar";
  }

  return "Kommer snart";
}
