import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GameCard } from "@/components/games/game-card";
import { MobileInsetShell } from "@/components/layout/mobile-inset-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BodyText, PageTitle, SectionTitle } from "@/components/ui/typography";

const games = [
  {
    href: "/ordstorm",
    title: "Ordstorm",
    description: "Snabb anagramjakt med sex bokstäver och sextio sekunder.",
    status: "Spelbar",
  },
  {
    href: "/ladder",
    title: "Ladder",
    description: "Ordtransformering steg för steg. Planerad för nästa iteration.",
    status: "Prototype",
  },
  {
    href: "/connections",
    title: "Connections",
    description: "Tematiska grupper med svensk tonalitet och lugn precision.",
    status: "Concept",
  },
];

export default function Home() {
  return (
    <MobileInsetShell>
      <div className="flex flex-1 flex-col gap-6 py-2 sm:gap-10 sm:py-8">
        <section className="w-full space-y-6 sm:space-y-8">
          <div className="space-y-3">
            <Badge>Minimalistisk svensk spelplattform</Badge>
            <div className="space-y-2">
              <PageTitle variant="hero">
                Ordspel som känns snabba, lugna och vassa.
              </PageTitle>
              <BodyText className="sm:text-lg">
                Ordklubben är byggd för flera framtida spel, men startar med
                ett fokuserat första läge inspirerat av Anagram Race. Mobil
                först, lätt att expandera och med polish i varje interaktion.
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
                className="w-full bg-print-bg hover:bg-print-bg sm:w-auto"
              >
                Se statistik
              </Button>
            </Link>
          </div>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <SectionTitle>Spel</SectionTitle>
              <BodyText variant="card" className="max-w-2xl">
                Första versionen innehåller en spelbar vertikal slice och tydliga
                expansionspunkter för nästa ordspel.
              </BodyText>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3 sm:gap-4">
            {games.map((game) => (
              <GameCard key={game.href} {...game} />
            ))}
          </div>
        </section>
      </div>
    </MobileInsetShell>
  );
}
