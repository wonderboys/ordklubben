import { BildjaktenGame } from '@/components/games/bildjakten/bildjakten-game';
import { GameShell } from '@/components/games/game-shell';
import { MobileInsetShell } from '@/components/layout/mobile-inset-shell';
import { BodyText } from '@/components/ui/typography';
import { loadBildjaktenPuzzles } from '@/lib/games/bildjakten/content-provider';

export const dynamic = 'force-dynamic';

export default async function BildjaktenPage() {
  const puzzles = await loadBildjaktenPuzzles();

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
          {puzzles.length > 0 ? (
            <BildjaktenGame puzzles={puzzles} />
          ) : (
            <BodyText>Inga Bildjakten-bilder finns publicerade i databasen ännu.</BodyText>
          )}
        </GameShell>
      </div>
    </MobileInsetShell>
  );
}
