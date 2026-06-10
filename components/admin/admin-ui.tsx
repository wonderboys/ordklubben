import Link from "next/link";
import type { ContentStatus, HintCandidateStatus } from "@prisma/client";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { HINT_CANDIDATE_STATUS_LABELS, STATUS_LABELS } from "@/lib/content/constants";

/** 14px utility class — see `admin-control` in globals.css */
const adminControlClass = cn(
  "admin-control h-8 rounded-sm border border-print-ink/15 bg-print-surface px-2.5 font-normal text-print-ink outline-none transition-[border-color,box-shadow] focus:border-print-green focus:ring-2 focus:ring-print-green/15",
);

const adminButtonBaseClass = cn(
  "admin-control inline-flex h-8 cursor-pointer items-center justify-center rounded-sm px-2.5 font-sans font-medium no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50",
);

export const adminButtonPrimaryClass = cn(
  adminButtonBaseClass,
  "border border-print-ink bg-print-ink text-print-surface hover:bg-print-ink/90",
);

export const adminButtonSecondaryClass = cn(
  adminButtonBaseClass,
  "border border-print-ink/15 bg-print-surface text-print-ink hover:bg-print-ink/[0.04]",
);

export const adminButtonTertiaryClass = cn(
  adminButtonBaseClass,
  "px-1.5 text-print-muted hover:bg-print-ink/[0.04] hover:text-print-ink",
);

export function AdminBreadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Brödsmula" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-print-muted">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link href={item.href} className="no-underline hover:text-print-ink hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-print-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function AdminPage({
  title,
  description,
  actions,
  header,
  children,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 md:px-6 md:py-4">
      {header ?? (
        <div className="mb-3 flex flex-col gap-2 border-b border-print-ink/10 pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <h1 className="text-lg font-semibold tracking-tight text-print-ink">{title}</h1>
            ) : null}
            {description ? (
              <p className="mt-1 max-w-2xl text-sm text-print-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <AdminActionGroup>{actions}</AdminActionGroup> : null}
        </div>
      )}
      <div className="space-y-5">{children}</div>
    </div>
  );
}

/** @deprecated Use AdminPage. */
export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <AdminPage title={title} description={description}>
      {children}
    </AdminPage>
  );
}

export function AdminPanel({
  title,
  children,
  action,
  footer,
  compact = false,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-sm border border-print-ink/10 bg-print-surface",
        footer ? "h-full" : null,
        className,
      )}
    >
      {title ? (
        <div className="flex items-center justify-between gap-3 px-3 pt-3 sm:px-4 sm:pt-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-print-muted">
            {title}
          </h2>
          {action}
        </div>
      ) : null}
      <div
        className={cn(
          "flex flex-1 flex-col",
          compact ? "px-3 pb-3 sm:px-4" : "px-3 pb-4 sm:px-4",
          title ? "pt-2" : "pt-3 sm:pt-4",
        )}
      >
        <div className="flex-1">{children}</div>
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </section>
  );
}

/** @deprecated Use AdminPanel. */
export function AdminCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <AdminPanel title={title} action={action}>
      {children}
    </AdminPanel>
  );
}

export function AdminSection({
  title,
  children,
  action,
  compact,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "border-t border-print-ink/10 first:border-t-0 first:pt-0",
        compact ? "space-y-2 pt-3" : "space-y-3 pt-4",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-print-muted">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function FeedbackMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) {
    return null;
  }

  return (
    <div
      className={cn(
        "border px-3 py-2 text-sm",
        error
          ? "border-print-red/30 bg-print-red-soft text-print-red"
          : "border-print-green/30 bg-print-green-soft text-print-green",
      )}
    >
      {error ?? success}
    </div>
  );
}

export function DatabaseNotice() {
  return (
    <div className="border border-print-yellow/40 bg-print-yellow-soft px-3 py-2 text-sm text-print-ink">
      `DATABASE_URL` saknas. Lägg till databaskopplingen för att använda adminvyerna.
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-print-ink">{label}</span>
      {children}
      {hint ? <span className="text-xs text-print-muted">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(adminControlClass, "w-full", props.className)} />;
}

export function FileInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "admin-control block w-full rounded-sm border border-print-ink/15 bg-print-surface px-2.5 py-2 font-normal text-print-ink file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-print-ink/15 file:bg-print-surface file:px-2.5 file:py-1.5 file:text-[14px] file:font-medium file:text-print-ink file:hover:bg-print-ink/[0.04]",
        props.className,
      )}
    />
  );
}

export function SelectInput({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <select
        {...props}
        className={cn(
          adminControlClass,
          "w-full appearance-none pr-8",
          props.multiple ? "pr-2.5" : null,
        )}
      />
      {props.multiple ? null : (
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-print-muted"
          strokeWidth={1.75}
        />
      )}
    </div>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "admin-control min-h-24 w-full rounded-sm border border-print-ink/15 bg-print-surface px-2.5 py-2 font-normal leading-normal text-print-ink outline-none transition-[border-color,box-shadow] focus:border-print-green focus:ring-2 focus:ring-print-green/15",
        props.className,
      )}
    />
  );
}

export function AdminActionGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function AdminToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-sm border border-print-ink/10 bg-print-ink/[0.02] p-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminToolbarSection({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label ? (
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.04em] text-print-muted">
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function AdminToolbarDivider() {
  return <div className="-mx-2.5 my-3 border-t border-print-ink/10" aria-hidden="true" />;
}

export function AdminFilterToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AdminToolbar className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>
      {children}
    </AdminToolbar>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  className: classNameProp,
  disabled,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "ghost" | "default" | "outline" | "accent";
  className?: string;
  disabled?: boolean;
}) {
  const resolvedVariant =
    variant === "default" || variant === "accent"
      ? "primary"
      : variant === "outline"
        ? "secondary"
        : variant === "ghost"
          ? "tertiary"
          : variant;

  const variantClass =
    resolvedVariant === "primary"
      ? adminButtonPrimaryClass
      : resolvedVariant === "secondary"
        ? adminButtonSecondaryClass
        : adminButtonTertiaryClass;

  return (
    <button type="submit" disabled={disabled} className={cn(variantClass, classNameProp)}>
      {children}
    </button>
  );
}

export function AdminToggleLabel({
  htmlFor,
  variant = "secondary",
  children,
  className,
}: {
  htmlFor: string;
  variant?: "primary" | "secondary" | "tertiary";
  children: React.ReactNode;
  className?: string;
}) {
  const variantClass =
    variant === "primary"
      ? adminButtonPrimaryClass
      : variant === "tertiary"
        ? adminButtonTertiaryClass
        : adminButtonSecondaryClass;

  return (
    <label htmlFor={htmlFor} className={cn(variantClass, className)}>
      {children}
    </label>
  );
}

export function AdminLinkButton({
  href,
  children,
  variant = "secondary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary";
}) {
  const className =
    variant === "primary"
      ? adminButtonPrimaryClass
      : variant === "tertiary"
        ? adminButtonTertiaryClass
        : adminButtonSecondaryClass;

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function AdminTextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(adminButtonTertiaryClass, className)}>
      {children}
    </Link>
  );
}

type AdminBadgeTone = "neutral" | "info" | "success" | "danger" | "warning";

const adminBadgeToneClass: Record<AdminBadgeTone, string> = {
  neutral: "border-print-ink/10 bg-print-ink/[0.04] text-print-muted",
  info: "border-print-ink/15 bg-print-surface text-print-ink",
  success: "border-print-green/20 bg-print-green-soft text-print-green",
  danger: "border-print-red/20 bg-print-red-soft text-print-red",
  warning: "border-print-yellow/30 bg-print-yellow-soft text-print-ink",
};

export function AdminStatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: AdminBadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-none",
        adminBadgeToneClass[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  const tone: AdminBadgeTone =
    status === "APPROVED" ? "success" : status === "REJECTED" ? "danger" : "neutral";

  return <AdminStatusBadge tone={tone}>{STATUS_LABELS[status]}</AdminStatusBadge>;
}

export function HintCandidateStatusBadge({
  status,
}: {
  status: HintCandidateStatus;
}) {
  const tone: AdminBadgeTone =
    status === "APPROVED"
      ? "success"
      : status === "REJECTED"
        ? "danger"
        : "warning";

  return (
    <AdminStatusBadge tone={tone}>{HINT_CANDIDATE_STATUS_LABELS[status]}</AdminStatusBadge>
  );
}

export function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-print-ink/10">
            {headers.map((header) => (
              <th
                key={header}
                className="px-2.5 py-2 text-xs font-medium uppercase tracking-[0.04em] text-print-muted"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:px-2.5 [&_td]:py-2">{children}</tbody>
      </table>
    </div>
  );
}

export function AdminBadgeList({
  items,
  emptyLabel,
}: {
  items: Array<{
    key: string;
    label: React.ReactNode;
    action?: React.ReactNode;
  }>;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-print-muted">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <div
          key={item.key}
          className="inline-flex items-center gap-1.5 rounded-sm border border-print-ink/15 bg-print-surface px-2 py-1 text-sm text-print-ink"
        >
          <span>{item.label}</span>
          {item.action}
        </div>
      ))}
    </div>
  );
}

export function AdminPanelEmpty({
  message,
  children,
}: {
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-print-muted">{message}</p>
      {children ? <div className="mt-3"><AdminActionGroup>{children}</AdminActionGroup></div> : null}
    </div>
  );
}

export function AdminEmptyState({
  message,
  children,
}: {
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-dashed border-print-ink/15 px-3 py-6 text-center">
      <p className="text-sm text-print-muted">{message}</p>
      {children ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}

export function AdminDefinitionList({
  items,
}: {
  items: Array<{
    label: string;
    value: React.ReactNode;
  }>;
}) {
  return (
    <dl className="space-y-2 text-sm">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[minmax(7rem,auto)_1fr] items-baseline gap-x-4"
        >
          <dt className="text-print-muted">{item.label}</dt>
          <dd className="min-w-0 text-print-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AdminMetaGrid({
  items,
}: {
  items: Array<{
    label: string;
    value: React.ReactNode;
  }>;
}) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="border border-print-ink/10 px-2.5 py-2">
          <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-print-muted">
            {item.label}
          </dt>
          <dd className="mt-0.5 text-sm text-print-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AdminCollapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="rounded-sm border border-print-ink/10 bg-print-surface"
      open={defaultOpen}
    >
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-print-ink marker:text-print-muted">
        {title}
      </summary>
      <div className="border-t border-print-ink/10 p-3">{children}</div>
    </details>
  );
}
