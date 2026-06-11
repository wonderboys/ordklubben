"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { GameLibraryPanel } from "@/components/layout/game-library-panel";
import { cn } from "@/lib/utils";

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
          aria-label={menuOpen ? "Stäng spelbibliotek" : "Öppna spelbibliotek"}
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
          aria-label="Stäng spelbibliotek"
          className="fixed inset-0 top-[47px] z-40 cursor-pointer bg-print-ink/10"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <GameLibraryPanel
        id={menuId}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </header>
  );
}
