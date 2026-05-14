"use client";

import { motion } from "framer-motion";
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
          <motion.p
            animate={
              urgent
                ? { scale: [1, 1.03, 1], opacity: [1, 0.88, 1] }
                : { scale: 1, opacity: 1 }
            }
            transition={
              urgent
                ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 }
            }
            className={cn("text-3xl font-semibold tracking-[-0.05em]", urgent && "text-danger")}
          >
            {timeLeft}s
          </motion.p>
        </div>
        <div className="flex-1">
          <div className="h-3 overflow-hidden rounded-full bg-surface-strong">
            <motion.div
              animate={urgent ? { opacity: [0.78, 1, 0.78] } : { opacity: 1 }}
              transition={
                urgent
                  ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.2 }
              }
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
