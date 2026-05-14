"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type LetterTileProps = {
  letter: string;
  state?: "idle" | "active" | "success" | "used";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "size-11 text-lg",
  md: "size-13 text-xl sm:size-14 sm:text-2xl",
  lg: "size-16 text-2xl sm:size-18 sm:text-3xl",
};

const stateClasses = {
  idle: "border-line bg-white text-ink",
  active: "border-accent/25 bg-accent-soft text-accent-strong",
  success: "border-success/20 bg-[#e2f5ee] text-success",
  used: "border-line bg-surface-strong text-muted",
};

export function LetterTile({
  letter,
  state = "idle",
  size = "md",
  className,
}: LetterTileProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[1.35rem] border font-semibold uppercase tracking-[0.02em] shadow-[0_10px_24px_rgba(24,38,31,0.06)] transition-colors duration-200",
        sizeClasses[size],
        stateClasses[state],
        className,
      )}
    >
      {letter}
    </motion.div>
  );
}
