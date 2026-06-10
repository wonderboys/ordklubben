import Link from "next/link";
import {
  AdminPage,
  AdminPanel,
  DatabaseNotice,
  FeedbackMessage,
  Field,
  FileInput,
  SelectInput,
  SubmitButton,
  Table,
} from "@/components/admin/admin-ui";
import { importContentAction } from "@/lib/content/actions";
import {
  CONTENT_STATUSES,
  IMPORT_BATCH_TYPE_LABELS,
  IMPORT_BATCH_TYPES,
  STATUS_LABELS,
} from "@/lib/content/constants";
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
      description="Importera ord och nycklar från CSV."
    >
      <FeedbackMessage error={params.error} success={params.success} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AdminPanel title="Ny import">
          <form action={importContentAction} className="grid gap-3">
            <Field label="Importtyp" htmlFor="importType">
              <SelectInput id="importType" name="importType" defaultValue="WORDS_AND_HINTS">
                {IMPORT_BATCH_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {IMPORT_BATCH_TYPE_LABELS[value]}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Defaultstatus för nya ord"
                htmlFor="wordStatus"
                hint="Välj Godkänd för kurerade seed-filer. Gäller bara nya ord."
              >
                <SelectInput id="wordStatus" name="wordStatus" defaultValue="DRAFT">
                  {CONTENT_STATUSES.filter((status) => status !== "REJECTED").map(
                    (value) => (
                      <option key={value} value={value}>
                        {STATUS_LABELS[value]}
                      </option>
                    ),
                  )}
                </SelectInput>
              </Field>

              <Field
                label="Defaultstatus för nya nycklar"
                htmlFor="hintStatus"
                hint="Välj Godkänd för kurerade seed-filer. Gäller bara nya nycklar."
              >
                <SelectInput id="hintStatus" name="hintStatus" defaultValue="DRAFT">
                  {CONTENT_STATUSES.filter((status) => status !== "REJECTED").map(
                    (value) => (
                      <option key={value} value={value}>
                        {STATUS_LABELS[value]}
                      </option>
                    ),
                  )}
                </SelectInput>
              </Field>
            </div>

            <Field
              label="CSV-fil"
              htmlFor="file"
              hint="Stöd för ord, nycklar eller kombinerad import enligt exemplen nedan."
            >
              <FileInput id="file" name="file" type="file" accept=".csv,text/csv" required />
            </Field>

            <div>
              <SubmitButton variant="primary">Importera</SubmitButton>
            </div>
          </form>
        </AdminPanel>

        <AdminPanel title="CSV-format">
          <div className="space-y-5 text-sm text-print-ink">
            <div>
              <p className="font-bold uppercase tracking-[0.04em]">Ord</p>
              <p>
                `answer`, `difficulty`, `crosswordScore`, `notes`, `theme`, `wordStatus` (valfria)
              </p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-[0.04em]">Nycklar</p>
              <p>
                `answer`, `hint`, `type`, `difficulty`, `tone`, `source`, `notes`, `theme`,
                `wordStatus`, `hintStatus` (valfria utom answer och hint)
              </p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-[0.04em]">Ord + nycklar</p>
              <p>Samma kolumner som för nycklar. En rad skapar eller återanvänder ordet och lägger till en nyckel.</p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-[0.04em]">Regler</p>
              <p>
                `answer` krävs alltid. `hint` krävs för nyckelimport. Okänd `type` blir `OTHER`, tom `type`
                blir `DEFINITION`. `theme` kopplar ordet till tema. `wordStatus` och `hintStatus` kan
                vara `DRAFT` eller `APPROVED` och override:ar default per rad. Befintliga ord och nycklar
                ändras inte.
              </p>
            </div>
            <div>
              <p className="font-bold uppercase tracking-[0.04em]">Exempel</p>
              <p className="font-mono text-xs leading-relaxed text-print-muted">
                answer,hint,theme,source,wordStatus,hintStatus
                <br />
                MÅL,Det man vill göra i fotboll,Fotboll,fotboll_seed,APPROVED,APPROVED
              </p>
            </div>
          </div>
        </AdminPanel>
      </div>

      {selectedBatch ? (
        <AdminPanel title="Senaste importresultat">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
              <div className="border border-print-ink/10 p-3">
                <p className="text-xs uppercase text-print-muted">Totala rader</p>
                <p className="text-2xl font-bold text-print-ink">
                  {selectedSummary?.totalRows ?? selectedBatch.totalRows}
                </p>
              </div>
              <div className="border border-print-ink/10 p-3">
                <p className="text-xs uppercase text-print-muted">Skapade ord</p>
                <p className="text-2xl font-bold text-print-ink">
                  {selectedSummary?.createdWords ?? 0}
                </p>
              </div>
              <div className="border border-print-ink/10 p-3">
                <p className="text-xs uppercase text-print-muted">Återanvända ord</p>
                <p className="text-2xl font-bold text-print-ink">
                  {selectedSummary?.reusedWords ?? 0}
                </p>
              </div>
              <div className="border border-print-ink/10 p-3">
                <p className="text-xs uppercase text-print-muted">Skippade ord</p>
                <p className="text-2xl font-bold text-print-ink">
                  {selectedSummary?.skippedWords ?? 0}
                </p>
              </div>
              <div className="border border-print-ink/10 p-3">
                <p className="text-xs uppercase text-print-muted">Felrader</p>
                <p className="text-2xl font-bold text-print-ink">
                  {selectedSummary?.failedRows ?? selectedErrors.length}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
              <div className="border border-print-ink/10 p-3">
                <p className="text-xs uppercase text-print-muted">Skapade nycklar</p>
                <p className="text-2xl font-bold text-print-ink">
                  {selectedSummary?.createdHints ?? 0}
                </p>
              </div>
              <div className="border border-print-ink/10 p-3">
                <p className="text-xs uppercase text-print-muted">Skippade nycklar</p>
                <p className="text-2xl font-bold text-print-ink">
                  {selectedSummary?.skippedHints ?? 0}
                </p>
              </div>
              <div className="border border-print-ink/10 p-3">
                <p className="text-xs uppercase text-print-muted">Skapade teman</p>
                <p className="text-2xl font-bold text-print-ink">
                  {selectedSummary?.createdThemes ?? 0}
                </p>
              </div>
              <div className="border border-print-ink/10 p-3">
                <p className="text-xs uppercase text-print-muted">Återanvända teman</p>
                <p className="text-2xl font-bold text-print-ink">
                  {selectedSummary?.reusedThemes ?? 0}
                </p>
              </div>
              <div className="border border-print-ink/10 p-3">
                <p className="text-xs uppercase text-print-muted">Temakopplingar</p>
                <p className="text-2xl font-bold text-print-ink">
                  {(selectedSummary?.createdThemeLinks ?? 0) +
                    (selectedSummary?.reusedThemeLinks ?? 0)}
                </p>
                <p className="mt-1 text-xs text-print-muted">
                  {selectedSummary?.createdThemeLinks ?? 0} nya ·{" "}
                  {selectedSummary?.reusedThemeLinks ?? 0} befintliga
                </p>
              </div>
            </div>

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

            <Table headers={["Rad", "Orsak", "Ord", "Nyckel"]}>
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
                    {summary
                      ? `${summary.createdWords} ord, ${summary.createdHints} nycklar${
                          summary.createdThemes + summary.reusedThemes > 0
                            ? `, ${summary.createdThemes + summary.reusedThemes} teman`
                            : ""
                        }`
                      : "Öppna batch"}
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
