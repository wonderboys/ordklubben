export type GameStatus = "playable" | "coming-soon";

export type GameDefinition = {
  id: string;
  title: string;
  href: string;
  status: GameStatus;
  description: string;
};

export const games = [
  {
    id: "ordstorm",
    title: "Ordstorm",
    href: "/ordstorm",
    status: "playable",
    description: "Sex bokstäver. En minut. Hitta så många ord du kan.",
  },
  {
    id: "stegvis",
    title: "Stegvis",
    href: "/stegvis",
    status: "playable",
    description: "Förvandla ett ord till ett annat. Ett steg i taget.",
  },
  {
    id: "ordflata",
    title: "Ordfläta Alpha",
    href: "/ordflata",
    status: "playable",
    description: "Lös en ordfläta med nycklar. Tidig testversion.",
  },
  {
    id: "dagens-ord",
    title: "Dagens Ord",
    href: "/dagens-ord",
    status: "playable",
    description: "Gissa dagens ord på fem bokstäver. Sex försök.",
  },
] as const satisfies readonly GameDefinition[];

export type GameId = (typeof games)[number]["id"];

export function getGameStatusLabel(status: GameStatus): string {
  if (status === "playable") {
    return "Spelbar";
  }

  return "Kommer snart";
}
