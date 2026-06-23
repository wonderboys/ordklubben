import { GameShell } from '@/components/games/game-shell';
import { OrdstormGame } from '@/components/games/ordstorm/ordstorm-game';
import { MobileInsetShell } from '@/components/layout/mobile-inset-shell';
import { BodyText } from '@/components/ui/typography';
import { loadOrdstormWordCatalog } from '@/lib/games/ordstorm/word-provider';

export const dynamic = 'force-dynamic';

export default async function OrdstormPage() {
  const catalog = await loadOrdstormWordCatalog();

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
          {catalog ? (
            <OrdstormGame catalog={catalog} />
          ) : (
            <BodyText>Inga Ordstorm-ord finns publicerade i databasen ännu.</BodyText>
          )}
        </GameShell>
      </div>
    </MobileInsetShell>
  );
}
