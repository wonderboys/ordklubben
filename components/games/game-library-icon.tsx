import { CalendarDays, Dices, Grid3x3, ImageIcon, Route, Smile, Ticket, Zap, type LucideIcon } from "lucide-react";
import type { GameId } from "@/lib/games/registry";
import { cn } from "@/lib/utils";

const GAME_ICONS: Record<GameId, LucideIcon> = {
  "dagens-ord": CalendarDays,
  ordstorm: Zap,
  stegvis: Route,
  emojirebus: Smile,
  kastet: Dices,
  skrapet: Ticket,
  bildjakten: ImageIcon,
  ordflata: Grid3x3,
};

type GameLibraryIconProps = {
  gameId: GameId;
  className?: string;
};

export function GameLibraryIcon({ gameId, className }: GameLibraryIconProps) {
  const Icon = GAME_ICONS[gameId];

  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center border border-print-ink bg-print-surface sm:size-12",
        className,
      )}
      aria-hidden="true"
    >
      <Icon className="size-5 text-print-ink sm:size-[22px]" strokeWidth={2} />
    </div>
  );
}
