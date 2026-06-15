'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type TimerProps = {
  timeLeft: number;
  duration: number;
  compact?: boolean;
};

export function Timer({ timeLeft, duration, compact = false }: TimerProps) {
  const progress = Math.max(0, Math.min(100, (timeLeft / duration) * 100));
  const urgent = timeLeft <= 10;

  if (compact) {
    return (
      <div className="flex w-full items-center gap-3 rounded-none border border-print-ink bg-print-surface px-3 py-2 shadow-none md:gap-3.5 md:px-4 md:py-3 md:shadow-[var(--print-shadow-soft)]">
        <p
          className={cn(
            'min-w-[3.25rem] shrink-0 tabular-nums print-mono normal-case leading-none tracking-normal md:min-w-[4.25rem]',
            urgent ? 'text-print-red' : 'text-print-green',
          )}
        >
          {timeLeft} sek
        </p>
        <div className="flex h-2 min-w-0 flex-1 items-center overflow-hidden rounded-none bg-print-bg md:h-2.5">
          <div
            className={cn(
              'h-full rounded-none transition-[width] duration-500',
              urgent ? 'bg-print-red' : 'bg-print-green',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="shell-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="print-mono text-print-muted">Tid</p>
          <motion.p
            animate={
              urgent ? { scale: [1, 1.03, 1], opacity: [1, 0.88, 1] } : { scale: 1, opacity: 1 }
            }
            transition={
              urgent ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }
            }
            className={cn('text-3xl font-black tabular-nums', urgent && 'text-print-red')}
          >
            {timeLeft}s
          </motion.p>
        </div>
        <div className="flex-1">
          <div className="h-3 overflow-hidden rounded-none bg-print-bg">
            <motion.div
              animate={urgent ? { opacity: [0.78, 1, 0.78] } : { opacity: 1 }}
              transition={
                urgent ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }
              }
              className={cn(
                'h-full rounded-none transition-[width,background-color] duration-500',
                urgent ? 'bg-print-red' : 'bg-print-green',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
