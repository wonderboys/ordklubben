import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium tracking-[0.02em] text-accent-strong",
        className,
      )}
      {...props}
    />
  );
}
