import { ComingSoonGame } from "@/components/games/coming-soon-game";
import { MobileInsetShell } from "@/components/layout/mobile-inset-shell";

export default function LadderPage() {
  return (
    <MobileInsetShell>
      <ComingSoonGame
        title="Ladder"
        description="Byt en bokstav i taget och hitta den kortaste vägen mellan två ord."
      />
    </MobileInsetShell>
  );
}
