import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type GameCardProps = {
  href: string;
  title: string;
  description: string;
  status: string;
};

export function GameCard({ href, title, description, status }: GameCardProps) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-transform duration-300 group-hover:-translate-y-1">
        <CardContent className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xl font-semibold tracking-[-0.04em]">{title}</p>
              <p className="mt-2 fine-text">{description}</p>
            </div>
            <Badge>{status}</Badge>
          </div>
          <div className="mt-auto flex items-center gap-2 text-sm font-medium text-accent">
            Spela
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
