import { notFound } from "next/navigation";
import {
  AdminBreadcrumb,
  AdminLinkButton,
  AdminPage,
  DatabaseNotice,
  FeedbackMessage,
} from "@/components/admin/admin-ui";
import { PuzzleEditorWorkspace } from "@/components/admin/puzzle/puzzle-editor-workspace";
import { PuzzleGenerationReport } from "@/components/admin/puzzle/puzzle-generation-report";
import {
  PUZZLE_STATUS_LABELS,
  PUZZLE_TYPE_LABELS,
} from "@/lib/content/constants";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

type SearchParams = Promise<{
  error?: string;
  success?: string;
  generated?: string;
  genTheme?: string;
  genCandidates?: string;
  genPlaced?: string;
  genFailed?: string;
  genSkipped?: string;
  genRejectedCollisions?: string;
  genRejectedSideWords?: string;
  genRejectedBlockPatterns?: string;
  genBlocked?: string;
  genLetterCells?: string;
  genUtilization?: string;
  genCrossings?: string;
  genAttempts?: string;
  genBestScore?: string;
  genShortWords?: string;
  genMediumWords?: string;
  genLongWords?: string;
  genLongestWord?: string;
  genAvgWordLength?: string;
  genThemeScore?: string;
  genThemeHits?: string;
  genEmergencyWords?: string;
  genBlockRatio?: string;
  genGapsFilled?: string;
  genOpenConnections?: string;
  genBlockClusters?: string;
  genIsolatedRegions?: string;
  genOptimization?: string;
  genEmptyBlocked?: string;
  genRemainingEmpty?: string;
  genValidationOk?: string;
  genSummary?: string;
  genWidth?: string;
  genHeight?: string;
}>;

export default async function PuzzleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const query = await searchParams;

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Pussel">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();
  const puzzle = await prisma.puzzle.findUnique({
    where: { id },
    include: {
      entries: {
        include: {
          word: {
            select: {
              id: true,
              answer: true,
              length: true,
              hints: {
                where: {
                  status: {
                    in: ["DRAFT", "APPROVED"],
                  },
                },
                select: {
                  id: true,
                  text: true,
                  status: true,
                  type: true,
                  difficulty: true,
                },
                orderBy: [{ status: "asc" }, { text: "asc" }],
              },
            },
          },
          hint: {
            select: {
              id: true,
              text: true,
              type: true,
              status: true,
            },
          },
        },
        orderBy: [{ direction: "asc" }, { number: "asc" }, { row: "asc" }, { col: "asc" }],
      },
      blockedCells: {
        orderBy: [{ row: "asc" }, { col: "asc" }],
      },
    },
  });

  if (!puzzle) {
    notFound();
  }

  const words = await prisma.word.findMany({
    where: {
      id: {
        notIn: puzzle.entries.map((entry) => entry.wordId),
      },
    },
    select: {
      id: true,
      answer: true,
      length: true,
      status: true,
      hints: {
        where: {
          status: {
            in: ["DRAFT", "APPROVED"],
          },
        },
        select: {
          id: true,
          text: true,
          status: true,
          type: true,
          difficulty: true,
        },
        orderBy: [{ status: "asc" }, { text: "asc" }],
      },
    },
    orderBy: [{ answer: "asc" }],
    take: 250,
  });

  const gridEntries = puzzle.entries.map((entry) => ({
    id: entry.id,
    answerSnapshot: entry.answerSnapshot,
    row: entry.row,
    col: entry.col,
    direction: entry.direction,
    number: entry.number,
  }));

  const placedEntries = puzzle.entries.map((entry) => ({
    id: entry.id,
    wordId: entry.wordId,
    answerSnapshot: entry.answerSnapshot,
    hintId: entry.hintId,
    hintSnapshot: entry.hintSnapshot,
    hintText: entry.hint?.text ?? null,
    hintType: entry.hint?.type ?? null,
    hintStatus: entry.hint?.status ?? null,
    row: entry.row,
    col: entry.col,
    direction: entry.direction,
    number: entry.number,
    availableHints: entry.word.hints.map((hint) => ({
      id: hint.id,
      text: hint.text,
      status: hint.status,
      type: hint.type,
      difficulty: hint.difficulty,
    })),
  }));

  const clueEntries = puzzle.entries.map((entry) => ({
    id: entry.id,
    number: entry.number,
    direction: entry.direction,
    answerSnapshot: entry.answerSnapshot,
    hintSnapshot: entry.hintSnapshot,
    hintText: entry.hint?.text ?? null,
  }));

  const missingHintCount = placedEntries.filter(
    (entry) => !entry.hintId && !entry.hintSnapshot,
  ).length;

  return (
    <AdminPage
      header={
        <div className="mb-3 border-b border-print-ink/10 pb-3">
          <AdminBreadcrumb
            items={[
              { label: "Pussel", href: "/admin/puzzles" },
              { label: puzzle.title },
            ]}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-print-ink">
                {puzzle.title}
              </h1>
              <p className="mt-1 text-sm text-print-muted">
                {PUZZLE_STATUS_LABELS[puzzle.status]} · {puzzle.width}×{puzzle.height} ·{" "}
                {puzzle.entries.length} ord
                {missingHintCount > 0
                  ? ` · ${missingHintCount} saknar nyckel`
                  : ""}{" "}
                · {PUZZLE_TYPE_LABELS[puzzle.type]}
              </p>
            </div>
            <AdminLinkButton href="/admin/puzzles" variant="secondary">
              Tillbaka
            </AdminLinkButton>
          </div>
        </div>
      }
    >
      <FeedbackMessage error={query.error} success={query.success} />

      {query.generated === "1" ? (
        <PuzzleGenerationReport
          themeName={query.genTheme ?? null}
          candidateCount={Number(query.genCandidates ?? 0)}
          placedCount={Number(query.genPlaced ?? 0)}
          failedCount={Number(query.genFailed ?? 0)}
          skippedCount={Number(query.genSkipped ?? 0)}
          rejectedCollisions={Number(query.genRejectedCollisions ?? 0)}
          rejectedSideWords={Number(query.genRejectedSideWords ?? 0)}
          rejectedBlockPatterns={Number(query.genRejectedBlockPatterns ?? 0)}
          blockedCount={Number(query.genBlocked ?? 0)}
          letterCellCount={Number(query.genLetterCells ?? 0)}
          utilizationRate={Number(query.genUtilization ?? 0)}
          crossingCount={Number(query.genCrossings ?? 0)}
          attemptCount={Number(query.genAttempts ?? 0)}
          bestScore={Number(query.genBestScore ?? 0)}
          shortWordCount={Number(query.genShortWords ?? 0)}
          mediumWordCount={Number(query.genMediumWords ?? 0)}
          longWordCount={Number(query.genLongWords ?? 0)}
          longestWord={Number(query.genLongestWord ?? 0)}
          averageWordLength={Number(query.genAvgWordLength ?? 0)}
          themeScore={Number(query.genThemeScore ?? 0)}
          themeHitCount={Number(query.genThemeHits ?? 0)}
          emergencyWordCount={Number(query.genEmergencyWords ?? 0)}
          blockRatio={Number(query.genBlockRatio ?? 0)}
          gapsFilled={Number(query.genGapsFilled ?? 0)}
          openConnections={Number(query.genOpenConnections ?? 0)}
          blockClusters={Number(query.genBlockClusters ?? 0)}
          isolatedRegions={Number(query.genIsolatedRegions ?? 0)}
          optimizationImprovements={query.genOptimization ?? null}
          emptyCellsBlocked={Number(query.genEmptyBlocked ?? 0)}
          remainingEmptyCount={Number(query.genRemainingEmpty ?? 0)}
          finalValidationOk={query.genValidationOk === "1"}
          width={Number(query.genWidth ?? puzzle.width)}
          height={Number(query.genHeight ?? puzzle.height)}
          summaryNote={query.genSummary ?? null}
        />
      ) : null}

      <PuzzleEditorWorkspace
        puzzleId={puzzle.id}
        width={puzzle.width}
        height={puzzle.height}
        entries={gridEntries}
        placedEntries={placedEntries}
        blockedCells={puzzle.blockedCells.map((cell) => ({
          row: cell.row,
          col: cell.col,
        }))}
        clueEntries={clueEntries}
        words={words}
      />
    </AdminPage>
  );
}
