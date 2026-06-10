import Link from "next/link";
import type { ContentStatus } from "@prisma/client";
import {
  AdminActionGroup,
  AdminFilterToolbar,
  AdminLinkButton,
  AdminPage,
  AdminPanel,
  DatabaseNotice,
  FeedbackMessage,
  SelectInput,
  StatusBadge,
  SubmitButton,
  Table,
  TextInput,
} from "@/components/admin/admin-ui";
import { CONTENT_STATUSES, STATUS_LABELS } from "@/lib/content/constants";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

type SearchParams = Promise<{
  q?: string;
  status?: ContentStatus | "";
  themeId?: string;
  error?: string;
  success?: string;
}>;

export default async function AdminWordsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const themeId = params.themeId?.trim() ?? "";
  const status =
    params.status && CONTENT_STATUSES.includes(params.status)
      ? params.status
      : undefined;

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Ord">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();
  const [themes, words] = await Promise.all([
    prisma.theme.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.word.findMany({
      where: {
        AND: [
          status ? { status } : {},
          themeId ? { themes: { some: { themeId } } } : {},
          query
            ? {
                OR: [
                  { answer: { contains: query, mode: "insensitive" } },
                  { normalizedAnswer: { contains: query, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      select: {
        id: true,
        answer: true,
        status: true,
        updatedAt: true,
        _count: {
          select: {
            hints: true,
            hintCandidates: true,
            themes: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { answer: "asc" }],
      take: 100,
    }),
  ]);

  return (
    <AdminPage
      title="Ord"
      description="Sök, granska och redigera ord i ordbanken."
      actions={
        <AdminActionGroup>
          <AdminLinkButton href="/admin/import" variant="secondary">
            Importera
          </AdminLinkButton>
          <AdminLinkButton href="/admin/words/new" variant="primary">
            Nytt ord
          </AdminLinkButton>
        </AdminActionGroup>
      }
    >
      <FeedbackMessage error={params.error} success={params.success} />

      <AdminPanel title="Ordlista">
        <form method="get">
          <AdminFilterToolbar>
            <TextInput
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Sök ord"
              className="min-w-48 flex-1"
            />
            <SelectInput name="status" defaultValue={status ?? ""} className="min-w-40">
              <option value="">Alla statusar</option>
              {CONTENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </SelectInput>
            <SelectInput name="themeId" defaultValue={themeId} className="min-w-40">
              <option value="">Alla teman</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </SelectInput>
            <SubmitButton variant="secondary">Filtrera</SubmitButton>
          </AdminFilterToolbar>
        </form>

        <Table headers={["Ord", "Status", "Nycklar", "Förslag", "Teman", "Uppdaterad"]}>
          {words.map((word) => (
            <tr key={word.id} className="border-b border-print-ink/10 align-top">
              <td className="font-medium text-print-ink">
                <Link href={`/admin/words/${word.id}`} className="underline-offset-2 hover:underline">
                  {word.answer}
                </Link>
              </td>
              <td>
                <StatusBadge status={word.status} />
              </td>
              <td>{word._count.hints}</td>
              <td>{word._count.hintCandidates}</td>
              <td>{word._count.themes}</td>
              <td className="text-print-muted">
                {word.updatedAt.toLocaleDateString("sv-SE")}
              </td>
            </tr>
          ))}
        </Table>
        {words.length === 0 ? (
          <p className="mt-3 text-sm text-print-muted">Inga ord matchade filtret.</p>
        ) : null}
      </AdminPanel>
    </AdminPage>
  );
}
