import { StegvisGame } from "@/components/games/stegvis/stegvis-game";
import { GameShell } from "@/components/games/game-shell";
import { MobileInsetShell } from "@/components/layout/mobile-inset-shell";

export default function StegvisPage() {
  return (
    <MobileInsetShell className="max-md:pb-1">
      <div className="mx-auto w-full max-w-[600px]">
        <GameShell
          eyebrow="Ordkedja"
          title="Stegvis"
          description="Förvandla ett ord till ett annat. Välj nästa steg."
          mobileDescription="Välj nästa ord och ändra en bokstav i taget."
        >
          <StegvisGame />
        </GameShell>
      </div>
    </MobileInsetShell>
  );
}
