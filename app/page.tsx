import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { GameCard } from '@/components/games/game-card';
import { OrdflataBetaCard } from '@/components/games/ordflata-beta-card';
import { MobileInsetShell } from '@/components/layout/mobile-inset-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BodyText, PageTitle, SectionTitle } from '@/components/ui/typography';
import { homeGames, ordflataBetaGame } from '@/lib/games/registry';

export default function Home() {
  return (
    <MobileInsetShell>
      <div className="flex flex-1 flex-col gap-6 py-2 sm:gap-10 sm:py-8">
        <div className="md:grid md:grid-cols-3">
          <section className="space-y-6 sm:space-y-8 md:col-span-2">
            <div className="space-y-4">
              <Badge variant="eyebrow">Svenska ordspel</Badge>
              <div className="space-y-2">
                <PageTitle variant="hero" className="max-w-none">
                  För dig som gillar språk, spel, logik och mönster
                </PageTitle>
                <BodyText className="max-w-none sm:text-lg">
                  Dagliga ordspel, språkutmaningar och nya sätt att utforska svenska. Ordklubben
                  växer steg för steg — fler spel, fler format och fler sätt att tänka med ord.
                </BodyText>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Link href="/dagens-ord" className="block">
                <Button variant="accent" size="lg" className="w-full sm:w-auto">
                  Spela Dagens Ord
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                disabled
                aria-disabled
                className="w-full bg-print-bg sm:w-auto"
              >
                Se statistik
              </Button>
            </div>
          </section>
        </div>

        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <SectionTitle>Spel</SectionTitle>
              <BodyText variant="card" className="max-w-2xl">
                Varje spel utforskar språk på sitt eget sätt.
              </BodyText>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3 sm:gap-4">
            {homeGames.map((game) => (
              <GameCard key={game.id} {...game} />
            ))}
          </div>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <div className="space-y-1">
            <SectionTitle>På väg in i klubben</SectionTitle>
            <BodyText variant="card" className="max-w-2xl">
              Här testar vi nya idéer innan de blir en del av Ordklubben. Spelbara redan nu — men
              fortfarande under utveckling.
            </BodyText>
          </div>
          <OrdflataBetaCard
            href={ordflataBetaGame.href}
            title={ordflataBetaGame.title}
            description={ordflataBetaGame.description}
            primaryBadge={ordflataBetaGame.badgeLabel}
            secondaryBadge={ordflataBetaGame.secondaryBadgeLabel ?? 'Dagligt'}
            ctaLabel="Testa Ordfläta"
          />
        </section>
      </div>
    </MobileInsetShell>
  );
}
