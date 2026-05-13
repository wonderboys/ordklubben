"use client";

import { cn } from "@/lib/utils";

type TimerProps = {
  timeLeft: number;
  duration: number;
};

export function Timer({ timeLeft, duration }: TimerProps) {
  const progress = Math.max(0, Math.min(100, (timeLeft / duration) * 100));
  const urgent = timeLeft <= 10;

  return (
    <div className="shell-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Tid</p>
          <p className={cn("text-3xl font-semibold tracking-[-0.05em]", urgent && "text-danger")}>
            {timeLeft}s
          </p>
        </div>
        <div className="flex-1">
          <div className="h-3 overflow-hidden rounded-full bg-surface-strong">
            <div
              className={cn(
                "h-full rounded-full bg-accent transition-[width,background-color] duration-500",
                urgent && "bg-danger",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
