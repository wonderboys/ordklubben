import { AdminPanel } from '@/components/admin/admin-ui';

type PuzzleGenerationReportProps = {
  themeName: string | null;
  candidateCount: number;
  placedCount: number;
  failedCount: number;
  skippedCount: number;
  rejectedCollisions: number;
  rejectedSideWords: number;
  rejectedBlockPatterns: number;
  blockedCount: number;
  letterCellCount: number;
  utilizationRate: number;
  crossingCount: number;
  attemptCount: number;
  bestScore: number;
  shortWordCount: number;
  mediumWordCount: number;
  longWordCount: number;
  longestWord: number;
  averageWordLength: number;
  themeScore: number;
  themeHitCount: number;
  emergencyWordCount: number;
  blockRatio: number;
  gapsFilled: number;
  openConnections: number;
  blockClusters: number;
  isolatedRegions: number;
  optimizationImprovements: string | null;
  emptyCellsBlocked: number;
  remainingEmptyCount: number;
  finalValidationOk: boolean;
  width: number;
  height: number;
  summaryNote: string | null;
};

function formatUtilizationRate(
  rate: number,
  letterCellCount: number,
  width: number,
  height: number,
) {
  const totalCells = width * height;
  const percent = Math.round(rate * 100);

  return `${percent} % (${letterCellCount}/${totalCells})`;
}

function formatBlockRatio(blockRatio: number, blockedCount: number, width: number, height: number) {
  const totalCells = width * height;
  const percent = Math.round(blockRatio * 100);

  return `${percent} % (${blockedCount}/${totalCells})`;
}

export function PuzzleGenerationReport({
  themeName,
  candidateCount,
  placedCount,
  failedCount,
  skippedCount,
  rejectedCollisions,
  rejectedSideWords,
  rejectedBlockPatterns,
  blockedCount,
  letterCellCount,
  utilizationRate,
  crossingCount,
  attemptCount,
  bestScore,
  shortWordCount,
  mediumWordCount,
  longWordCount,
  longestWord,
  averageWordLength,
  themeScore,
  themeHitCount,
  emergencyWordCount,
  blockRatio,
  gapsFilled,
  openConnections,
  blockClusters,
  isolatedRegions,
  optimizationImprovements,
  emptyCellsBlocked,
  remainingEmptyCount,
  finalValidationOk,
  width,
  height,
  summaryNote,
}: PuzzleGenerationReportProps) {
  return (
    <AdminPanel title="Generering slutförd" compact>
      {summaryNote ? <p className="mb-3 text-sm text-print-ink">{summaryNote}</p> : null}
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">Tema</dt>
          <dd className="mt-0.5 text-print-ink">{themeName ?? 'Inget tema'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Storlek
          </dt>
          <dd className="mt-0.5 text-print-ink">
            {width}×{height}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Placerade ord
          </dt>
          <dd className="mt-0.5 text-print-ink">{placedCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Längsta ord
          </dt>
          <dd className="mt-0.5 text-print-ink">{longestWord} bokstäver</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Snittlängd
          </dt>
          <dd className="mt-0.5 text-print-ink">{averageWordLength.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Temapoäng
          </dt>
          <dd className="mt-0.5 text-print-ink">{Math.round(themeScore)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Tematräffar
          </dt>
          <dd className="mt-0.5 text-print-ink">{themeHitCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Nödord
          </dt>
          <dd className="mt-0.5 text-print-ink">{emergencyWordCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Korta ord (2–3)
          </dt>
          <dd className="mt-0.5 text-print-ink">{shortWordCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Mellanord (4–6)
          </dt>
          <dd className="mt-0.5 text-print-ink">{mediumWordCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Långa ord
          </dt>
          <dd className="mt-0.5 text-print-ink">{longWordCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Stoppruteandel
          </dt>
          <dd className="mt-0.5 text-print-ink">
            {formatBlockRatio(blockRatio, blockedCount, width, height)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Luckor fyllda
          </dt>
          <dd className="mt-0.5 text-print-ink">{gapsFilled}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Öppna anslutningar
          </dt>
          <dd className="mt-0.5 text-print-ink">{openConnections}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Blockkluster
          </dt>
          <dd className="mt-0.5 text-print-ink">{blockClusters}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Isolerade regioner
          </dt>
          <dd className="mt-0.5 text-print-ink">{isolatedRegions}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Optimeringsvinster
          </dt>
          <dd className="mt-0.5 text-print-ink">{optimizationImprovements ?? 'Inga'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Tomrutor blockerade
          </dt>
          <dd className="mt-0.5 text-print-ink">{emptyCellsBlocked}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Tomrutor kvar
          </dt>
          <dd className="mt-0.5 text-print-ink">{remainingEmptyCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Slutvalidering
          </dt>
          <dd className="mt-0.5 text-print-ink">{finalValidationOk ? 'OK' : 'FAILED'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Blockerade rutor
          </dt>
          <dd className="mt-0.5 text-print-ink">{blockedCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Fyllnadsgrad
          </dt>
          <dd className="mt-0.5 text-print-ink">
            {formatUtilizationRate(utilizationRate, letterCellCount, width, height)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Korsningar
          </dt>
          <dd className="mt-0.5 text-print-ink">{crossingCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Bästa score
          </dt>
          <dd className="mt-0.5 text-print-ink">{Math.round(bestScore)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Försök
          </dt>
          <dd className="mt-0.5 text-print-ink">{attemptCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Avvisade pga krock
          </dt>
          <dd className="mt-0.5 text-print-ink">{rejectedCollisions}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Avvisade pga sidord
          </dt>
          <dd className="mt-0.5 text-print-ink">{rejectedSideWords}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Avvisade pga blockmönster
          </dt>
          <dd className="mt-0.5 text-print-ink">{rejectedBlockPatterns}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
            Kandidater
          </dt>
          <dd className="mt-0.5 text-print-ink">{candidateCount}</dd>
        </div>
        {failedCount > 0 ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
              Hoppade ord
            </dt>
            <dd className="mt-0.5 text-print-ink">{failedCount}</dd>
          </div>
        ) : null}
        {skippedCount > 0 ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.06em] text-print-muted">
              Avbruten sökning
            </dt>
            <dd className="mt-0.5 text-print-ink">{skippedCount} ord kvar utan placering</dd>
          </div>
        ) : null}
      </dl>
    </AdminPanel>
  );
}
