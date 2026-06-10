import Link from "next/link";
import type { HintCandidateStatus } from "@prisma/client";
import {
  AdminFilterToolbar,
  AdminPage,
  AdminPanel,
  DatabaseNotice,
  FeedbackMessage,
  HintCandidateStatusBadge,
  SelectInput,
  SubmitButton,
  Table,
  TextInput,
} from "@/components/admin/admin-ui";
import {
  HINT_CANDIDATE_STATUSES,
  HINT_CANDIDATE_STATUS_LABELS,
  HINT_TYPE_LABELS,
} from "@/lib/content/constants";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

type SearchParams = Promise<{
  status?: HintCandidateStatus | "";
  q?: string;
  error?: string;
  success?: string;
}>;

export default async function AdminProposalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status =
    params.status && HINT_CANDIDATE_STATUSES.includes(params.status)
      ? params.status
      : undefined;

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Förslag">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();
  const proposals = await prisma.hintCandidate.findMany({
    where: {
      AND: [
        status ? { status } : {},
        query
          ? {
              OR: [
                { text: { contains: query, mode: "insensitive" } },
                { word: { answer: { contains: query, mode: "insensitive" } } },
              ],
            }
          : {},
      ],
    },
    include: {
      word: {
        select: {
          id: true,
          answer: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  return (
    <AdminPage
      title="Förslag"
      description="Alla nyckelförslag i ordbanken, väntande och granskade."
    >
      <FeedbackMessage error={params.error} success={params.success} />

      <AdminPanel title="Förslagslista">
        <form method="get">
          <AdminFilterToolbar>
            <TextInput
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Sök förslag eller ord"
              className="min-w-48 flex-1"
            />
            <SelectInput name="status" defaultValue={status ?? ""} className="min-w-44">
              <option value="">Alla statusar</option>
              {HINT_CANDIDATE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {HINT_CANDIDATE_STATUS_LABELS[value]}
                </option>
              ))}
            </SelectInput>
            <SubmitButton variant="secondary">Filtrera</SubmitButton>
          </AdminFilterToolbar>
        </form>

        <Table headers={["Förslag", "Status", "Ord", "Typ", "Källa", "Skapad"]}>
          {proposals.map((proposal) => (
            <tr key={proposal.id} className="border-b border-print-ink/10 align-top">
              <td className="max-w-sm text-print-ink">{proposal.text}</td>
              <td>
                <HintCandidateStatusBadge status={proposal.status} />
              </td>
              <td>
                <Link
                  href={`/admin/words/${proposal.word.id}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {proposal.word.answer}
                </Link>
              </td>
              <td className="text-print-muted">{HINT_TYPE_LABELS[proposal.type]}</td>
              <td className="font-mono text-xs text-print-muted">{proposal.source}</td>
              <td className="text-print-muted">
                {proposal.createdAt.toLocaleDateString("sv-SE")}
              </td>
            </tr>
          ))}
        </Table>
        {proposals.length === 0 ? (
          <p className="mt-3 text-sm text-print-muted">Inga förslag matchade filtret.</p>
        ) : null}
      </AdminPanel>
    </AdminPage>
  );
}
