import Link from "next/link";
import { notFound } from "next/navigation";
import type { ContentStatus } from "@prisma/client";
import {
  AdminFilterToolbar,
  AdminLinkButton,
  AdminMetaGrid,
  AdminPage,
  AdminPanel,
  DatabaseNotice,
  FeedbackMessage,
  SelectInput,
  StatusBadge,
  SubmitButton,
  Table,
} from "@/components/admin/admin-ui";
import { CONTENT_STATUSES, STATUS_LABELS } from "@/lib/content/constants";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

type SearchParams = Promise<{
  status?: ContentStatus | "";
  sort?: "answer" | "status" | "hints";
  error?: string;
  success?: string;
}>;

type Params = Promise<{
  slug: string;
}>;

type ThemeWordEntry = {
  id: string;
  answer: string;
  status: ContentStatus;
  difficulty: number | null;
  updatedAt: Date;
  hintCount: number;
};

const SORT_OPTIONS = [
  { value: "answer", label: "Ord" },
  { value: "status", label: "Status" },
  { value: "hints", label: "Antal nycklar" },
] as const;

function sortThemeWords(
  words: ThemeWordEntry[],
  sort: "answer" | "status" | "hints",
): ThemeWordEntry[] {
  const sorted = [...words];

  switch (sort) {
    case "status":
      return sorted.sort((a, b) => {
        const statusOrder = a.status.localeCompare(b.status);
        return statusOrder !== 0 ? statusOrder : a.answer.localeCompare(b.answer, "sv");
      });
    case "hints":
      return sorted.sort((a, b) => {
        const hintOrder = b.hintCount - a.hintCount;
        return hintOrder !== 0 ? hintOrder : a.answer.localeCompare(b.answer, "sv");
      });
    case "answer":
    default:
      return sorted.sort((a, b) => a.answer.localeCompare(b.answer, "sv"));
  }
}

export default async function ThemeDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const status =
    query.status && CONTENT_STATUSES.includes(query.status)
      ? query.status
      : undefined;
  const sort =
    query.sort && SORT_OPTIONS.some((option) => option.value === query.sort)
      ? query.sort
      : "answer";

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Tema">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();
  const theme = await prisma.theme.findUnique({
    where: { slug },
    include: {
      words: {
        include: {
          word: {
            select: {
              id: true,
              answer: true,
              status: true,
              difficulty: true,
              updatedAt: true,
              _count: {
                select: {
                  hints: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!theme) {
    notFound();
  }

  const allWords: ThemeWordEntry[] = theme.words.map(({ word }) => ({
    id: word.id,
    answer: word.answer,
    status: word.status,
    difficulty: word.difficulty,
    updatedAt: word.updatedAt,
    hintCount: word._count.hints,
  }));

  const approvedWordCount = allWords.filter((word) => word.status === "APPROVED").length;
  const totalHintCount = allWords.reduce((sum, word) => sum + word.hintCount, 0);
  const wordsWithoutHints = allWords.filter((word) => word.hintCount === 0).length;

  const filteredWords = sortThemeWords(
    status ? allWords.filter((word) => word.status === status) : allWords,
    sort,
  );

  return (
    <AdminPage
      title={theme.name}
      description={`${allWords.length} ord · ${approvedWordCount} godkända · ${totalHintCount} nycklar`}
      actions={
        <AdminLinkButton href="/admin/themes" variant="secondary">
          Tillbaka
        </AdminLinkButton>
      }
    >
      <FeedbackMessage error={query.error} success={query.success} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <AdminPanel title="Ord i temat">
          <form method="get">
            <AdminFilterToolbar>
              <SelectInput name="status" defaultValue={status ?? ""} className="min-w-40">
                <option value="">Alla statusar</option>
                {CONTENT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
              <SelectInput name="sort" defaultValue={sort} className="min-w-40">
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sortera: {option.label}
                  </option>
                ))}
              </SelectInput>
              <SubmitButton variant="secondary">Uppdatera</SubmitButton>
            </AdminFilterToolbar>
          </form>

          <Table headers={["Ord", "Status", "Nycklar", "Uppdaterad", ""]}>
            {filteredWords.map((word) => (
              <tr key={word.id} className="border-b border-print-ink/10 align-top">
                <td className="font-medium text-print-ink">{word.answer}</td>
                <td>
                  <StatusBadge status={word.status} />
                </td>
                <td>{word.hintCount}</td>
                <td className="text-print-muted">
                  {word.updatedAt.toLocaleDateString("sv-SE")}
                </td>
                <td>
                  <Link
                    href={`/admin/words/${word.id}`}
                    className="text-sm font-medium underline-offset-2 hover:underline"
                  >
                    Öppna
                  </Link>
                </td>
              </tr>
            ))}
          </Table>
          {filteredWords.length === 0 ? (
            <p className="mt-3 text-sm text-print-muted">
              {allWords.length === 0
                ? "Inga ord kopplade till temat ännu."
                : "Inga ord matchade filtret."}
            </p>
          ) : null}
        </AdminPanel>

        <AdminPanel title="Temainfo">
          <AdminMetaGrid
            items={[
              { label: "Slug", value: <span className="font-mono text-xs">{theme.slug}</span> },
              { label: "Beskrivning", value: theme.description?.trim() || "—" },
              { label: "Ord utan nycklar", value: wordsWithoutHints },
              { label: "Uppdaterad", value: theme.updatedAt.toLocaleString("sv-SE") },
            ]}
          />
        </AdminPanel>
      </div>
    </AdminPage>
  );
}
