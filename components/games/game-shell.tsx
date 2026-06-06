import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { BodyText, PageTitle } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type GameShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  mobileDescription?: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
};

export function GameShell({
  eyebrow,
  title,
  description,
  mobileDescription,
  children,
  className,
  headerClassName,
}: GameShellProps) {
  return (
    <section
      className={cn(
        "flex flex-1 flex-col gap-4 py-2 sm:gap-6 sm:py-8",
        className,
      )}
    >
      <div className={cn("max-w-2xl space-y-2 sm:space-y-3", headerClassName)}>
        <Badge>{eyebrow}</Badge>
        <div className="space-y-1 sm:space-y-2">
          <PageTitle>{title}</PageTitle>
          <BodyText className="max-w-xl sm:text-lg">
            {mobileDescription ? (
              <>
                <span className="sm:hidden">{mobileDescription}</span>
                <span className="hidden sm:inline">{description}</span>
              </>
            ) : (
              description
            )}
          </BodyText>
        </div>
      </div>
      {children}
    </section>
  );
}
