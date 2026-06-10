"use client";

import { usePathname } from "next/navigation";
import { MainNav } from "@/components/layout/main-nav";

export function AdminRouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <MainNav />
      <main className="mx-auto flex min-h-[calc(100vh-45px)] w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
