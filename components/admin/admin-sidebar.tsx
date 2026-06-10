"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { PanelLeftClose, PanelRightOpen } from "lucide-react";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "adminSidebarCollapsed";

const BRAND_CLASSNAME =
  "font-mono text-[15px] font-bold uppercase leading-none tracking-[0.04em] text-print-ink";

function readCollapsed() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function subscribeCollapsed(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener("admin-sidebar-collapse", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("admin-sidebar-collapse", onStoreChange);
  };
}

function setCollapsedStorage(collapsed: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(collapsed));
  } catch {
    // localStorage may be unavailable
  }

  window.dispatchEvent(new Event("admin-sidebar-collapse"));
}

export function AdminSidebar() {
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    () => false,
  );

  const toggleCollapsed = () => {
    setCollapsedStorage(!collapsed);
  };

  return (
    <aside
      className={cn(
        "admin-sidebar relative z-30 flex w-full shrink-0 flex-col overflow-visible border-b border-print-ink/10 bg-print-surface transition-[width] duration-150 md:w-[var(--admin-sidebar-width)] md:border-b-0 md:border-r",
      )}
      data-collapsed={collapsed ? "true" : "false"}
    >
      <div className="admin-sidebar__header overflow-visible border-b border-print-ink/10">
        <Link
          href="/"
          className={cn(
            "admin-sidebar__brand-mobile block px-2.5 py-2 no-underline hover:opacity-80 md:hidden",
            BRAND_CLASSNAME,
          )}
        >
          Ordklubben
        </Link>

        <div className="admin-sidebar__header-inner hidden md:flex md:items-center md:gap-1.5 md:px-2 md:py-2.5">
          {collapsed ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="admin-sidebar__header-open relative inline-flex size-8 w-full items-center justify-center border border-transparent text-print-ink transition-colors hover:border-print-ink/15 hover:bg-print-ink/[0.03]"
              aria-expanded={false}
              aria-label="Öppna sidopanel"
            >
              <PanelRightOpen className="size-[18px] stroke-[1.75]" aria-hidden />
              <span
                className="admin-sidebar__tooltip admin-sidebar__tooltip--header"
                role="tooltip"
              >
                Öppna sidopanel
              </span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="admin-sidebar__header-brand min-w-0 flex-1 border-0 bg-transparent p-0 text-left transition-opacity hover:opacity-80"
                aria-label="Fäll ihop sidopanel"
              >
                <span className={cn("block truncate", BRAND_CLASSNAME)}>Ordklubben</span>
              </button>

              <button
                type="button"
                onClick={toggleCollapsed}
                className="admin-sidebar__header-collapse inline-flex size-8 shrink-0 items-center justify-center border border-transparent text-print-muted transition-colors hover:border-print-ink/15 hover:bg-print-ink/[0.03] hover:text-print-ink"
                aria-expanded
                aria-label="Fäll ihop sidopanel"
              >
                <PanelLeftClose className="size-4 stroke-[1.75]" aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="admin-sidebar__body flex min-h-0 flex-1 flex-col">
        <AdminSidebarNav collapsed={collapsed} />
      </div>
    </aside>
  );
}
