"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const GAME_TOAST_DURATION_MS = 1300;

export type GameToastTone = "error" | "info" | "success" | "win";

export const GAME_TOAST_MESSAGES = {
  invalidWord: "Ordet finns inte i ordlistan",
  alreadyPlayed: "Du har redan spelat idag",
  greatJob: "Bra jobbat!",
  perfectSolution: "Perfekt lösning!",
  dailyComplete: "Dagens spel är avslutat",
} as const;

type GameToastState = {
  message: string;
  id: number;
  tone: GameToastTone;
};

const TONE_CLASSNAME: Record<GameToastTone, string> = {
  error:
    "border-[color-mix(in_srgb,var(--color-error)_88%,#000)] bg-[var(--color-error)] text-white shadow-[0_2px_8px_rgba(122,31,31,0.32)]",
  info: "border-print-ink/20 bg-[var(--color-info)] text-white shadow-[0_2px_8px_rgba(17,17,17,0.24)]",
  success:
    "border-[color-mix(in_srgb,var(--color-success)_88%,#000)] bg-[var(--color-success)] text-white shadow-[0_2px_8px_rgba(2,134,102,0.28)]",
  win: "border-[color-mix(in_srgb,var(--color-win)_80%,#000)] bg-[var(--color-win)] text-white shadow-[0_2px_8px_rgba(184,134,11,0.3)]",
};

export function useGameToast(durationMs = GAME_TOAST_DURATION_MS) {
  const [toast, setToast] = useState<GameToastState | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearToast = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, tone: GameToastTone = "info") => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      const id = Date.now();
      setToast({ message, id, tone });

      timeoutRef.current = window.setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
        timeoutRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return {
    toast,
    showToast,
    clearToast,
  };
}

type GameToastProps = {
  message: string | null;
  tone?: GameToastTone;
  toastId?: number;
  className?: string;
  /** inline = above relative parent; fixed-top-center = viewport top, outside game flow */
  placement?: "inline" | "fixed-top-center";
};

const PLACEMENT_CLASSNAME = {
  inline: "pointer-events-none absolute inset-x-0 -top-9 z-20 flex justify-center md:-top-10",
  "fixed-top-center":
    "pointer-events-none fixed top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 z-50 flex w-full max-w-[min(100%,24rem)] -translate-x-1/2 justify-center px-4",
} as const;

export function GameToast({
  message,
  tone = "info",
  toastId,
  className,
  placement = "inline",
}: GameToastProps) {
  return (
    <div
      className={cn(PLACEMENT_CLASSNAME[placement], className)}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        {message ? (
          <motion.p
            key={toastId ?? message}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{
              duration: 0.22,
              ease: "easeOut",
            }}
            className={cn(
              "max-w-[min(100%,20rem)] rounded-[4px] border px-3 py-2 text-center font-mono text-[0.8125rem] font-bold uppercase leading-tight tracking-[0.06em]",
              TONE_CLASSNAME[tone],
            )}
          >
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
