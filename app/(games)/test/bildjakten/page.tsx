import { BildjaktenGame } from "@/components/games/bildjakten/bildjakten-game";
import { GameShell } from "@/components/games/game-shell";
import { MobileInsetShell } from "@/components/layout/mobile-inset-shell";
import { getBildjaktPuzzles } from "@/lib/game/bildjakten/provider";

export default async function BildjaktenPage() {
  const puzzles = await getBildjaktPuzzles();

  return (
    <MobileInsetShell className="max-md:pb-2">
      <div className="mx-auto w-full max-w-[32rem]">
        <GameShell
          eyebrow="Test"
          title="Bildjakten"
          description="Gissa ordet utifrån bilden. Tidig test av en ny spelidé."
          mobileDescription="Gissa ordet utifrån bilden."
          compactMobile
          hideEyebrowOnMobile
        >
          <BildjaktenGame puzzles={puzzles} />
        </GameShell>
      </div>
    </MobileInsetShell>
  );
}
