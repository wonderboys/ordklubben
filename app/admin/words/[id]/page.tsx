import { notFound } from "next/navigation";
import type { HintCandidateStatus, LexicalEntryType, WordRelationType } from "@prisma/client";
import {
  AdminPage,
  DatabaseNotice,
  FeedbackMessage,
} from "@/components/admin/admin-ui";
import { WordDetailHeader } from "@/components/admin/word-detail/word-detail-header";
import { WordDetailView } from "@/components/admin/word-detail/word-detail-view";
import type { WordDetailData } from "@/components/admin/word-detail/types";
import {
  HINT_CANDIDATE_STATUSES,
  LEXICAL_ENTRY_TYPES,
  WORD_RELATION_TYPES,
} from "@/lib/content/constants";
import { normalizeWordDetailTab } from "@/lib/content/word-detail-path";
import { parseWordInflections } from "@/lib/content/word-language";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

type SearchParams = Promise<{
  tab?: string;
  candidateStatus?: HintCandidateStatus | "";
  entryType?: LexicalEntryType | "";
  relationType?: WordRelationType | "";
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
  const relationType =
    feedback.relationType && WORD_RELATION_TYPES.includes(feedback.relationType)
      ? feedback.relationType
      : undefined;

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Ord">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();
  const [word, availableThemes, wordPickerWords] = await Promise.all([
    prisma.word.findUnique({
      where: { id },
      include: {
        languageData: true,
        hints: { orderBy: [{ createdAt: "desc" }] },
        hintCandidates: { orderBy: [{ createdAt: "desc" }] },
        lexicalEntries: { orderBy: [{ type: "asc" }, { value: "asc" }] },
        rebusEntries: { orderBy: [{ createdAt: "desc" }] },
        mediaAssets: { orderBy: [{ createdAt: "desc" }] },
        outgoingRelations: {
          include: {
            targetWord: {
              select: {
                id: true,
                answer: true,
              },
            },
          },
          orderBy: [{ relationType: "asc" }, { targetWord: { answer: "asc" } }],
        },
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
            rebusEntries: true,
            mediaAssets: true,
            outgoingRelations: true,
          },
        },
      },
    }),
    prisma.theme.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.word.findMany({
      where: {
        id: { not: id },
        status: { not: "ARCHIVED" },
      },
      orderBy: { answer: "asc" },
      select: {
        id: true,
        answer: true,
        length: true,
        status: true,
      },
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
    difficulty: word.difficulty,
    crosswordScore: word.crosswordScore,
    notes: word.notes,
    createdAt: word.createdAt,
    updatedAt: word.updatedAt,
    languageData: word.languageData
      ? {
          partOfSpeech: word.languageData.partOfSpeech,
          gender: word.languageData.gender,
          lemma: word.languageData.lemma,
          pronunciation: word.languageData.pronunciation,
          inflections: parseWordInflections(word.languageData.inflections),
        }
      : null,
    hints: word.hints,
    hintCandidates: word.hintCandidates,
    lexicalEntries: word.lexicalEntries,
    rebusEntries: word.rebusEntries,
    mediaAssets: word.mediaAssets,
    relations: word.outgoingRelations.map((relation) => ({
      id: relation.id,
      relationType: relation.relationType,
      source: relation.source,
      sourceReference: relation.sourceReference,
      notes: relation.notes,
      createdAt: relation.createdAt,
      updatedAt: relation.updatedAt,
      targetWord: relation.targetWord,
    })),
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
      rebusEntries: word._count.rebusEntries,
      mediaAssets: word._count.mediaAssets,
      wordRelations: word._count.outgoingRelations,
    },
  };

  return (
    <AdminPage header={<WordDetailHeader word={wordData} />}>
      <FeedbackMessage error={feedback.error} success={feedback.success} />
      <WordDetailView
        word={wordData}
        availableThemes={availableThemes}
        wordPickerWords={wordPickerWords}
        activeTab={activeTab}
        candidateStatus={candidateStatus}
        entryType={entryType}
        relationType={relationType}
      />
    </AdminPage>
  );
}
