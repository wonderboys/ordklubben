'use client';

import { usePathname } from 'next/navigation';
import { MainNav } from '@/components/layout/main-nav';
import { SiteFooter } from '@/components/layout/site-footer';

export function AdminRouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <MainNav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <SiteFooter />
      </div>
    </div>
  );
}
