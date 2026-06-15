import { MobileInsetShell } from '@/components/layout/mobile-inset-shell';
import { Card, CardContent } from '@/components/ui/card';
import { BodyText, PageTitle } from '@/components/ui/typography';

export default function ProfilePage() {
  return (
    <MobileInsetShell>
      <section className="flex flex-1 flex-col gap-4 py-2 sm:gap-6 sm:py-8">
        <div className="space-y-1 sm:space-y-2">
          <PageTitle>Profil</PageTitle>
          <BodyText>
            Profilen är medvetet mockad i första versionen. Tanken är att framtida spel ska kunna
            läsa samma presentationslager utan backendberoenden.
          </BodyText>
        </div>

        <Card className="max-w-3xl">
          <CardContent className="grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-4">
            <div className="flex size-16 items-center justify-center rounded-none border border-print-ink bg-print-green text-xl font-black uppercase text-white sm:size-18 sm:text-2xl">
              O
            </div>
            <div className="space-y-1.5">
              <PageTitle variant="compact">Gästspelare</PageTitle>
              <BodyText variant="card">
                Senare kan den här ytan ta emot favoritspel, dagliga streaks, achievements och en
                lätt profilidentitet utan att ändra befintliga spellayouter.
              </BodyText>
            </div>
          </CardContent>
        </Card>
      </section>
    </MobileInsetShell>
  );
}
