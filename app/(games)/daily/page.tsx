import { ComingSoonGame } from '@/components/games/coming-soon-game';
import { MobileInsetShell } from '@/components/layout/mobile-inset-shell';

export default function DailyPage() {
  return (
    <MobileInsetShell>
      <ComingSoonGame
        title="Daily"
        description="Dagliga utmaningar kan senare återanvända samma spelmotor, statistik och lätta progressionslager."
      />
    </MobileInsetShell>
  );
}
