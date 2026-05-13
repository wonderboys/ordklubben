import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { MainNav } from "@/components/layout/main-nav";
import "./globals.css";

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

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
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas text-ink">
        <div className="relative min-h-screen overflow-x-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(212,233,229,0.9),_transparent_60%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(circle_at_bottom,_rgba(247,201,72,0.12),_transparent_65%)]" />
          <MainNav />
          <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
