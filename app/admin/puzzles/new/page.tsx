import {
  AdminLinkButton,
  AdminPage,
  AdminPanel,
  DatabaseNotice,
  FeedbackMessage,
} from "@/components/admin/admin-ui";
import { PuzzleCreateView } from "@/components/admin/puzzle/puzzle-create-view";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

type SearchParams = Promise<{
  error?: string;
  success?: string;
  mode?: string;
}>;

export default async function NewPuzzlePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Nytt pussel">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();
  const themes = await prisma.theme.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          words: true,
        },
      },
    },
    orderBy: [{ name: "asc" }],
  });

  const defaultMode = params.mode === "manual" ? "manual" : "generated";

  return (
    <AdminPage
      title="Nytt pussel"
      description="Skapa en ordfläta manuellt eller låt systemet generera ett utkast."
      actions={
        <AdminLinkButton href="/admin/puzzles" variant="secondary">
          Tillbaka
        </AdminLinkButton>
      }
    >
      <FeedbackMessage error={params.error} success={params.success} />

      <AdminPanel title="Skapa ordfläta">
        <PuzzleCreateView
          defaultMode={defaultMode}
          themes={themes.map((theme) => ({
            id: theme.id,
            name: theme.name,
            slug: theme.slug,
            wordCount: theme._count.words,
          }))}
        />
      </AdminPanel>
    </AdminPage>
  );
}
