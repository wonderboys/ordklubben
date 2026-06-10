"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/words", label: "Ord", match: (path: string) => path.startsWith("/admin/words") },
  { href: "/admin/themes", label: "Teman", match: (path: string) => path.startsWith("/admin/themes") },
  { href: "/admin/puzzles", label: "Pussel", match: (path: string) => path.startsWith("/admin/puzzles") },
  { href: "/admin/import", label: "Import", match: (path: string) => path.startsWith("/admin/import") },
  { href: "/admin/proposals", label: "Förslag", match: (path: string) => path.startsWith("/admin/proposals") },
  {
    href: "/admin/queue",
    label: "Arbetskö",
    match: (path: string) => path.startsWith("/admin/queue"),
  },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-print-ink/10 bg-print-surface md:w-52 md:border-b-0 md:border-r">
      <div className="border-b border-print-ink/10 px-4 py-3">
        <Link href="/" className="text-sm font-semibold text-print-ink no-underline hover:underline">
          Ordklubben
        </Link>
        <p className="mt-0.5 text-xs text-print-muted">Contentadmin</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 py-2 md:flex-col md:overflow-visible md:px-2 md:py-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.match(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap px-3 py-2 text-sm no-underline transition-colors md:whitespace-normal",
                isActive
                  ? "bg-print-ink/5 font-medium text-print-ink"
                  : "text-print-muted hover:bg-print-ink/[0.03] hover:text-print-ink",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
