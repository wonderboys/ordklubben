"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type LetterTileProps = {
  letter: string;
  state?:
    | "idle"
    | "active"
    | "selected"
    | "depleted"
    | "success"
    | "used"
    | "correct"
    | "present"
    | "absent";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  disableEntryAnimation?: boolean;
};

const sizeClasses = {
  xs: "size-10 text-base",
  sm: "size-11 text-lg",
  md: "size-13 text-xl sm:size-14 sm:text-2xl",
  lg: "size-16 text-2xl sm:size-18 sm:text-3xl",
};

const stateClasses = {
  idle: "border-print-ink bg-print-surface text-print-ink shadow-[var(--print-shadow-soft)]",
  active:
    "border-print-green bg-print-green-soft text-print-green shadow-none",
  selected:
    "border-print-green bg-print-green-soft text-print-green shadow-none",
  depleted:
    "border-print-green bg-print-tile-depleted text-print-green shadow-none",
  success:
    "border-print-green bg-print-feedback-success text-print-green shadow-none",
  used: "border-print-ink/20 bg-print-bg text-print-muted shadow-none",
  correct: "border-print-green bg-print-green text-white shadow-none",
  present:
    "border-print-yellow bg-print-yellow-soft text-print-ink shadow-none",
  absent: "border-print-ink/15 bg-print-bg text-print-muted shadow-none",
};

export function LetterTile({
  letter,
  state = "idle",
  size = "md",
  className,
  disableEntryAnimation = false,
}: LetterTileProps) {
  return (
    <motion.div
      layout={!disableEntryAnimation}
      initial={disableEntryAnimation ? false : { opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-none border font-black uppercase transition-colors duration-200 print-black",
        stateClasses[state],
        sizeClasses[size],
        className,
      )}
    >
      {letter}
    </motion.div>
  );
}
