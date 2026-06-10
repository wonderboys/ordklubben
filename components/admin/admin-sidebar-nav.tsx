"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Lightbulb,
  Puzzle,
  SearchCheck,
  Tags,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin/words",
    label: "Ord",
    icon: BookOpen,
    match: (path) => path.startsWith("/admin/words"),
  },
  {
    href: "/admin/themes",
    label: "Teman",
    icon: Tags,
    match: (path) => path.startsWith("/admin/themes"),
  },
  {
    href: "/admin/puzzles",
    label: "Pussel",
    icon: Puzzle,
    match: (path) => path.startsWith("/admin/puzzles"),
  },
  {
    href: "/admin/import",
    label: "Import",
    icon: Upload,
    match: (path) => path.startsWith("/admin/import"),
  },
  {
    href: "/admin/proposals",
    label: "Förslag",
    icon: Lightbulb,
    match: (path) => path.startsWith("/admin/proposals"),
  },
  {
    href: "/admin/review",
    label: "Granska",
    icon: SearchCheck,
    match: (path) =>
      path.startsWith("/admin/review") || path.startsWith("/admin/queue"),
  },
];

type AdminSidebarNavProps = {
  collapsed: boolean;
};

export function AdminSidebarNav({ collapsed }: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="admin-sidebar__nav flex gap-0.5 overflow-x-auto px-1.5 py-2 md:flex-col md:overflow-visible md:px-2 md:py-2"
      aria-label="Admin"
    >
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive = item.match(pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "admin-sidebar__link group relative flex h-10 min-w-0 shrink-0 items-center gap-2.5 border-l-[3px] px-2.5 text-sm no-underline transition-colors md:h-11 md:w-full",
              isActive
                ? "border-print-ink bg-print-ink/[0.045] font-semibold text-print-ink"
                : "border-transparent font-normal text-print-muted hover:bg-print-ink/[0.03] hover:text-print-ink",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={cn(
                "admin-sidebar__icon size-4 shrink-0 stroke-[1.75]",
                isActive ? "text-print-ink" : "text-current",
              )}
              aria-hidden
            />
            <span className="admin-sidebar__label truncate">{item.label}</span>
            {collapsed ? (
              <span className="admin-sidebar__tooltip" role="tooltip">
                {item.label}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
