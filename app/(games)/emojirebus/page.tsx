import { EmojirebusGame } from '@/components/games/emojirebus/emojirebus-game';
import { GameShell } from '@/components/games/game-shell';
import { MobileInsetShell } from '@/components/layout/mobile-inset-shell';
import { BodyText } from '@/components/ui/typography';
import { loadEmojirebusPuzzle } from '@/lib/content/emojirebus';
import { isDatabaseConfigured } from '@/lib/db/prisma';

export default async function EmojirebusPage() {
  if (!isDatabaseConfigured()) {
    return (
      <MobileInsetShell>
        <div className="mx-auto w-full max-w-[28rem]">
          <GameShell
            eyebrow="Test"
            title="Emojirebus"
            description="Den här testversionen kräver databasanslutning."
            mobileDescription="Kräver databasanslutning."
          >
            <BodyText>Sätt `DATABASE_URL` och starta Postgres innan du testar Emojirebus.</BodyText>
          </GameShell>
        </div>
      </MobileInsetShell>
    );
  }

  const puzzle = await loadEmojirebusPuzzle();

  return (
    <MobileInsetShell className="max-md:pb-2">
      <div className="mx-auto w-full max-w-[32rem]">
        <GameShell
          eyebrow="Test"
          title="Emojirebus"
          description="Gissa ordet utifrån emojis. Tidig testversion — ett rebus i taget."
          mobileDescription="Gissa ordet utifrån emojis."
          compactMobile
          hideEyebrowOnMobile
        >
          {puzzle ? (
            <EmojirebusGame puzzle={puzzle} />
          ) : (
            <BodyText className="text-center text-print-muted">
              Inga emojirebusar finns ännu.
            </BodyText>
          )}
        </GameShell>
      </div>
    </MobileInsetShell>
  );
}
