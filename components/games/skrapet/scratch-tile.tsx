'use client';

import { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const REVEAL_THRESHOLD = 0.42;
const BRUSH_RADIUS_RATIO = 0.11;
const CHECK_INTERVAL = 6;

type Point = { x: number; y: number };

function isEmojiClue(clue: string) {
  return clue.length <= 4 && /\p{Extended_Pictographic}/u.test(clue);
}

function drawScratchSurface(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = '#b5b5b5';
  ctx.fillRect(0, 0, width, height);

  const highlight = ctx.createRadialGradient(
    width * 0.2,
    height * 0.3,
    0,
    width * 0.2,
    height * 0.3,
    width * 0.55,
  );
  highlight.addColorStop(0, 'rgba(255,255,255,0.35)');
  highlight.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = highlight;
  ctx.fillRect(0, 0, width, height);

  const shadow = ctx.createRadialGradient(
    width * 0.8,
    height * 0.7,
    0,
    width * 0.8,
    height * 0.7,
    width * 0.45,
  );
  shadow.addColorStop(0, 'rgba(0,0,0,0.08)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  const stripeStep = 5;

  for (let offset = -height; offset < width + height; offset += stripeStep) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + height, height);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(17,17,17,0.55)';
  ctx.font = `900 ${Math.min(width, height) * 0.28}px ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', width / 2, height / 2);
}

function getScratchedRatio(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = ctx.getImageData(0, 0, width, height);
  let cleared = 0;
  let sampled = 0;

  for (let i = 3; i < data.length; i += 32) {
    sampled += 1;

    if (data[i] < 32) {
      cleared += 1;
    }
  }

  return sampled === 0 ? 0 : cleared / sampled;
}

type ScratchTileProps = {
  clue: string;
  revealed: boolean;
  index: number;
  onRevealed: (index: number) => void;
  disabled: boolean;
};

export function ScratchTile({ clue, revealed, index, onRevealed, disabled }: ScratchTileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isScratchingRef = useRef(false);
  const hasTriggeredRevealRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const moveCountRef = useRef(0);
  const layoutRef = useRef({ width: 0, height: 0, dpr: 1, brushRadius: 16 });

  const isEmoji = isEmojiClue(clue);

  const setupCanvas = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas || revealed) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutRef.current = {
      width,
      height,
      dpr,
      brushRadius: Math.max(10, Math.min(width, height) * BRUSH_RADIUS_RATIO),
    };

    drawScratchSurface(ctx, width, height);
    moveCountRef.current = 0;
    lastPointRef.current = null;
  }, [revealed]);

  useEffect(() => {
    setupCanvas();

    const container = containerRef.current;

    if (!container || revealed) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setupCanvas();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [revealed, setupCanvas]);

  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const eraseAt = useCallback((point: Point) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const { brushRadius } = layoutRef.current;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(point.x, point.y, brushRadius, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const eraseBetween = useCallback(
    (from: Point, to: Point) => {
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      const { brushRadius } = layoutRef.current;
      const steps = Math.max(1, Math.ceil(distance / (brushRadius * 0.45)));

      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        eraseAt({
          x: from.x + (to.x - from.x) * t,
          y: from.y + (to.y - from.y) * t,
        });
      }
    },
    [eraseAt],
  );

  const maybeReveal = useCallback(() => {
    if (hasTriggeredRevealRef.current || revealed || disabled) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const ratio = getScratchedRatio(ctx, canvas.width, canvas.height);

    if (ratio >= REVEAL_THRESHOLD) {
      hasTriggeredRevealRef.current = true;
      onRevealed(index);
    }
  }, [disabled, index, onRevealed, revealed]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled || revealed || hasTriggeredRevealRef.current) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      isScratchingRef.current = true;

      const point = getCanvasPoint(event.clientX, event.clientY);

      if (!point) {
        return;
      }

      lastPointRef.current = point;
      eraseAt(point);
      moveCountRef.current += 1;
      maybeReveal();
    },
    [disabled, eraseAt, getCanvasPoint, maybeReveal, revealed],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isScratchingRef.current || disabled || revealed || hasTriggeredRevealRef.current) {
        return;
      }

      event.preventDefault();

      const point = getCanvasPoint(event.clientX, event.clientY);

      if (!point) {
        return;
      }

      if (lastPointRef.current) {
        eraseBetween(lastPointRef.current, point);
      } else {
        eraseAt(point);
      }

      lastPointRef.current = point;
      moveCountRef.current += 1;

      if (moveCountRef.current % CHECK_INTERVAL === 0) {
        maybeReveal();
      }
    },
    [disabled, eraseAt, eraseBetween, getCanvasPoint, maybeReveal, revealed],
  );

  const endScratch = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      isScratchingRef.current = false;
      lastPointRef.current = null;
      maybeReveal();
    },
    [maybeReveal],
  );

  return (
    <div
      ref={containerRef}
      aria-label={revealed ? `Ledtråd: ${clue}` : 'Skrapa ruta'}
      className={cn(
        'relative aspect-[5/4] w-full overflow-hidden border-2',
        revealed
          ? 'border-print-ink/20 bg-[#f3efe6]'
          : 'border-print-ink/30 bg-[#f3efe6] shadow-[inset_0_2px_8px_rgba(0,0,0,0.12)]',
      )}
    >
      <div className="flex size-full items-center justify-center px-2 py-2 text-center">
        {revealed ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className={cn(
              'leading-snug text-print-ink',
              isEmoji ? 'text-[clamp(1.75rem,7vw,2.25rem)]' : 'text-xs font-medium sm:text-sm',
            )}
          >
            {clue}
          </motion.span>
        ) : (
          <span
            className={cn(
              'leading-snug text-print-ink',
              isEmoji ? 'text-[clamp(1.75rem,7vw,2.25rem)]' : 'text-xs font-medium sm:text-sm',
            )}
          >
            {clue}
          </span>
        )}
      </div>

      {!revealed ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-pointer touch-none select-none"
          aria-hidden
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endScratch}
          onPointerCancel={endScratch}
          onLostPointerCapture={endScratch}
        />
      ) : null}
    </div>
  );
}
