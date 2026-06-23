import { SkrapetGame } from '@/components/games/skrapet/skrapet-game';
import { GameShell } from '@/components/games/game-shell';
import { MobileInsetShell } from '@/components/layout/mobile-inset-shell';
import { BodyText } from '@/components/ui/typography';
import { loadSkrapetPuzzles } from '@/lib/games/skrapet/content-provider';

export const dynamic = 'force-dynamic';

export default async function SkrapetPage() {
  const puzzles = await loadSkrapetPuzzles();

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
          {puzzles.length > 0 ? (
            <SkrapetGame puzzles={puzzles} />
          ) : (
            <BodyText>Inga Skrapet-pussel finns publicerade i databasen ännu.</BodyText>
          )}
        </GameShell>
      </div>
    </MobileInsetShell>
  );
}
