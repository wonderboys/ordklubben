import { GameShell } from '@/components/games/game-shell';
import { Card, CardContent } from '@/components/ui/card';
import { BodyText, SectionTitle } from '@/components/ui/typography';

type ComingSoonGameProps = {
  title: string;
  description: string;
};

export function ComingSoonGame({ title, description }: ComingSoonGameProps) {
  return (
    <GameShell eyebrow="Kommer snart" title={title} description={description}>
      <Card className="max-w-3xl">
        <CardContent className="space-y-4">
          <SectionTitle>Plattformen är redo för fler spel</SectionTitle>
          <BodyText className="max-w-2xl">
            Den här vyn är avsiktligt enkel. Nästa spel kan återanvända samma layout,
            HUD-komponenter, statistikmönster och mobilnav utan att vi behöver förändra
            grundarkitekturen.
          </BodyText>
        </CardContent>
      </Card>
    </GameShell>
  );
}
