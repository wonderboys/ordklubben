import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { GameCard } from "@/components/games/game-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="flex flex-1 flex-col gap-8 py-6 sm:gap-10 sm:py-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.8fr)]">
        <Card className="overflow-hidden">
          <CardContent className="space-y-8 p-6 sm:p-8">
            <div className="space-y-4">
              <Badge>Minimalistisk svensk spelplattform</Badge>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.07em] sm:text-6xl lg:text-7xl">
                  Ordspel som känns snabba, lugna och vassa.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                  Ordklubben är byggd för flera framtida spel, men startar med
                  ett fokuserat första läge inspirerat av Anagram Race. Mobil
                  först, lätt att expandera och med polish i varje interaktion.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/ordstorm">
                <Button variant="accent" size="lg" className="w-full sm:w-auto">
                  Spela Ordstorm
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Link href="/stats">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Se statistik
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-ink text-canvas">
          <CardContent className="flex h-full flex-col gap-5 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-highlight" />
              <p className="text-sm uppercase tracking-[0.18em] text-canvas/70">
                Designriktning
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-3xl font-semibold tracking-[-0.05em]">
                NYT Games möter svensk indie.
              </p>
              <p className="text-sm leading-7 text-canvas/75">
                Mjuk typografi, lågmäld färgpalett, tydliga systemkomponenter och
                animationer som stödjer spelkänslan istället för att stjäla fokus.
              </p>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-3xl bg-white/8 p-4">
                <p className="text-canvas/65">Första fokus</p>
                <p className="mt-1 font-semibold">Ordstorm</p>
              </div>
              <div className="rounded-3xl bg-white/8 p-4">
                <p className="text-canvas/65">State</p>
                <p className="mt-1 font-semibold">Lokal, enkel</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="section-title">Spel</p>
            <p className="fine-text">
              Första versionen innehåller en spelbar vertikal slice och tydliga
              expansionspunkter för nästa ordspel.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.href} {...game} />
          ))}
        </div>
      </section>
    </div>
  );
}
