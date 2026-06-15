import { KastetGame } from "@/components/games/kastet/kastet-game";
import { GameShell } from "@/components/games/game-shell";
import { MobileInsetShell } from "@/components/layout/mobile-inset-shell";

export default function KastetPage() {
  return (
    <MobileInsetShell className="max-md:pb-2">
      <div className="mx-auto w-full max-w-[32rem]">
        <GameShell
          eyebrow="Test"
          title="Kastet"
          description="Skaka bokstavstärningarna och hitta längsta ord som börjar med det du får."
          mobileDescription="Kasta tärningar och hitta längsta ord."
          compactMobile
          hideEyebrowOnMobile
        >
          <KastetGame />
        </GameShell>
      </div>
    </MobileInsetShell>
  );
}
