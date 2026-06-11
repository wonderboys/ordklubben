import { Card, CardContent } from "@/components/ui/card";
import { MonoLabel } from "@/components/ui/typography";
import type { StegvisGeneratorDebugInfo } from "@/lib/content/stegvis/load-play-session";

type StegvisGeneratorDebugProps = {
  debug: StegvisGeneratorDebugInfo;
};

export function StegvisGeneratorDebug({ debug }: StegvisGeneratorDebugProps) {
  return (
    <Card className="border-dashed border-print-ink/25 bg-print-bg/60">
      <CardContent className="space-y-3 py-4">
        <MonoLabel muted className="text-[11px] uppercase tracking-wide">
          Generator
        </MonoLabel>

        <div className="space-y-1 text-sm text-print-ink">
          <p>
            Start: <span className="font-black uppercase">{debug.start}</span>
          </p>
          <p>
            Mål: <span className="font-black uppercase">{debug.target}</span>
          </p>
        </div>

        <div className="space-y-1 print-mono text-xs text-print-muted">
          <p>Steg: {debug.steps}</p>
          <p>Poäng: {debug.score}</p>
          <p>Saknade nycklar: {debug.missingClues}</p>
        </div>

        <div className="space-y-1">
          <MonoLabel muted className="text-[10px] uppercase tracking-wide">
            Kedja
          </MonoLabel>
          <p className="print-mono text-xs text-print-muted">
            {debug.chain.join(" → ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
