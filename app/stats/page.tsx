"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useOrdstormStats } from "@/hooks/use-ordstorm-stats";

export default function StatsPage() {
  const stats = useOrdstormStats();

  return (
    <section className="flex flex-1 flex-col gap-6 py-6 sm:py-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-[-0.06em]">Stats</h1>
        <p className="max-w-2xl text-muted">
          Enkel lokal statistik för första versionen. Här kan dagliga streaks,
          per-spel-historik och profilnivåer kopplas in senare.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Rundor spelade" value={stats.roundsPlayed} />
        <MetricCard label="Bästa poäng" value={stats.bestScore} />
        <MetricCard label="Totalpoäng" value={stats.totalScore} />
        <MetricCard label="Totala ord" value={stats.totalWordsFound} />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <p className="section-title">Bästa ord</p>
          <div className="flex flex-wrap gap-2">
            {stats.bestWords.length ? (
              stats.bestWords.map((word) => (
                <span
                  key={word}
                  className="rounded-full bg-accent-soft px-3 py-2 text-sm font-medium text-accent-strong"
                >
                  {word}
                </span>
              ))
            ) : (
              <p className="fine-text">Spela några rundor i Ordstorm för att fylla på listan.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted">{label}</p>
        <p className="text-3xl font-semibold tracking-[-0.05em]">{value}</p>
      </CardContent>
    </Card>
  );
}
