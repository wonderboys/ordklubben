import { notFound } from "next/navigation";
import type { HintCandidateStatus } from "@prisma/client";
import {
  AdminPage,
  DatabaseNotice,
  FeedbackMessage,
} from "@/components/admin/admin-ui";
import { WordDetailHeader } from "@/components/admin/word-detail/word-detail-header";
import { WordDetailView } from "@/components/admin/word-detail/word-detail-view";
import type { WordDetailData } from "@/components/admin/word-detail/types";
import { HINT_CANDIDATE_STATUSES } from "@/lib/content/constants";
import { normalizeWordDetailTab } from "@/lib/content/word-detail-path";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

type SearchParams = Promise<{
  tab?: string;
  candidateStatus?: HintCandidateStatus | "";
  error?: string;
  success?: string;
}>;

type Params = Promise<{
  id: string;
}>;

export default async function WordDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const feedback = await searchParams;
  const activeTab = normalizeWordDetailTab(feedback.tab);
  const candidateStatus =
    feedback.candidateStatus &&
    HINT_CANDIDATE_STATUSES.includes(feedback.candidateStatus)
      ? feedback.candidateStatus
      : undefined;

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Ord">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();
  const [word, availableThemes] = await Promise.all([
    prisma.word.findUnique({
      where: { id },
      include: {
        hints: { orderBy: [{ createdAt: "desc" }] },
        hintCandidates: { orderBy: [{ createdAt: "desc" }] },
        themes: {
          include: {
            theme: {
              select: {
                id: true,
                name: true,
                slug: true,
                _count: { select: { words: true } },
              },
            },
          },
          orderBy: { theme: { name: "asc" } },
        },
      },
    }),
    prisma.theme.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  if (!word) {
    notFound();
  }

  const wordData: WordDetailData = {
    id: word.id,
    answer: word.answer,
    normalizedAnswer: word.normalizedAnswer,
    length: word.length,
    language: word.language,
    status: word.status,
    difficulty: word.difficulty,
    crosswordScore: word.crosswordScore,
    notes: word.notes,
    createdAt: word.createdAt,
    updatedAt: word.updatedAt,
    hints: word.hints,
    hintCandidates: word.hintCandidates,
    themes: word.themes.map(({ theme }) => ({
      theme: {
        id: theme.id,
        name: theme.name,
        slug: theme.slug,
        wordCount: theme._count.words,
      },
    })),
  };

  return (
    <AdminPage header={<WordDetailHeader word={wordData} />}>
      <FeedbackMessage error={feedback.error} success={feedback.success} />
      <WordDetailView
        word={wordData}
        availableThemes={availableThemes}
        activeTab={activeTab}
        candidateStatus={candidateStatus}
      />
    </AdminPage>
  );
}
