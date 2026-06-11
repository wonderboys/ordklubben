import Link from "next/link";
import { GameLibraryIcon } from "@/components/games/game-library-icon";
import { Badge } from "@/components/ui/badge";
import { BodyText, PageTitle } from "@/components/ui/typography";
import type { GameDefinition, GameId } from "@/lib/games/registry";
import { cn } from "@/lib/utils";

function badgeVariant(label: string) {
  if (label === "Beta" || label === "Kommer snart") {
    return "default" as const;
  }

  return "green" as const;
}

type GameLibraryTileProps = {
  game: GameDefinition;
  onNavigate?: () => void;
  showDescription?: boolean;
};

export function GameLibraryTile({
  game,
  onNavigate,
  showDescription = false,
}: GameLibraryTileProps) {
  const badges = [game.badgeLabel, game.secondaryBadgeLabel].filter(
    (label): label is string => Boolean(label),
  );
  const description = game.libraryDescription ?? game.description;

  return (
    <Link
      href={game.href}
      className="group block min-h-[88px]"
      onClick={onNavigate}
    >
      <div
        className={cn(
          "shell-card flex h-full flex-col gap-3 p-4 transition-transform duration-300",
          "sm:group-hover:-translate-y-0.5",
        )}
      >
        <div className="flex items-start gap-3">
          <GameLibraryIcon gameId={game.id as GameId} />
          <div className="min-w-0 flex-1 space-y-2">
            <PageTitle variant="card" className="text-base sm:text-lg">
              {game.title}
            </PageTitle>
            <div className="flex flex-wrap gap-1.5">
              {badges.map((label) => (
                <Badge key={label} variant={badgeVariant(label)}>
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        {showDescription && description ? (
          <BodyText variant="card" className="line-clamp-2 text-sm">
            {description}
          </BodyText>
        ) : null}
      </div>
    </Link>
  );
}
