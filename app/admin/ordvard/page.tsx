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
import { formatImportBatchSource } from '@/lib/content/import-job';
import { getPrisma, isDatabaseConfigured } from '@/lib/db/prisma';

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

function QueueCard({
  title,
  count,
  description,
  children,
}: {
  title: string;
  count: number;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <AdminPanel title={title}>
      <p className="text-3xl font-semibold tabular-nums text-print-ink">{count}</p>
      <p className="mt-1 text-sm text-print-muted">{description}</p>
      {children ? (
        <div className="mt-3">
          <AdminActionGroup>{children}</AdminActionGroup>
        </div>
      ) : null}
    </AdminPanel>
  );
}

export default async function AdminOrdvardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Ordvard">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();
  const [
    importsWithErrors,
    recentImports,
    draftCount,
    withoutHintCount,
    withoutThemeCount,
    withoutLexiconCount,
    pendingProposalCount,
    totalWordCount,
    approvedWordCount,
  ] = await Promise.all([
    prisma.importBatch.count({
      where: {
        rows: {
          some: {
            outcome: 'ERROR',
          },
        },
      },
    }),
    prisma.importBatch.findMany({
      orderBy: { importedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        filename: true,
        type: true,
        status: true,
        importedAt: true,
        sourceName: true,
        sourceVersion: true,
      },
    }),
    prisma.word.count({ where: { status: 'DRAFT' } }),
    prisma.word.count({ where: { hints: { none: {} } } }),
    prisma.word.count({ where: { themes: { none: {} } } }),
    prisma.word.count({ where: { lexicalEntries: { none: {} } } }),
    prisma.hintCandidate.count({ where: { status: 'PENDING' } }),
    prisma.word.count(),
    prisma.word.count({ where: { status: 'APPROVED' } }),
  ]);

  const wordsDraftHref = buildAdminListHref('/admin/words', { status: 'DRAFT' });
  const wordsWithoutHintHref = buildAdminListHref('/admin/words', { withoutHint: '1' });
  const wordsWithoutThemeHref = buildAdminListHref('/admin/words', { withoutTheme: '1' });
  const proposalsPendingHref = buildAdminListHref('/admin/proposals', { status: 'PENDING' });

  return (
    <AdminPage
      title="Ordvard"
      description="Redaktionens kontrollpanel for import, kvalitet och lopande arbete i ordbanken."
    >
      <FeedbackMessage error={params.error} success={params.success} />

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminPanel title="Import">
          <div className="grid gap-4 sm:grid-cols-3">
            <QueueCard
              title="Nya importer"
              count={recentImports.length}
              description="De fem senaste importjobben ligger redo for uppfoljning."
            />
            <QueueCard
              title="Importer med fel"
              count={importsWithErrors}
              description="Importjobb dar minst en rad loggats som fel."
            />
            <QueueCard
              title="Importera"
              count={0}
              description="Starta ett nytt importjobb med kallmetadata och historik."
            >
              <AdminLinkButton href="/admin/import" variant="secondary">
                Öppna import
              </AdminLinkButton>
            </QueueCard>
          </div>
        </AdminPanel>

        <AdminPanel title="Ord">
          <div className="grid gap-4 sm:grid-cols-2">
            <QueueCard
              title="Utkast"
              count={draftCount}
              description="Ord som annu inte ar godkanda."
            >
              <AdminLinkButton href={wordsDraftHref} variant="secondary">
                Visa ord
              </AdminLinkButton>
              {draftCount > 0 ? (
                <form action={approveAllDraftWords} className="inline-flex">
                  <SubmitButton variant="primary">Godkann alla utkast</SubmitButton>
                </form>
              ) : null}
            </QueueCard>
            <QueueCard
              title="Saknar nyckel"
              count={withoutHintCount}
              description="Ord utan nycklar."
            >
              <AdminLinkButton href={wordsWithoutHintHref} variant="secondary">
                Visa ord
              </AdminLinkButton>
            </QueueCard>
            <QueueCard
              title="Saknar tema"
              count={withoutThemeCount}
              description="Ord utan temakoppling."
            >
              <AdminLinkButton href={wordsWithoutThemeHref} variant="secondary">
                Visa ord
              </AdminLinkButton>
            </QueueCard>
            <QueueCard
              title="Saknar lexikon"
              count={withoutLexiconCount}
              description="Ord utan definition eller annan lexikal metadata."
            />
          </div>
        </AdminPanel>

        <AdminPanel title="Redaktion">
          <div className="grid gap-4 sm:grid-cols-2">
            <QueueCard
              title="Forslag"
              count={pendingProposalCount}
              description="Nya eller obearbetade forslag som vantar pa beslut."
            >
              <AdminLinkButton href={proposalsPendingHref} variant="secondary">
                Öppna forslag
              </AdminLinkButton>
            </QueueCard>
            <QueueCard
              title="Behov av granskning"
              count={draftCount + pendingProposalCount}
              description="Samlad arbetsko for saker som kraver redaktionellt beslut."
            />
          </div>
        </AdminPanel>

        <AdminPanel title="Statistik">
          <div className="grid gap-4 sm:grid-cols-3">
            <QueueCard
              title="Antal ord"
              count={totalWordCount}
              description="Totalt antal ord i ordbanken."
            />
            <QueueCard
              title="Godkanda"
              count={approvedWordCount}
              description="Ord som ar redo att anvandas."
            />
            <QueueCard
              title="Utkast"
              count={draftCount}
              description="Ord som fortfarande ar under arbete."
            />
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="Senaste importer">
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
                    {formatImportBatchSource({
                      sourceName: batch.sourceName,
                      sourceVersion: batch.sourceVersion,
                    })}{' '}
                    · {IMPORT_BATCH_TYPE_LABELS[batch.type]} ·{' '}
                    {batch.importedAt.toLocaleString('sv-SE', {
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
