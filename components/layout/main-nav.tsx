import Link from "next/link";
import { BookOpenText, ChartColumnBig, Flame, Grid2x2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/ordstorm", label: "Ordstorm", icon: Flame },
  { href: "/ladder", label: "Ladder", icon: BookOpenText },
  { href: "/connections", label: "Connections", icon: Grid2x2 },
  { href: "/stats", label: "Stats", icon: ChartColumnBig },
  { href: "/profile", label: "Profil", icon: UserRound },
];

export function MainNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-ink text-sm font-semibold text-canvas">
            OK
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-[-0.04em]">Ordklubben</span>
            <span className="text-xs uppercase tracking-[0.18em] text-muted">
              Svenska ordspel
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-full px-4 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
