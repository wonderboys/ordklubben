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
  hideEyebrowOnMobile?: boolean;
  compactMobile?: boolean;
};

export function GameShell({
  eyebrow,
  title,
  description,
  mobileDescription,
  children,
  className,
  headerClassName,
  hideEyebrowOnMobile = false,
  compactMobile = false,
}: GameShellProps) {
  return (
    <section
      className={cn(
        "flex flex-1 flex-col gap-4 py-2 sm:gap-6 sm:py-8",
        compactMobile && "max-md:gap-2 max-md:py-1",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-2xl space-y-3 sm:space-y-4 md:mx-auto md:text-center",
          compactMobile && "max-md:space-y-1",
          headerClassName,
        )}
      >
        <Badge
          variant="eyebrow"
          className={cn(
            "md:mx-auto",
            hideEyebrowOnMobile && "max-md:hidden",
          )}
        >
          {eyebrow}
        </Badge>
        <div className="space-y-1 sm:space-y-2">
          <PageTitle
            className={cn(compactMobile && "max-md:text-2xl max-md:leading-none")}
          >
            {title}
          </PageTitle>
          <BodyText
            className={cn(
              "max-w-xl sm:text-lg md:mx-auto",
              compactMobile && "max-md:text-xs max-md:leading-snug",
            )}
          >
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
