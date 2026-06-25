import { notFound } from 'next/navigation';
import {
  AdminLinkButton,
  AdminPage,
  AdminPanel,
  DatabaseNotice,
  Table,
} from '@/components/admin/admin-ui';
import { ImportResultStatGrid } from '@/components/admin/import-result-summary';
import { IMPORT_BATCH_TYPE_LABELS } from '@/lib/content/constants';
import { formatImportBatchSource } from '@/lib/content/import-job';
import { parseBatchSummary } from '@/lib/content/import-batch';
import { getPrisma, isDatabaseConfigured } from '@/lib/db/prisma';

type Params = Promise<{
  id: string;
}>;

function renderOutcomeTableRows(
  rows: Array<{
    id: string;
    rowNumber: number;
    entityType: string;
    answer: string | null;
    hint: string | null;
    value: string | null;
    reason: string | null;
  }>,
) {
  return rows.map((row) => (
    <tr key={row.id} className="border-b border-print-ink/10 align-top">
      <td className="px-3 py-3 text-print-ink">
        {row.rowNumber === 0 ? 'Allmant' : row.rowNumber}
      </td>
      <td className="px-3 py-3 text-print-ink">{row.entityType}</td>
      <td className="px-3 py-3 text-print-ink">{row.answer ?? '—'}</td>
      <td className="px-3 py-3 text-print-muted">{row.hint ?? row.value ?? '—'}</td>
      <td className="px-3 py-3 text-print-muted">{row.reason ?? '—'}</td>
    </tr>
  ));
}

export default async function ImportBatchDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Importdetaljer">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();
  const batch = await prisma.importBatch.findUnique({
    where: { id },
    include: {
      rows: {
        orderBy: [{ rowNumber: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (!batch) {
    notFound();
  }

  const summary = parseBatchSummary(batch.summary);
  const importedRows = batch.rows.filter((row) => row.outcome === 'IMPORTED');
  const reusedRows = batch.rows.filter((row) => row.outcome === 'REUSED');
  const ignoredRows = batch.rows.filter((row) => row.outcome === 'IGNORED');
  const errorRows = batch.rows.filter((row) => row.outcome === 'ERROR');

  return (
    <AdminPage
      title="Importdetaljer"
      description={batch.filename ?? 'Importjobb'}
      actions={
        <AdminLinkButton href="/admin/import" variant="secondary">
          Tillbaka till import
        </AdminLinkButton>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <AdminPanel title="Metadata">
          <Table headers={['Falt', 'Varde']}>
            {[
              ['Importtyp', IMPORT_BATCH_TYPE_LABELS[batch.type]],
              ['Status', batch.status],
              ['Fil', batch.filename ?? '—'],
              [
                'Kalla',
                formatImportBatchSource({
                  sourceName: batch.sourceName,
                  sourceVersion: batch.sourceVersion,
                }),
              ],
              ['Licens', batch.sourceLicense ?? '—'],
              ['URL', batch.sourceUrl ?? '—'],
              ['Referens', batch.sourceReference ?? '—'],
              ['Kommentar', batch.sourceComment ?? '—'],
              ['Importerad', batch.importedAt.toLocaleString('sv-SE')],
              ['Importerad av', batch.importedBy ?? '—'],
              ['Fardig', batch.completedAt?.toLocaleString('sv-SE') ?? '—'],
            ].map(([label, value]) => (
              <tr key={label} className="border-b border-print-ink/10 align-top">
                <td className="px-3 py-3 font-mono text-xs text-print-muted">{label}</td>
                <td className="px-3 py-3 text-print-ink">{value}</td>
              </tr>
            ))}
          </Table>
        </AdminPanel>

        <AdminPanel title="Resultat">
          <ImportResultStatGrid
            batchType={batch.type}
            summary={summary}
            totalRows={batch.totalRows}
            errorCount={errorRows.length}
          />
        </AdminPanel>
      </div>

      <AdminPanel title="Importerat">
        <Table headers={['Rad', 'Typ', 'Ord', 'Post', 'Kommentar']}>
          {renderOutcomeTableRows(importedRows)}
        </Table>
        {importedRows.length === 0 ? (
          <p className="mt-3 text-sm text-print-muted">
            Inga poster importerades i det har jobbet.
          </p>
        ) : null}
      </AdminPanel>

      <AdminPanel title="Ateranvant">
        <Table headers={['Rad', 'Typ', 'Ord', 'Post', 'Kommentar']}>
          {renderOutcomeTableRows(reusedRows)}
        </Table>
        {reusedRows.length === 0 ? (
          <p className="mt-3 text-sm text-print-muted">
            Inga poster ateranvandes i det har jobbet.
          </p>
        ) : null}
      </AdminPanel>

      <AdminPanel title="Ignorerat">
        <Table headers={['Rad', 'Typ', 'Ord', 'Post', 'Kommentar']}>
          {renderOutcomeTableRows(ignoredRows)}
        </Table>
        {ignoredRows.length === 0 ? (
          <p className="mt-3 text-sm text-print-muted">Inga poster ignorerades i det har jobbet.</p>
        ) : null}
      </AdminPanel>

      <AdminPanel title="Fel">
        <Table headers={['Rad', 'Typ', 'Ord', 'Post', 'Kommentar']}>
          {renderOutcomeTableRows(errorRows)}
        </Table>
        {errorRows.length === 0 ? (
          <p className="mt-3 text-sm text-print-muted">Inga fel uppstod i det har jobbet.</p>
        ) : null}
      </AdminPanel>
    </AdminPage>
  );
}
