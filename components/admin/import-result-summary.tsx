import type { ImportBatchType } from "@prisma/client";
import type { BatchSummary } from "@/lib/content/import-batch";

export function ImportResultStatGrid({
  batchType,
  summary,
  totalRows,
  errorCount,
}: {
  batchType: ImportBatchType;
  summary: BatchSummary | null;
  totalRows: number;
  errorCount: number;
}) {
  if (batchType === "LEXICON") {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ImportStat label="Rader lästa" value={summary?.totalRows ?? totalRows} />
        <ImportStat label="Importerade" value={summary?.createdLexicalEntries ?? 0} />
        <ImportStat label="Dubbletter" value={summary?.skippedDuplicateLexicalEntries ?? 0} />
        <ImportStat label="Saknade ord" value={summary?.skippedMissingWords ?? 0} />
        <ImportStat label="Felrader" value={summary?.failedRows ?? errorCount} />
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <ImportStat label="Totala rader" value={summary?.totalRows ?? totalRows} />
        <ImportStat label="Skapade ord" value={summary?.createdWords ?? 0} />
        <ImportStat label="Återanvända ord" value={summary?.reusedWords ?? 0} />
        <ImportStat label="Skippade ord" value={summary?.skippedWords ?? 0} />
        <ImportStat label="Felrader" value={summary?.failedRows ?? errorCount} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <ImportStat label="Skapade nycklar" value={summary?.createdHints ?? 0} />
        <ImportStat label="Skippade nycklar" value={summary?.skippedHints ?? 0} />
        <ImportStat label="Skapade teman" value={summary?.createdThemes ?? 0} />
        <ImportStat label="Återanvända teman" value={summary?.reusedThemes ?? 0} />
        <ImportStat
          label="Temakopplingar"
          value={(summary?.createdThemeLinks ?? 0) + (summary?.reusedThemeLinks ?? 0)}
          detail={`${summary?.createdThemeLinks ?? 0} nya · ${summary?.reusedThemeLinks ?? 0} befintliga`}
        />
      </div>
    </>
  );
}

function ImportStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="border border-print-ink/10 p-3">
      <p className="text-xs uppercase text-print-muted">{label}</p>
      <p className="text-2xl font-bold text-print-ink">{value}</p>
      {detail ? <p className="mt-1 text-xs text-print-muted">{detail}</p> : null}
    </div>
  );
}

export function importBatchHistoryLabel(
  batchType: ImportBatchType,
  summary: BatchSummary | null,
) {
  if (!summary) {
    return "Öppna batch";
  }

  if (batchType === "LEXICON") {
    return `${summary.createdLexicalEntries} lexikonposter`;
  }

  return `${summary.createdWords} ord, ${summary.createdHints} nycklar${
    summary.createdThemes + summary.reusedThemes > 0
      ? `, ${summary.createdThemes + summary.reusedThemes} teman`
      : ""
  }`;
}

export function importErrorTableHeaders(batchType: ImportBatchType) {
  if (batchType === "LEXICON") {
    return ["Rad", "Orsak", "Ord", "Värde"] as const;
  }

  return ["Rad", "Orsak", "Ord", "Nyckel"] as const;
}
