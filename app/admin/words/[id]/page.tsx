import { notFound } from "next/navigation";
import type { HintCandidateStatus, LexicalEntryType } from "@prisma/client";
import {
  AdminPage,
  DatabaseNotice,
  FeedbackMessage,
} from "@/components/admin/admin-ui";
import { WordDetailHeader } from "@/components/admin/word-detail/word-detail-header";
import { WordDetailView } from "@/components/admin/word-detail/word-detail-view";
import type { WordDetailData } from "@/components/admin/word-detail/types";
import { HINT_CANDIDATE_STATUSES, LEXICAL_ENTRY_TYPES } from "@/lib/content/constants";
import { normalizeWordDetailTab } from "@/lib/content/word-detail-path";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

type SearchParams = Promise<{
  tab?: string;
  candidateStatus?: HintCandidateStatus | "";
  entryType?: LexicalEntryType | "";
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
  const entryType =
    feedback.entryType && LEXICAL_ENTRY_TYPES.includes(feedback.entryType)
      ? feedback.entryType
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
        lexicalEntries: { orderBy: [{ type: "asc" }, { value: "asc" }] },
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
        _count: {
          select: {
            hints: true,
            hintCandidates: true,
            themes: true,
            puzzleEntries: true,
            lexicalEntries: true,
          },
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
    source: word.source,
    sourceReference: word.sourceReference,
    partOfSpeech: word.partOfSpeech,
    difficulty: word.difficulty,
    crosswordScore: word.crosswordScore,
    notes: word.notes,
    createdAt: word.createdAt,
    updatedAt: word.updatedAt,
    hints: word.hints,
    hintCandidates: word.hintCandidates,
    lexicalEntries: word.lexicalEntries,
    themes: word.themes.map(({ theme }) => ({
      theme: {
        id: theme.id,
        name: theme.name,
        slug: theme.slug,
        wordCount: theme._count.words,
      },
    })),
    relationCounts: {
      hints: word._count.hints,
      hintCandidates: word._count.hintCandidates,
      themes: word._count.themes,
      puzzleEntries: word._count.puzzleEntries,
      lexicalEntries: word._count.lexicalEntries,
    },
  };

  return (
    <AdminPage header={<WordDetailHeader word={wordData} />}>
      <FeedbackMessage error={feedback.error} success={feedback.success} />
      <WordDetailView
        word={wordData}
        availableThemes={availableThemes}
        activeTab={activeTab}
        candidateStatus={candidateStatus}
        entryType={entryType}
      />
    </AdminPage>
  );
}
