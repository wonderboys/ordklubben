"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { games } from "@/lib/games/registry";
import { cn } from "@/lib/utils";

const navItems = [
  ...games.map((game) => ({ href: game.href, label: game.title })),
  { href: "/profile", label: "Profil" },
];

export function MainNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="relative sticky top-0 z-50 bg-print-bg">
      <div className="mx-auto flex h-[45px] w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className={cn(
            "cursor-pointer font-mono text-[15px] font-bold uppercase leading-none tracking-[0.04em] text-print-ink",
          )}
          onClick={() => setMenuOpen(false)}
        >
          Ordklubben
        </Link>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? "Stäng meny" : "Öppna meny"}
          className="flex size-10 cursor-pointer items-center justify-center text-print-ink"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <span className="relative block size-5" aria-hidden="true">
              <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
              <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current" />
            </span>
          ) : (
            <span className="flex w-5 flex-col gap-[5px]" aria-hidden="true">
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
            </span>
          )}
        </button>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-[46px] h-px bg-print-ink/10"
        aria-hidden="true"
      />

      {menuOpen ? (
        <button
          type="button"
          aria-label="Stäng meny"
          className="fixed inset-0 top-[47px] z-40 cursor-pointer bg-print-ink/10"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <nav
        id={menuId}
        aria-hidden={!menuOpen}
        className={cn(
          "absolute inset-x-0 top-[47px] z-50 border-b border-print-ink/10 bg-print-bg",
          !menuOpen && "hidden",
        )}
      >
        <ul className="mx-auto flex w-full max-w-6xl flex-col px-4 py-2 sm:px-6 lg:px-8">
          {navItems.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="block cursor-pointer py-3 text-sm font-normal leading-snug text-print-ink max-md:print-text"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
