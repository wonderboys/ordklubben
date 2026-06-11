import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BodyText, PageTitle } from "@/components/ui/typography";
import type { GameStatus } from "@/lib/games/registry";

type GameCardProps = {
  href: string;
  title: string;
  description: string;
  status: GameStatus;
  badgeLabel: string;
};

export function GameCard({ href, title, description, status, badgeLabel }: GameCardProps) {
  const isPlayable = status === "playable";

  return (
    <Link href={href} className="group">
      <Card className="h-full transition-transform duration-300 sm:group-hover:-translate-y-1">
        <CardContent className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <PageTitle variant="card">{title}</PageTitle>
              <BodyText variant="card">{description}</BodyText>
            </div>
            <Badge variant={isPlayable ? "green" : "default"} className="shrink-0">
              {badgeLabel}
            </Badge>
          </div>
          <div className="mt-auto flex items-center gap-2 text-sm font-black uppercase text-print-green">
            Spela
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
