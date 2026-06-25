export const STOCKHOLM_TIME_ZONE = 'Europe/Stockholm';

/**
 * Daily editions are keyed by Stockholm calendar date (YYYY-MM-DD).
 * publishAt is stored as UTC midnight for that same calendar date so seeds stay
 * deterministic; runtime matches editions by Stockholm dayKey, not clock time.
 */
export function formatStockholmDayKey(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: STOCKHOLM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function compareStockholmDayKeys(a: string, b: string): number {
  return a.localeCompare(b, 'sv-SE');
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function createDailyEditionPublishAt(referenceDate: Date): Date {
  return new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

export function createDailyEditionPublishAtForOffset(dayOffset: number, from = new Date()): Date {
  return createDailyEditionPublishAt(addUtcDays(from, dayOffset));
}

export function matchesStockholmDayKey(date: Date | null | undefined, dayKey: string): boolean {
  return Boolean(date && formatStockholmDayKey(date) === dayKey);
}
