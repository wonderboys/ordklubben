import * as React from "react";
import { cn } from "@/lib/utils";

type PageTitleProps = React.HTMLAttributes<HTMLElement> & {
  variant?: "page" | "compact" | "hero" | "card";
};

/** Route-level and content titles — Print Theme globally. */
export function PageTitle({
  className,
  variant = "page",
  ...props
}: PageTitleProps) {
  const sharedClassName = cn(
    "font-black uppercase text-print-ink leading-tight",
    variant === "page" && "text-3xl sm:text-5xl",
    variant === "compact" && "text-xl sm:text-2xl",
    variant === "hero" && "max-w-3xl text-3xl sm:text-5xl lg:text-6xl",
    variant === "card" && "text-lg sm:text-xl",
    className,
  );

  if (variant === "compact" || variant === "card") {
    return <p className={sharedClassName} {...props} />;
  }

  return <h1 className={sharedClassName} {...props} />;
}

type SectionTitleProps = React.HTMLAttributes<HTMLParagraphElement>;

export function SectionTitle({ className, ...props }: SectionTitleProps) {
  return <p className={cn("section-title", className)} {...props} />;
}

type BodyTextProps = React.HTMLAttributes<HTMLParagraphElement> & {
  variant?: "intro" | "card";
};

export function BodyText({
  className,
  variant = "intro",
  ...props
}: BodyTextProps) {
  return (
    <p
      className={cn(
        "text-sm font-normal leading-snug text-print-ink print-text sm:text-base",
        variant === "intro" && "max-w-2xl sm:leading-7",
        className,
      )}
      {...props}
    />
  );
}

type MonoLabelProps = React.HTMLAttributes<HTMLParagraphElement> & {
  muted?: boolean;
};

export function MonoLabel({
  className,
  muted = false,
  ...props
}: MonoLabelProps) {
  return (
    <p
      className={cn(
        "print-mono",
        muted ? "text-print-muted" : "text-print-ink",
        className,
      )}
      {...props}
    />
  );
}

type StatValueProps = React.HTMLAttributes<HTMLParagraphElement>;

export function StatValue({ className, ...props }: StatValueProps) {
  return (
    <p
      className={cn(
        "font-mono text-2xl font-medium tabular-nums leading-none tracking-[-0.02em] text-print-ink sm:text-3xl",
        className,
      )}
      {...props}
    />
  );
}
