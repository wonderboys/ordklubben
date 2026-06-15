'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OrdstormStatBox } from '@/components/games/ordstorm/ordstorm-stat-box';
import { type OrdstormStats } from '@/lib/game/ordstorm';
import { MonoLabel } from '@/components/ui/typography';

type OrdstormStatsPreviewProps = {
  stats: OrdstormStats;
};

export function OrdstormStatsPreview({ stats }: OrdstormStatsPreviewProps) {
  return (
    <div className="space-y-2.5">
      <MonoLabel>Din statistik</MonoLabel>

      <div className="grid grid-cols-2 gap-2">
        <OrdstormStatBox label="bästa poäng" value={stats.bestScore} highlight />
        <OrdstormStatBox label="rundor" value={stats.roundsPlayed} />
        <OrdstormStatBox label="totalpoäng" value={stats.totalScore} />
        <OrdstormStatBox label="ord hittade" value={stats.totalWordsFound} />
      </div>

      <Link href="/ordstorm/stats" className="block">
        <Button variant="outline" className="w-full bg-print-bg">
          Visa all statistik
        </Button>
      </Link>
    </div>
  );
}
