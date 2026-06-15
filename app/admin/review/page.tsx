import Link from 'next/link';
import {
  AdminActionGroup,
  AdminLinkButton,
  AdminPage,
  AdminPanel,
  DatabaseNotice,
  FeedbackMessage,
  SubmitButton,
} from '@/components/admin/admin-ui';
import { approveAllDraftWords } from '@/lib/content/actions';
import { buildAdminListHref } from '@/lib/content/admin-list';
import { IMPORT_BATCH_TYPE_LABELS } from '@/lib/content/constants';
import { getPrisma, isDatabaseConfigured } from '@/lib/db/prisma';

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

function ReviewCard({
  title,
  count,
  description,
  children,
}: {
  title: string;
  count: number;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <AdminPanel title={title}>
      <p className="text-3xl font-semibold tabular-nums text-print-ink">{count}</p>
      <p className="mt-1 text-sm text-print-muted">{description}</p>
      <div className="mt-3">
        <AdminActionGroup>{children}</AdminActionGroup>
      </div>
    </AdminPanel>
  );
}

export default async function AdminReviewPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Granska">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();

  const [draftCount, withoutHintCount, withoutThemeCount, pendingProposalCount, recentImports] =
    await Promise.all([
      prisma.word.count({ where: { status: 'DRAFT' } }),
      prisma.word.count({ where: { hints: { none: {} } } }),
      prisma.word.count({ where: { themes: { none: {} } } }),
      prisma.hintCandidate.count({ where: { status: 'PENDING' } }),
      prisma.importBatch.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          filename: true,
          type: true,
          status: true,
          importedRows: true,
          createdAt: true,
        },
      }),
    ]);

  const wordsDraftHref = buildAdminListHref('/admin/words', { status: 'DRAFT' });
  const wordsWithoutHintHref = buildAdminListHref('/admin/words', { withoutHint: '1' });
  const wordsWithoutThemeHref = buildAdminListHref('/admin/words', { withoutTheme: '1' });
  const proposalsPendingHref = buildAdminListHref('/admin/proposals', { status: 'PENDING' });

  return (
    <AdminPage
      title="Granska"
      description="Översikt för kvalitetskontroll av ordbanken. Massredigering sker i Ord-vyn."
    >
      <FeedbackMessage error={params.error} success={params.success} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewCard title="Utkast" count={draftCount} description="Ord som ännu inte är godkända.">
          <AdminLinkButton href={wordsDraftHref} variant="secondary">
            Visa i ordlistan
          </AdminLinkButton>
          {draftCount > 0 ? (
            <form action={approveAllDraftWords} className="inline-flex">
              <SubmitButton variant="primary">Godkänn alla utkast</SubmitButton>
            </form>
          ) : null}
        </ReviewCard>

        <ReviewCard
          title="Saknar nyckel"
          count={withoutHintCount}
          description="Ord utan godkända eller utkast-nycklar."
        >
          <AdminLinkButton href={wordsWithoutHintHref} variant="secondary">
            Visa i ordlistan
          </AdminLinkButton>
        </ReviewCard>

        <ReviewCard
          title="Saknar tema"
          count={withoutThemeCount}
          description="Ord utan temakoppling."
        >
          <AdminLinkButton href={wordsWithoutThemeHref} variant="secondary">
            Visa i ordlistan
          </AdminLinkButton>
        </ReviewCard>

        <ReviewCard
          title="Förslag att granska"
          count={pendingProposalCount}
          description="Nyckelförslag som väntar på beslut."
        >
          <AdminLinkButton href={proposalsPendingHref} variant="secondary">
            Öppna förslag
          </AdminLinkButton>
        </ReviewCard>
      </div>

      <AdminPanel title="Senast importerade">
        {recentImports.length > 0 ? (
          <div className="space-y-3">
            {recentImports.map((batch) => (
              <div
                key={batch.id}
                className="flex flex-col gap-1 border-b border-print-ink/10 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-print-ink">
                    {batch.filename ?? 'Import utan filnamn'}
                  </p>
                  <p className="text-sm text-print-muted">
                    {IMPORT_BATCH_TYPE_LABELS[batch.type]} · {batch.importedRows} rader ·{' '}
                    {batch.createdAt.toLocaleString('sv-SE', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <Link
                  href={`/admin/import/${batch.id}`}
                  className="text-sm font-medium text-print-ink underline-offset-2 hover:underline"
                >
                  Visa import
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-print-muted">
            Ingen importhistorik ännu.{' '}
            <Link href="/admin/import" className="underline-offset-2 hover:underline">
              Importera ord
            </Link>
          </p>
        )}
      </AdminPanel>
    </AdminPage>
  );
}
