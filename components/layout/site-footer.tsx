import Link from 'next/link';

const footerLinks = [
  { href: '/om-ordklubben', label: 'Om Ordklubben' },
  { href: '/integritet', label: 'Integritet' },
  { href: '/personuppgiftspolicy', label: 'Personuppgiftspolicy' },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-print-ink/10 pt-4 pb-6 sm:mt-12 sm:pt-5 sm:pb-8">
      <nav aria-label="Sidfot" className="flex flex-wrap gap-x-5 gap-y-2">
        {footerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-print-muted transition-colors hover:text-print-ink"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
