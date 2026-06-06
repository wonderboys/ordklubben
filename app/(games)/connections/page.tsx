import { ComingSoonGame } from "@/components/games/coming-soon-game";
import { MobileInsetShell } from "@/components/layout/mobile-inset-shell";

export default function ConnectionsPage() {
  return (
    <MobileInsetShell>
      <ComingSoonGame
        title="Connections"
        description="Gruppera ord efter dolda mönster och hitta teman med svensk fingertoppskänsla."
      />
    </MobileInsetShell>
  );
}
