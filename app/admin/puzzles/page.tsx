import Link from "next/link";
import {
  AdminLinkButton,
  AdminPage,
  AdminPanel,
  DatabaseNotice,
  FeedbackMessage,
  Table,
} from "@/components/admin/admin-ui";
import {
  PUZZLE_STATUS_LABELS,
  PUZZLE_TYPE_LABELS,
} from "@/lib/content/constants";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

export default async function PuzzlesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Pussel">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();
  const puzzles = await prisma.puzzle.findMany({
    include: {
      _count: {
        select: { entries: true },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
  });

  return (
    <AdminPage
      title="Pussel"
      description="Manuella ordflätor och framtida pusseltyper."
      actions={
        <AdminLinkButton href="/admin/puzzles/new" variant="primary">
          Nytt pussel
        </AdminLinkButton>
      }
    >
      <FeedbackMessage error={params.error} success={params.success} />

      <AdminPanel title="Pussellista">
        <Table
          headers={[
            "Titel",
            "Typ",
            "Status",
            "Storlek",
            "Antal ord",
            "Publiceringsdatum",
            "Uppdaterad",
          ]}
        >
          {puzzles.map((puzzle) => (
            <tr key={puzzle.id} className="border-b border-print-ink/10 align-top">
              <td className="font-medium text-print-ink">
                <Link
                  href={`/admin/puzzles/${puzzle.id}`}
                  className="underline-offset-2 hover:underline"
                >
                  {puzzle.title}
                </Link>
              </td>
              <td>{PUZZLE_TYPE_LABELS[puzzle.type]}</td>
              <td>{PUZZLE_STATUS_LABELS[puzzle.status]}</td>
              <td>
                {puzzle.width}×{puzzle.height}
              </td>
              <td>{puzzle._count.entries}</td>
              <td className="text-print-muted">
                {puzzle.publishDate
                  ? puzzle.publishDate.toLocaleDateString("sv-SE")
                  : "—"}
              </td>
              <td className="text-print-muted">
                {puzzle.updatedAt.toLocaleDateString("sv-SE")}
              </td>
            </tr>
          ))}
        </Table>
        {puzzles.length === 0 ? (
          <p className="mt-3 text-sm text-print-muted">Inga pussel ännu.</p>
        ) : null}
      </AdminPanel>
    </AdminPage>
  );
}
