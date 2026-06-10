import {
  AdminActionGroup,
  AdminLinkButton,
  SelectInput,
} from "@/components/admin/admin-ui";
import {
  ADMIN_PAGE_SIZES,
  buildAdminListHref,
  getAdminPageCount,
  getAdminPageRange,
  type AdminPageSize,
} from "@/lib/content/admin-list";

export function AdminStatGrid({
  items,
}: {
  items: Array<{
    label: string;
    value: React.ReactNode;
  }>;
}) {
  return (
    <dl className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-sm border border-print-ink/10 bg-print-ink/[0.02] px-2.5 py-2"
        >
          <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-print-muted">
            {item.label}
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-print-ink">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

type AdminPaginationProps = {
  pathname: string;
  page: number;
  pageSize: AdminPageSize;
  total: number;
  query: Record<string, string | undefined>;
};

export function AdminPagination({
  pathname,
  page,
  pageSize,
  total,
  query,
}: AdminPaginationProps) {
  const pageCount = getAdminPageCount(total, pageSize);
  const currentPage = Math.min(page, pageCount);
  const { start, end } = getAdminPageRange(currentPage, pageSize, total);

  const baseQuery = {
    q: query.q,
    status: query.status,
    themeId: query.themeId,
    withoutHint: query.withoutHint,
    withoutTheme: query.withoutTheme,
    pageSize: String(pageSize),
  };

  const prevHref =
    currentPage > 1
      ? buildAdminListHref(pathname, { ...baseQuery, page: currentPage - 1 })
      : undefined;

  const nextHref =
    currentPage < pageCount
      ? buildAdminListHref(pathname, { ...baseQuery, page: currentPage + 1 })
      : undefined;

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-print-ink/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-print-muted">
        {total === 0 ? (
          "Inga träffar"
        ) : (
          <>
            Visar {start}–{end} av {total}
            <span className="mx-2 text-print-ink/20" aria-hidden="true">
              ·
            </span>
            Sida {currentPage} av {pageCount}
          </>
        )}
      </p>

      <AdminActionGroup>
        {prevHref ? (
          <AdminLinkButton href={prevHref} variant="secondary">
            Föregående
          </AdminLinkButton>
        ) : (
          <span className="admin-control inline-flex h-8 cursor-not-allowed items-center justify-center rounded-sm border border-print-ink/10 px-2.5 text-print-muted opacity-50">
            Föregående
          </span>
        )}
        {nextHref ? (
          <AdminLinkButton href={nextHref} variant="secondary">
            Nästa
          </AdminLinkButton>
        ) : (
          <span className="admin-control inline-flex h-8 cursor-not-allowed items-center justify-center rounded-sm border border-print-ink/10 px-2.5 text-print-muted opacity-50">
            Nästa
          </span>
        )}
      </AdminActionGroup>
    </div>
  );
}

export function AdminPageSizeSelect({
  name = "pageSize",
  defaultValue,
  className,
}: {
  name?: string;
  defaultValue: AdminPageSize;
  className?: string;
}) {
  return (
    <SelectInput name={name} defaultValue={String(defaultValue)} className={className}>
      {ADMIN_PAGE_SIZES.map((size) => (
        <option key={size} value={size}>
          {size} per sida
        </option>
      ))}
    </SelectInput>
  );
}
