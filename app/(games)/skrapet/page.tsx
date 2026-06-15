import { SkrapetGame } from "@/components/games/skrapet/skrapet-game";
import { GameShell } from "@/components/games/game-shell";
import { MobileInsetShell } from "@/components/layout/mobile-inset-shell";

export default function SkrapetPage() {
  return (
    <MobileInsetShell className="max-md:pb-2">
      <div className="mx-auto w-full max-w-[32rem]">
        <GameShell
          eyebrow="Test"
          title="Skrapet"
          description="Skrapa fram ledtrådar och gissa ordet innan du avslöjar för mycket."
          mobileDescription="Skrapa ledtrådar och gissa ordet."
          compactMobile
          hideEyebrowOnMobile
        >
          <SkrapetGame />
        </GameShell>
      </div>
    </MobileInsetShell>
  );
}
