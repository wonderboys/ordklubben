import { OrdflataGame } from '@/components/games/ordflata/ordflata-game';
import { GameShell } from '@/components/games/game-shell';
import { MobileInsetShell } from '@/components/layout/mobile-inset-shell';
import { BodyText } from '@/components/ui/typography';
import { loadOrdflataPuzzle } from '@/lib/games/ordflata/content-provider';

export const dynamic = 'force-dynamic';

export default async function OrdflataPage() {
  const puzzle = await loadOrdflataPuzzle();

  if (!puzzle) {
    return (
      <MobileInsetShell>
        <div className="mx-auto w-full max-w-[42rem]">
          <GameShell
            eyebrow="Alpha"
            title="Ordfläta"
            description="Dagens ordfläta publiceras via GameEdition i databasen."
            mobileDescription="Ingen publicerad daglig fläta för idag."
          >
            <BodyText>
              Ingen publicerad Ordfläta-omgång finns för dagens datum. Kör seed:ordflata i dev om du
              behöver testdata.
            </BodyText>
          </GameShell>
        </div>
      </MobileInsetShell>
    );
  }

  return (
    <MobileInsetShell className="max-md:pb-2">
      <div className="mx-auto w-full max-w-[44rem] md:max-w-6xl">
        <GameShell
          eyebrow="Alpha"
          title={puzzle.title}
          description="Lös dagens ordfläta med hjälp av nycklarna."
          mobileDescription="Lös dagens fläta med nycklarna."
          compactMobile
          hideEyebrowOnMobile
          headerClassName="md:max-w-none"
        >
          <OrdflataGame puzzle={puzzle} />
        </GameShell>
      </div>
    </MobileInsetShell>
  );
}
