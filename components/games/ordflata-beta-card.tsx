import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BodyText, PageTitle } from '@/components/ui/typography';

type OrdflataBetaCardProps = {
  href: string;
  title: string;
  description: string;
  primaryBadge: string;
  secondaryBadge: string;
  ctaLabel: string;
};

export function OrdflataBetaCard({
  href,
  title,
  description,
  primaryBadge,
  secondaryBadge,
  ctaLabel,
}: OrdflataBetaCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="transition-transform duration-300 sm:group-hover:-translate-y-1">
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{primaryBadge}</Badge>
            <Badge variant="green">{secondaryBadge}</Badge>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <PageTitle variant="card">{title}</PageTitle>
              <BodyText variant="card" className="max-w-2xl">
                {description}
              </BodyText>
            </div>
            <div className="flex items-center gap-2 text-sm font-black uppercase text-print-green">
              {ctaLabel}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
