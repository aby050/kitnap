export type BedtimeWindow = { enabled: boolean; start: string; end: string };

/** Matches the "Sleep Mode" schedule shown in ScheduleEditorScreen so the
 *  two stay conceptually the same window until they're wired together. */
export const DEFAULT_BEDTIME: BedtimeWindow = { enabled: true, start: '22:00', end: '07:00' };

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

/** Handles the overnight case (start > end, e.g. 22:00 → 07:00) by wrapping
 *  across midnight instead of treating it as an always-false empty range. */
export function isWithinBedtime(now: Date, window: BedtimeWindow = DEFAULT_BEDTIME): boolean {
  if (!window.enabled) return false;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(window.start);
  const end = toMinutes(window.end);
  if (start === end) return false;
  if (start < end) return nowMin >= start && nowMin < end;
  return nowMin >= start || nowMin < end;
}

export function bedtimeLine(window: BedtimeWindow = DEFAULT_BEDTIME): string {
  return `It's past your bedtime (${window.start}). Heavy phone use this late costs you tomorrow.`;
}
