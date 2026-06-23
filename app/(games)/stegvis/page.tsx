import { StegvisGame } from '@/components/games/stegvis/stegvis-game';
import { GameShell } from '@/components/games/game-shell';
import { MobileInsetShell } from '@/components/layout/mobile-inset-shell';
import { BodyText } from '@/components/ui/typography';
import { loadStegvisPlaySessionFromDb } from '@/lib/games/stegvis/content-provider';

export const dynamic = 'force-dynamic';

export default async function StegvisPage() {
  const session = await loadStegvisPlaySessionFromDb();

  return (
    <MobileInsetShell className="max-md:pb-1">
      <div className="mx-auto w-full max-w-[600px]">
        <GameShell
          eyebrow="Ordkedja"
          title="Stegvis"
          description="Förvandla ett ord till ett annat genom att ändra en bokstav i taget."
          mobileDescription="Lös ledtrådarna och ta dig stegvis från startordet till målordet."
        >
          {session ? (
            <StegvisGame session={session} />
          ) : (
            <BodyText>Ingen spelbar Stegvis-kedja finns publicerad i databasen ännu.</BodyText>
          )}
        </GameShell>
      </div>
    </MobileInsetShell>
  );
}
