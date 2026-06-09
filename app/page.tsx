import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GameCard } from "@/components/games/game-card";
import { MobileInsetShell } from "@/components/layout/mobile-inset-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BodyText, PageTitle, SectionTitle } from "@/components/ui/typography";
import { games } from "@/lib/games/registry";

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
                  Ordspel för dig som gillar språk, logik och mönster.
                </PageTitle>
                <BodyText className="max-w-none sm:text-lg">
                  Ordklubben samlar svenska ordspel med olika tempo och olika
                  utmaningar. Vissa handlar om snabbhet. Andra om logik, språk
                  och mönster.
                </BodyText>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Link href="/ordstorm" className="block">
                <Button variant="accent" size="lg" className="w-full sm:w-auto">
                  Spela Ordstorm
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Link href="/ordstorm/stats" className="block">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full bg-print-bg sm:w-auto"
                >
                  Se statistik
                </Button>
              </Link>
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
            {games.map((game) => (
              <GameCard key={game.id} {...game} />
            ))}
          </div>
        </section>
      </div>
    </MobileInsetShell>
  );
}
