import Link from 'next/link';
import {
  AdminPage,
  AdminPanel,
  DatabaseNotice,
  FeedbackMessage,
  Table,
} from '@/components/admin/admin-ui';
import { AdminImportForm } from '@/components/admin/import-form';
import { ImportResultStatGrid } from '@/components/admin/import-result-summary';
import { IMPORT_BATCH_TYPE_LABELS } from '@/lib/content/constants';
import { formatImportBatchSource } from '@/lib/content/import-job';
import { parseBatchSummary, type BatchSummary } from '@/lib/content/import-batch';
import { getPrisma, isDatabaseConfigured } from '@/lib/db/prisma';

type SearchParams = Promise<{
  batchId?: string;
  error?: string;
  success?: string;
}>;

function getHistoryStats(
  rows: Array<{ outcome: string; entityType: string }>,
  summary: BatchSummary | null,
) {
  return {
    words:
      summary?.createdWords != null && summary?.reusedWords != null
        ? summary.createdWords + summary.reusedWords
        : rows.filter((row) => row.entityType === 'WORD' && row.outcome === 'IMPORTED').length,
    hints:
      summary?.createdHints ??
      rows.filter((row) => row.entityType === 'HINT' && row.outcome === 'IMPORTED').length,
    newWords:
      summary?.createdWords ??
      rows.filter((row) => row.entityType === 'WORD' && row.outcome === 'IMPORTED').length,
    reusedWords:
      summary?.reusedWords ??
      rows.filter((row) => row.entityType === 'WORD' && row.outcome === 'REUSED').length,
    duplicates:
      summary != null
        ? (summary.skippedWords ?? 0) +
          (summary.skippedHints ?? 0) +
          (summary.skippedDuplicateLexicalEntries ?? 0)
        : rows.filter((row) => row.outcome === 'IGNORED' || row.outcome === 'REUSED').length,
    errors: summary?.failedRows ?? rows.filter((row) => row.outcome === 'ERROR').length,
  };
}

export default async function AdminImportPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Import">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();
  const [selectedBatch, recentBatches] = await Promise.all([
    params.batchId
      ? prisma.importBatch.findUnique({
          where: { id: params.batchId },
          include: {
            rows: {
              select: {
                outcome: true,
                entityType: true,
              },
            },
          },
        })
      : null,
    prisma.importBatch.findMany({
      orderBy: { importedAt: 'desc' },
      take: 20,
      include: {
        rows: {
          select: {
            outcome: true,
            entityType: true,
          },
        },
      },
    }),
  ]);

  const selectedSummary = parseBatchSummary(selectedBatch?.summary ?? null);
  const selectedErrors = selectedBatch?.rows.filter((row) => row.outcome === 'ERROR').length ?? 0;

  return (
    <AdminPage
      title="Import"
      description="Importera orddata till den permanenta ordbanken med tydlig kallmetadata och full sparbar historik."
    >
      <FeedbackMessage error={params.error} success={params.success} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AdminPanel title="Ny import">
          <AdminImportForm />
        </AdminPanel>

        <AdminPanel title="Importguide">
          <details className="group">
            <summary className="cursor-pointer list-none text-sm font-medium text-print-ink">
              Visa CSV-format och regler
            </summary>
            <div className="mt-4 space-y-5 text-sm text-print-ink">
              <div>
                <p className="font-bold uppercase tracking-[0.04em]">Ord</p>
                <p>
                  `answer`, `difficulty`, `crosswordScore`, `notes`, `theme`, `wordStatus`,
                  `frequency`, `rank`, `cefr`.
                </p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-[0.04em]">Nycklar</p>
                <p>
                  `answer`, `hint`, `type`, `difficulty`, `tone`, `notes`, `theme`, `wordStatus`,
                  `hintStatus`.
                </p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-[0.04em]">Lexikon</p>
                <p>`word`, `type`, `value`, `notes`. Ordet maste redan finnas i ordbanken.</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-[0.04em]">Princip</p>
                <p>
                  Kallmetadata anges per importjobb. Redaktionella andringar skrivs aldrig over av
                  en senare import.
                </p>
              </div>
            </div>
          </details>
        </AdminPanel>
      </div>

      {selectedBatch ? (
        <AdminPanel title="Senaste importjobb">
          <div className="space-y-4">
            <ImportResultStatGrid
              batchType={selectedBatch.type}
              summary={selectedSummary}
              totalRows={selectedBatch.totalRows}
              errorCount={selectedErrors}
            />
            <p className="text-sm text-print-muted">
              {formatImportBatchSource({
                sourceName: selectedBatch.sourceName,
                sourceVersion: selectedBatch.sourceVersion,
              })}{' '}
              · {selectedBatch.filename ?? 'okand fil'} ·{' '}
              {selectedBatch.importedAt.toLocaleString('sv-SE')}
            </p>
            <p>
              <Link
                href={`/admin/import/${selectedBatch.id}`}
                className="text-sm font-bold text-print-ink underline underline-offset-2"
              >
                Oppna importdetaljer
              </Link>
            </p>
          </div>
        </AdminPanel>
      ) : null}

      <AdminPanel title="Importhistorik">
        <Table
          headers={[
            'Fil',
            'Kalla',
            'Version',
            'Importerad',
            'Antal ord',
            'Antal nycklar',
            'Nya ord',
            'Ateranvanda ord',
            'Dubbletter',
            'Fel',
            'Status',
          ]}
        >
          {recentBatches.map((batch) => {
            const stats = getHistoryStats(batch.rows, parseBatchSummary(batch.summary));

            return (
              <tr key={batch.id} className="border-b border-print-ink/10 align-top">
                <td className="px-3 py-3 text-print-ink">
                  <Link href={`/admin/import/${batch.id}`} className="underline underline-offset-2">
                    {batch.filename ?? 'Import utan filnamn'}
                  </Link>
                </td>
                <td className="px-3 py-3 text-print-ink">
                  {batch.sourceName ?? batch.source ?? '—'}
                </td>
                <td className="px-3 py-3 text-print-muted">{batch.sourceVersion ?? '—'}</td>
                <td className="px-3 py-3 text-print-muted">
                  {batch.importedAt.toLocaleString('sv-SE')}
                </td>
                <td className="px-3 py-3 text-print-ink">{stats.words}</td>
                <td className="px-3 py-3 text-print-ink">{stats.hints}</td>
                <td className="px-3 py-3 text-print-ink">{stats.newWords}</td>
                <td className="px-3 py-3 text-print-ink">{stats.reusedWords}</td>
                <td className="px-3 py-3 text-print-ink">{stats.duplicates}</td>
                <td className="px-3 py-3 text-print-ink">{stats.errors}</td>
                <td className="px-3 py-3 text-print-ink">
                  {batch.status} · {IMPORT_BATCH_TYPE_LABELS[batch.type]}
                </td>
              </tr>
            );
          })}
        </Table>
        {recentBatches.length === 0 ? (
          <p className="mt-4 text-sm text-print-muted">Ingen importhistorik annu.</p>
        ) : null}
      </AdminPanel>
    </AdminPage>
  );
}
