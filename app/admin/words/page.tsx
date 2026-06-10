import type { ContentStatus } from "@prisma/client";
import { AdminPageSizeSelect, AdminStatGrid } from "@/components/admin/admin-list-ui";
import { WordsBulkTable } from "@/components/admin/words-bulk-table";
import {
  AdminActionGroup,
  AdminFilterToolbar,
  AdminLinkButton,
  AdminPage,
  AdminPanel,
  DatabaseNotice,
  FeedbackMessage,
  SelectInput,
  SubmitButton,
  TextInput,
} from "@/components/admin/admin-ui";
import {
  buildAdminListHref,
  buildWordListQuery,
  buildWordListWhere,
  clampAdminPage,
  getAdminPagination,
  hasActiveWordListFilters,
  parseWordListFilters,
} from "@/lib/content/admin-list";
import { CONTENT_STATUSES, STATUS_LABELS } from "@/lib/content/constants";
import { getPrisma, isDatabaseConfigured } from "@/lib/db/prisma";

type SearchParams = Promise<{
  q?: string;
  status?: ContentStatus | "";
  themeId?: string;
  withoutHint?: string;
  withoutTheme?: string;
  page?: string;
  pageSize?: string;
  error?: string;
  success?: string;
}>;

export default async function AdminWordsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filters = parseWordListFilters(params, CONTENT_STATUSES);
  const pagination = getAdminPagination(params);
  const where = buildWordListWhere(filters);

  if (!isDatabaseConfigured()) {
    return (
      <AdminPage title="Ord">
        <DatabaseNotice />
      </AdminPage>
    );
  }

  const prisma = getPrisma();

  const [
    themes,
    total,
    approvedCount,
    draftCount,
    withoutHintCount,
    withoutThemeCount,
    withThemeCount,
  ] = await Promise.all([
    prisma.theme.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.word.count({ where }),
    prisma.word.count({ where: { ...where, status: "APPROVED" } }),
    prisma.word.count({ where: { ...where, status: "DRAFT" } }),
    prisma.word.count({ where: { ...where, hints: { none: {} } } }),
    prisma.word.count({ where: { ...where, themes: { none: {} } } }),
    prisma.word.count({ where: { ...where, themes: { some: {} } } }),
  ]);

  const page = clampAdminPage(pagination.page, total, pagination.pageSize);
  const skip = (page - 1) * pagination.pageSize;

  const words = await prisma.word.findMany({
    where,
    select: {
      id: true,
      answer: true,
      status: true,
      updatedAt: true,
      _count: {
        select: {
          hints: true,
          hintCandidates: true,
          themes: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { answer: "asc" }],
    skip,
    take: pagination.pageSize,
  });

  const listQuery = buildWordListQuery(filters);
  const filtersActive = hasActiveWordListFilters(filters, page);
  const returnTo = buildAdminListHref("/admin/words", {
    ...listQuery,
    page,
    pageSize: pagination.pageSize,
  });

  return (
    <AdminPage
      title="Ord"
      description="Sök, filtrera och massredigera ord i ordbanken."
      actions={
        <AdminActionGroup>
          <AdminLinkButton href="/admin/import" variant="secondary">
            Importera
          </AdminLinkButton>
          <AdminLinkButton href="/admin/words/new" variant="primary">
            Nytt ord
          </AdminLinkButton>
        </AdminActionGroup>
      }
    >
      <FeedbackMessage error={params.error} success={params.success} />

      <AdminPanel title="Ordlista">
        <form method="get">
          <AdminFilterToolbar>
            <TextInput
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder="Sök ord"
              className="min-w-48 flex-1"
            />
            <SelectInput name="status" defaultValue={filters.status ?? ""} className="min-w-40">
              <option value="">Alla statusar</option>
              {CONTENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </SelectInput>
            <SelectInput name="themeId" defaultValue={filters.themeId ?? ""} className="min-w-40">
              <option value="">Alla teman</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </SelectInput>
            <AdminPageSizeSelect defaultValue={pagination.pageSize} className="min-w-36" />
            <SubmitButton variant="secondary">Filtrera</SubmitButton>
            {filtersActive ? (
              <AdminLinkButton href="/admin/words" variant="tertiary">
                Rensa filter
              </AdminLinkButton>
            ) : null}
          </AdminFilterToolbar>
        </form>

        <AdminStatGrid
          items={[
            { label: "Totalt", value: total },
            { label: "Godkända", value: approvedCount },
            { label: "Utkast", value: draftCount },
            { label: "Saknar nyckel", value: withoutHintCount },
            { label: "Saknar tema", value: withoutThemeCount },
            { label: "Med tema", value: withThemeCount },
          ]}
        />

        <WordsBulkTable
          words={words.map((word) => ({
            id: word.id,
            answer: word.answer,
            status: word.status,
            updatedAt: word.updatedAt.toISOString(),
            hintCount: word._count.hints,
            candidateCount: word._count.hintCandidates,
            themeCount: word._count.themes,
          }))}
          themes={themes.map((theme) => ({ id: theme.id, name: theme.name }))}
          returnTo={returnTo}
          page={page}
          pageSize={pagination.pageSize}
          total={total}
          listQuery={listQuery}
        />
      </AdminPanel>
    </AdminPage>
  );
}
