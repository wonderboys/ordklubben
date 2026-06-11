import { notFound } from "next/navigation";
import {
  AdminLinkButton,
  AdminPage,
  AdminPanel,
  DatabaseNotice,
  Table,
} from "@/components/admin/admin-ui";
import {
  importErrorTableHeaders,
} from "@/components/admin/import-result-summary";
import { IMPORT_BATCH_TYPE_LABELS } from "@/lib/content/constants";
import {
  parseBatchErrorRows,
  parseBatchSummary,
} from "@/lib/content/import-batch";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

type Params = Promise<{
  id: string;
}>;

function buildSummaryRows(
  batchType: import("@prisma/client").ImportBatchType,
  summary: ReturnType<typeof parseBatchSummary>,
  errorCount: number,
) {
  if (batchType === "LEXICON") {
    return [
      ["Rader lästa", String(summary?.totalRows ?? 0)],
      ["Importerade", String(summary?.createdLexicalEntries ?? 0)],
      ["Dubbletter", String(summary?.skippedDuplicateLexicalEntries ?? 0)],
      ["Saknade ord", String(summary?.skippedMissingWords ?? 0)],
      ["Felrader", String(summary?.failedRows ?? errorCount)],
    ];
  }

  return [
    ["Skapade ord", String(summary?.createdWords ?? 0)],
    ["Återanvända ord", String(summary?.reusedWords ?? 0)],
    ["Skippade ord", String(summary?.skippedWords ?? 0)],
    ["Skapade nycklar", String(summary?.createdHints ?? 0)],
    ["Skippade nycklar", String(summary?.skippedHints ?? 0)],
    ["Skapade teman", String(summary?.createdThemes ?? 0)],
    ["Återanvända teman", String(summary?.reusedThemes ?? 0)],
    ["Skapade temakopplingar", String(summary?.createdThemeLinks ?? 0)],
    ["Återanvända temakopplingar", String(summary?.reusedThemeLinks ?? 0)],
    ["Felrader", String(summary?.failedRows ?? errorCount)],
  ];
}

export default async function ImportBatchDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Importbatch">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();
  const batch = await prisma.importBatch.findUnique({
    where: { id },
  });

  if (!batch) {
    notFound();
  }

  const summary = parseBatchSummary(batch.summary);
  const errorRows = parseBatchErrorRows(batch.errorRows);
  const errorHeaders = importErrorTableHeaders(batch.type);

  return (
    <AdminPage
      title="Importbatch"
      description={batch.filename ?? "CSV-import"}
      actions={
        <AdminLinkButton href="/admin/import" variant="secondary">
          Tillbaka
        </AdminLinkButton>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <AdminPanel title="Batchmetadata">
          <Table headers={["Fält", "Värde"]}>
            {[
              ["Typ", IMPORT_BATCH_TYPE_LABELS[batch.type]],
              ["Status", batch.status],
              ["Filnamn", batch.filename ?? "—"],
              ["Källa", batch.source ?? "—"],
              ["totalRows", String(batch.totalRows)],
              ["importedRows", String(batch.importedRows)],
              ["skippedRows", String(batch.skippedRows)],
              ["createdAt", batch.createdAt.toLocaleString("sv-SE")],
              ["completedAt", batch.completedAt?.toLocaleString("sv-SE") ?? "—"],
            ].map(([label, value]) => (
              <tr key={label} className="border-b border-print-ink/10 align-top">
                <td className="font-mono text-xs text-print-muted">{label}</td>
                <td>{value}</td>
              </tr>
            ))}
          </Table>
        </AdminPanel>

        <AdminPanel title="Sammanfattning">
          <Table headers={["Resultat", "Antal"]}>
            {buildSummaryRows(batch.type, summary, errorRows.length).map(([label, value]) => (
              <tr key={label} className="border-b border-print-ink/10 align-top">
                <td>{label}</td>
                <td>{value}</td>
              </tr>
            ))}
          </Table>
        </AdminPanel>
      </div>

      <AdminPanel title="Felrader och hoppade rader">
        <Table headers={[...errorHeaders]}>
          {errorRows.map((errorRow, index) => (
            <tr key={`${errorRow.rowNumber}-${index}`} className="border-b border-print-ink/10 align-top">
              <td>{errorRow.rowNumber === 0 ? "Allmänt" : errorRow.rowNumber}</td>
              <td>{errorRow.reason}</td>
              <td className="text-print-muted">{errorRow.answer || "—"}</td>
              <td className="text-print-muted">{errorRow.hint || "—"}</td>
            </tr>
          ))}
        </Table>
        {errorRows.length === 0 ? (
          <p className="mt-3 text-sm text-print-muted">Inga felrader i denna importbatch.</p>
        ) : null}
      </AdminPanel>
    </AdminPage>
  );
}
