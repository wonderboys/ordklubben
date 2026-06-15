import Link from "next/link";
import {
  AdminPage,
  AdminPanel,
  DatabaseNotice,
  FeedbackMessage,
  Table,
} from "@/components/admin/admin-ui";
import { AdminImportForm } from "@/components/admin/import-form";
import {
  ImportResultStatGrid,
  importBatchHistoryLabel,
  importErrorTableHeaders,
} from "@/components/admin/import-result-summary";
import { IMPORT_BATCH_TYPE_LABELS } from "@/lib/content/constants";
import {
  parseBatchErrorRows,
  parseBatchSummary,
} from "@/lib/content/import-batch";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

type SearchParams = Promise<{
  batchId?: string;
  error?: string;
  success?: string;
}>;

export default async function AdminImportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
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
        })
      : null,
    prisma.importBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const selectedSummary = parseBatchSummary(selectedBatch?.summary ?? null);
  const selectedErrors = parseBatchErrorRows(selectedBatch?.errorRows ?? null);

  return (
    <AdminPage
      title="Import"
      description="Importera ord, nycklar eller lexikondata från CSV."
    >
      <FeedbackMessage error={params.error} success={params.success} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AdminPanel title="Ny import">
          <AdminImportForm />
        </AdminPanel>

        <AdminPanel title="CSV-format">
          <div className="space-y-5 text-sm text-print-ink">
            <div>
              <p className="font-bold uppercase tracking-[0.04em]">Ord</p>
              <p>
                `answer`, `source`, `sourceReference`, `difficulty`, `crosswordScore`, `notes`,
                `theme`, `wordStatus` (valfria utom answer). `source` är generisk (t.ex. import).
                `sourceReference` kan ange filnamn eller dataset.
              </p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-[0.04em]">Nycklar</p>
              <p>
                `answer`, `hint`, `type`, `difficulty`, `tone`, `source`, `notes`,
                `theme`, `wordStatus`, `hintStatus` (valfria utom answer och hint)
              </p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-[0.04em]">Ord + nycklar</p>
              <p>Samma kolumner som för nycklar. En rad skapar eller återanvänder ordet och lägger till en nyckel.</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-[0.04em]">Lexikon</p>
              <p>
                `word`, `type`, `value`, `source`, `sourceReference`, `notes` (valfria utom word,
                type och value). Ordet måste redan finnas i ordbanken.
              </p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-[0.04em]">Regler</p>
              <p>
                `answer` krävs alltid. `hint` krävs för nyckelimport. Tom `type` blir `DEFINITION`.
                Okända värden mappas till säkra standarder. `theme` kopplar ordet
                till tema. `wordStatus` och `hintStatus` kan
                vara `DRAFT` eller `APPROVED` och override:ar default per rad. Befintliga ord och nycklar
                ändras inte.
              </p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-[0.04em]">Exempel</p>
              <p className="font-mono text-xs leading-relaxed text-print-muted">
                answer,hint,theme,source,sourceReference,wordStatus,hintStatus
                <br />
                MÅL,Det man vill göra i fotboll,Fotboll,import,fotboll_ordlista_v2.csv,APPROVED,APPROVED
                <br />
                <br />
                word,type,value,source,sourceReference,notes
                <br />
                TRAV,DEFINITION,Hästars gångart,saldo,saldo_v1,
                <br />
                TRAV,SYNONYM,gångart,synlex,synlex_v1,
              </p>
            </div>
          </div>
        </AdminPanel>
      </div>

      {selectedBatch ? (
        <AdminPanel title="Senaste importresultat">
          <div className="grid gap-4">
            <ImportResultStatGrid
              batchType={selectedBatch.type}
              summary={selectedSummary}
              totalRows={selectedBatch.totalRows}
              errorCount={selectedErrors.length}
            />

            <div className="text-sm text-print-muted">
              Fil: {selectedBatch.filename ?? "okänd"} · Typ:{" "}
              {IMPORT_BATCH_TYPE_LABELS[selectedBatch.type]} · Status: {selectedBatch.status}
            </div>

            <div>
              <Link
                href={`/admin/import/${selectedBatch.id}`}
                className="text-sm font-bold text-print-ink underline underline-offset-2"
              >
                Öppna importbatch
              </Link>
            </div>

            <Table headers={[...importErrorTableHeaders(selectedBatch.type)]}>
              {selectedErrors.map((errorRow, index) => (
                <tr key={`${errorRow.rowNumber}-${index}`} className="border-b border-print-ink/10 align-top">
                  <td className="px-3 py-3 text-print-ink">
                    {errorRow.rowNumber === 0 ? "Allmänt" : errorRow.rowNumber}
                  </td>
                  <td className="px-3 py-3 text-print-ink">{errorRow.reason}</td>
                  <td className="px-3 py-3 text-print-muted">
                    {errorRow.answer || "—"}
                  </td>
                  <td className="px-3 py-3 text-print-muted">
                    {errorRow.hint || "—"}
                  </td>
                </tr>
              ))}
            </Table>
            {selectedErrors.length === 0 ? (
              <p className="text-sm text-print-muted">Inga felrader i den här importen.</p>
            ) : null}
          </div>
        </AdminPanel>
      ) : null}

      <AdminPanel title="Importhistorik">
        <Table headers={["Tid", "Typ", "Fil", "Status", "Rader", "Detaljer"]}>
          {recentBatches.map((batch) => {
            const summary = parseBatchSummary(batch.summary);

            return (
              <tr key={batch.id} className="border-b border-print-ink/10 align-top">
                <td className="px-3 py-3 text-print-ink">
                  {batch.createdAt.toLocaleString("sv-SE")}
                </td>
                <td className="px-3 py-3 text-print-ink">
                  {IMPORT_BATCH_TYPE_LABELS[batch.type]}
                </td>
                <td className="px-3 py-3 text-print-muted">
                  {batch.filename ?? "—"}
                </td>
                <td className="px-3 py-3 text-print-ink">{batch.status}</td>
                <td className="px-3 py-3 text-print-ink">{batch.totalRows}</td>
                <td className="px-3 py-3 text-print-muted">
                  <Link
                    href={`/admin/import/${batch.id}`}
                    className="underline underline-offset-2"
                  >
                    {importBatchHistoryLabel(batch.type, summary)}
                  </Link>
                </td>
              </tr>
            );
          })}
        </Table>
        {recentBatches.length === 0 ? (
          <p className="mt-4 text-sm text-print-muted">Ingen importhistorik ännu.</p>
        ) : null}
      </AdminPanel>
    </AdminPage>
  );
}
