import { notFound } from "next/navigation";
import { OrdflataGame } from "@/components/games/ordflata/ordflata-game";
import { GameShell } from "@/components/games/game-shell";
import { MobileInsetShell } from "@/components/layout/mobile-inset-shell";
import { BodyText } from "@/components/ui/typography";
import { loadOrdflataAlphaPuzzle } from "@/lib/content/ordflata-alpha";
import { isDatabaseConfigured } from "@/lib/db/prisma";

export default async function OrdflataPage() {
  if (!isDatabaseConfigured()) {
    return (
      <MobileInsetShell>
        <div className="mx-auto w-full max-w-[42rem]">
          <GameShell
            eyebrow="Alpha"
            title="Ordfläta"
            description="Den här testversionen kräver databasanslutning."
            mobileDescription="Kräver databasanslutning."
          >
            <BodyText>
              Sätt `DATABASE_URL` och starta Postgres innan du testar Ordfläta Alpha.
            </BodyText>
          </GameShell>
        </div>
      </MobileInsetShell>
    );
  }

  const puzzle = await loadOrdflataAlphaPuzzle();

  if (!puzzle) {
    notFound();
  }

  return (
    <MobileInsetShell className="max-md:pb-2">
      <div className="mx-auto w-full max-w-[44rem] md:max-w-6xl">
        <GameShell
          eyebrow="Alpha"
          title={puzzle.title}
          description="Lös ordflätan med hjälp av nycklarna. Tidig testversion — senaste publicerade flätan."
          mobileDescription="Lös den senaste flätan med nycklarna."
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
