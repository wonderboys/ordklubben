import type { Metadata } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { AdminRouteShell } from '@/components/admin/admin-route-shell';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Ordklubben',
    template: '%s | Ordklubben',
  },
  description: 'Svenska ordspel med snabb, minimalistisk och mobilförst spelkänsla.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="print-theme min-h-full bg-print-bg text-print-ink print-raster-bg">
        <AdminRouteShell>{children}</AdminRouteShell>
      </body>
    </html>
  );
}
