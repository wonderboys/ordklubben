import { Card, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <section className="flex flex-1 flex-col gap-6 py-6 sm:py-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-[-0.06em]">Profil</h1>
        <p className="max-w-2xl text-muted">
          Profilen är medvetet mockad i första versionen. Tanken är att framtida
          spel ska kunna läsa samma presentationslager utan backendberoenden.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardContent className="grid gap-4 sm:grid-cols-[auto_1fr]">
          <div className="flex size-18 items-center justify-center rounded-[1.5rem] bg-accent text-2xl font-semibold text-white">
            O
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-semibold tracking-[-0.04em]">Gästspelare</p>
            <p className="fine-text">
              Senare kan den här ytan ta emot favoritspel, dagliga streaks,
              achievements och en lätt profilidentitet utan att ändra befintliga
              spellayouter.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
