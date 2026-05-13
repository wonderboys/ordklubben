import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

type GameShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function GameShell({
  eyebrow,
  title,
  description,
  children,
}: GameShellProps) {
  return (
    <section className="flex flex-1 flex-col gap-6 py-6 sm:py-8">
      <div className="max-w-2xl space-y-3">
        <Badge>{eyebrow}</Badge>
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted sm:text-lg">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
