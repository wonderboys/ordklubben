import { GameShell } from "@/components/games/game-shell";
import { OrdstormGame } from "@/components/games/ordstorm/ordstorm-game";
import { MobileInsetShell } from "@/components/layout/mobile-inset-shell";

export default function OrdstormPage() {
  return (
    <MobileInsetShell className="max-md:pb-1">
      {/* Layout Pass 1B: narrow desktop game card experiment (600px) */}
      <div className="mx-auto w-full max-w-[600px]">
        <GameShell
          eyebrow="Första spelet"
          title="Ordstorm"
          description="Sex bokstäver. Sextio sekunder. Så många svenska ord som möjligt innan stormen lugnar sig."
          mobileDescription="Sex bokstäver. Sextio sekunder. Hitta så många ord som möjligt."
        >
          <OrdstormGame />
        </GameShell>
      </div>
    </MobileInsetShell>
  );
}
