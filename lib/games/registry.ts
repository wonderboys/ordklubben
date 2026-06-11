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

export const libraryGames = games;

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
