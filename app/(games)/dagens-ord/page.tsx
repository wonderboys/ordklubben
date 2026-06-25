import { DagensOrdGame } from '@/components/games/dagens-ord/dagens-ord-game';
import { GameShell } from '@/components/games/game-shell';
import { MobileInsetShell } from '@/components/layout/mobile-inset-shell';
import { BodyText } from '@/components/ui/typography';
import { loadDagensOrdCatalog } from '@/lib/games/dagens-ord/word-provider';

export const dynamic = 'force-dynamic';

export default async function DagensOrdPage() {
  const catalog = await loadDagensOrdCatalog();

  return (
    <MobileInsetShell className="max-md:min-h-[100dvh] max-md:pb-2">
      <div className="mx-auto flex w-full max-w-[40rem] max-md:min-h-[calc(100dvh-3.25rem)] max-md:flex-col">
        <GameShell
          eyebrow="Dagligt"
          title="Dagens Ord"
          description="Gissa dagens svenska ord på fem bokstäver. Sex försök."
          mobileDescription="Fem bokstäver. Sex försök."
          hideEyebrowOnMobile
          compactMobile
          className="max-md:flex-1 max-md:gap-3 max-md:py-2 md:items-center"
          headerClassName="w-full max-w-[32rem]"
        >
          {catalog ? (
            <DagensOrdGame catalog={catalog} />
          ) : (
            <BodyText>Ingen publicerad Dagens Ord-omgång finns för idag ännu.</BodyText>
          )}
        </GameShell>
      </div>
    </MobileInsetShell>
  );
}
