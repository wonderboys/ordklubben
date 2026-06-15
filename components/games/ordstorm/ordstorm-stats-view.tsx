'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OrdstormStatBox } from '@/components/games/ordstorm/ordstorm-stat-box';
import { useOrdstormStats } from '@/hooks/use-ordstorm-stats';
import { BodyText, MonoLabel, PageTitle, SectionTitle } from '@/components/ui/typography';

export function OrdstormStatsView() {
  const stats = useOrdstormStats();

  return (
    <section className="flex flex-1 flex-col gap-4 py-2 sm:gap-6 sm:py-8">
      <div className="space-y-1 sm:space-y-2">
        <MonoLabel>Ordstorm</MonoLabel>
        <PageTitle>Statistik</PageTitle>
        <BodyText>Lokal statistik för Ordstorm. Sparas i webbläsaren på den här enheten.</BodyText>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <OrdstormStatBox label="bästa poäng" value={stats.bestScore} highlight />
        <OrdstormStatBox label="rundor" value={stats.roundsPlayed} />
        <OrdstormStatBox label="totalpoäng" value={stats.totalScore} />
        <OrdstormStatBox label="ord hittade" value={stats.totalWordsFound} />
      </div>

      <div className="space-y-3 rounded-none border border-print-ink/20 bg-print-surface p-4 shadow-none sm:p-6">
        <SectionTitle>Bästa ord</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {stats.bestWords.length ? (
            stats.bestWords.map((word) => (
              <span
                key={word}
                className="rounded-none border border-print-ink/20 bg-print-bg px-3 py-2 text-sm font-black uppercase text-print-ink"
              >
                {word.toLocaleUpperCase('sv-SE')}
              </span>
            ))
          ) : (
            <BodyText>Spela några rundor i Ordstorm för att fylla på listan.</BodyText>
          )}
        </div>
      </div>

      <Link href="/ordstorm" className="block md:hidden">
        <Button variant="outline" className="w-full bg-print-bg">
          Tillbaka till Ordstorm
        </Button>
      </Link>
    </section>
  );
}
