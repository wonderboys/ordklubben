import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { MainNav } from "@/components/layout/main-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ordklubben",
    template: "%s | Ordklubben",
  },
  description:
    "Svenska ordspel med snabb, minimalistisk och mobilförst spelkänsla.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="print-theme min-h-full bg-print-bg text-print-ink print-raster-bg">
        <div className="relative min-h-screen overflow-x-hidden">
          <MainNav />
          <main className="mx-auto flex min-h-[calc(100vh-45px)] w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
