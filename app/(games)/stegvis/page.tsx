import { StegvisGame } from "@/components/games/stegvis/stegvis-game";
import { GameShell } from "@/components/games/game-shell";
import { MobileInsetShell } from "@/components/layout/mobile-inset-shell";
import { loadStegvisPlaySession } from "@/lib/content/stegvis/load-play-session";

export const dynamic = "force-dynamic";

export default async function StegvisPage() {
  const session = await loadStegvisPlaySession();

  return (
    <MobileInsetShell className="max-md:pb-1">
      <div className="mx-auto w-full max-w-[600px]">
        <GameShell
          eyebrow="Ordkedja"
          title="Stegvis"
          description="Förvandla ett ord till ett annat genom att ändra en bokstav i taget."
          mobileDescription="Lös ledtrådarna och ta dig stegvis från startordet till målordet."
        >
          <StegvisGame session={session} />
        </GameShell>
      </div>
    </MobileInsetShell>
  );
}
