import type { ContentStatus, Prisma } from '@prisma/client';

export const ADMIN_PAGE_SIZES = [25, 50, 100] as const;
export type AdminPageSize = (typeof ADMIN_PAGE_SIZES)[number];
export const DEFAULT_ADMIN_PAGE_SIZE: AdminPageSize = 50;

export type AdminPaginationState = {
  page: number;
  pageSize: AdminPageSize;
  skip: number;
};

export function parseAdminPageSize(value: string | undefined): AdminPageSize {
  const parsed = Number.parseInt(value ?? '', 10);
  return ADMIN_PAGE_SIZES.includes(parsed as AdminPageSize)
    ? (parsed as AdminPageSize)
    : DEFAULT_ADMIN_PAGE_SIZE;
}

export function parseAdminPage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function getAdminPagination(searchParams: {
  page?: string;
  pageSize?: string;
}): AdminPaginationState {
  const pageSize = parseAdminPageSize(searchParams.pageSize);
  const requestedPage = parseAdminPage(searchParams.page);

  return {
    pageSize,
    page: requestedPage,
    skip: (requestedPage - 1) * pageSize,
  };
}

export function getAdminPageCount(total: number, pageSize: number): number {
  return total === 0 ? 1 : Math.ceil(total / pageSize);
}

export function clampAdminPage(page: number, total: number, pageSize: number): number {
  return Math.min(Math.max(1, page), getAdminPageCount(total, pageSize));
}

export function getAdminPageRange(page: number, pageSize: number, total: number) {
  if (total === 0) {
    return { start: 0, end: 0 };
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return { start, end };
}

export function buildAdminListHref(
  pathname: string,
  params: Record<string, string | number | undefined | null>,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export type WordListFilters = {
  q?: string;
  status?: ContentStatus;
  themeId?: string;
  withoutHint?: boolean;
  withoutTheme?: boolean;
};

export function buildWordListWhere(filters: WordListFilters): Prisma.WordWhereInput {
  const query = filters.q?.trim() ?? '';

  return {
    AND: [
      filters.status ? { status: filters.status } : { status: { not: 'ARCHIVED' } },
      filters.themeId ? { themes: { some: { themeId: filters.themeId } } } : {},
      filters.withoutHint ? { hints: { none: {} } } : {},
      filters.withoutTheme ? { themes: { none: {} } } : {},
      query
        ? {
            OR: [
              { answer: { contains: query, mode: 'insensitive' } },
              { normalizedAnswer: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {},
    ],
  };
}

export function parseWordListFilters(
  searchParams: {
    q?: string;
    status?: string;
    themeId?: string;
    withoutHint?: string;
    withoutTheme?: string;
  },
  allowedStatuses: readonly ContentStatus[],
): WordListFilters {
  const status =
    searchParams.status && allowedStatuses.includes(searchParams.status as ContentStatus)
      ? (searchParams.status as ContentStatus)
      : undefined;

  return {
    q: searchParams.q?.trim() ?? '',
    status,
    themeId: searchParams.themeId?.trim() || undefined,
    withoutHint: searchParams.withoutHint === '1',
    withoutTheme: searchParams.withoutTheme === '1',
  };
}

export function buildWordListQuery(filters: WordListFilters) {
  return {
    q: filters.q || undefined,
    status: filters.status,
    themeId: filters.themeId,
    withoutHint: filters.withoutHint ? '1' : undefined,
    withoutTheme: filters.withoutTheme ? '1' : undefined,
  };
}

export function hasActiveWordListFilters(filters: WordListFilters, page = 1): boolean {
  return Boolean(
    filters.q ||
    filters.status ||
    filters.themeId ||
    filters.withoutHint ||
    filters.withoutTheme ||
    page > 1,
  );
}
