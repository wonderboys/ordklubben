import { GameShell } from "@/components/games/game-shell";
import { OrdstormGame } from "@/components/games/ordstorm/ordstorm-game";

export default function OrdstormPage() {
  return (
    <GameShell
      eyebrow="Första spelet"
      title="Ordstorm"
      description="Sex bokstäver. Sextio sekunder. Så många svenska ord som möjligt innan stormen lugnar sig."
    >
      <OrdstormGame />
    </GameShell>
  );
}
