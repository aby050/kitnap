import { Schedule } from './store';

/**
 * Parses an "HH:MM" string into minutes-since-midnight.
 * Returns NaN if the string is malformed so callers can guard with
 * Number.isFinite() rather than try/catch.
 */
function parseHHMM(s: string): number {
  const parts = s.split(':');
  if (parts.length !== 2) return NaN;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  if (h < 0 || h > 23 || m < 0 || m > 59) return NaN;
  return h * 60 + m;
}

/** Day-of-week index (0 = Sunday … 6 = Saturday) → short name. */
const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Returns true when `schedule` is active at `now`.
 *
 * Day matching is intentionally loose: "Every day" and "Mon–Fri" are the
 * only two values the ScheduleEditorScreen currently writes, so we match
 * those literally and fall back to "active" for anything else rather than
 * silently dropping a schedule the user configured.
 *
 * Midnight-crossing windows (e.g. 22:00–07:00) are handled by checking
 * whether the current minute-of-day falls *outside* the gap between end
 * and start, which is equivalent to being inside the window that wraps
 * past midnight.
 */
function isScheduleActive(schedule: Schedule, now: Date): boolean {  const startMin = parseHHMM(schedule.start);
  const endMin = parseHHMM(schedule.end);
  if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) return false;

  // Day-of-week check.
  const dow = now.getDay(); // 0 = Sunday
  const dayName = DOW_NAMES[dow];
  const days = schedule.days ?? 'Every day';
  const isWeekday = dow >= 1 && dow <= 5;

  const dayMatches = (() => {
    if (days === 'Every day') return true;
    if (days === 'Mon–Fri' || days === 'Mon-Fri' || days === 'Weekdays') return isWeekday;
    if (days === 'Weekends') return dow === 0 || dow === 6;
    // Comma-separated short names: "Mon,Wed,Fri"
    if (days.includes(',')) return days.split(',').map((d) => d.trim()).includes(dayName);
    // Single day name
    return days.trim() === dayName;
  })();

  if (!dayMatches) return false;

  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (startMin < endMin) {
    // Normal window: e.g. 09:00–17:00
    return nowMin >= startMin && nowMin < endMin;
  } else if (startMin > endMin) {
    // Midnight-crossing window: e.g. 22:00–07:00
    // Active when nowMin >= startMin OR nowMin < endMin.
    return nowMin >= startMin || nowMin < endMin;
  } else {
    // start === end: treat as "always active" (a 24-hour block).
    return true;
  }
}

/**
 * Returns the effective set of blocked packages at `now`.
 *
 * The base blocklist is *always* enforced — schedules never narrow it. They are
 * lockdown windows (see `activeLockdown`), not blocking windows, so there is
 * nothing here for them to contribute.
 *
 * This used to take a `schedules` argument and loop over it doing nothing: the
 * loop body was entirely comments, waiting on a per-schedule package list the
 * data model never grew. Callers got the illusion of time-windowed blocking
 * from a function that returned the same set at every hour of the day.
 *
 * The return value is deduplicated and stable (sorted) so callers can compare
 * it with a previous value using a simple string join.
 */
export function effectiveBlockedPackages(blockedPackages: string[]): string[] {
  return [...new Set(blockedPackages)].sort();
}

/**
 * The schedule currently in force, or null.
 *
 * A schedule is a **lockdown window**: while one is active the blocklist stays
 * exactly as it is, but every way out closes — no bailout, no emergency access,
 * no daily unlock. That is the only reading of a `{start, end, days}` record
 * that makes it stricter rather than looser. Treating schedules as the *only*
 * times blocking applies would mean nothing is blocked outside them, which is
 * the opposite of what this app promises.
 *
 * Returns the schedule rather than a boolean so callers can name it in the
 * copy — "Sleep Mode is on until 07:00" is an explanation; "you can't do that"
 * is a dead end.
 */
export function activeLockdown(schedules: Schedule[], now: Date = new Date()): Schedule | null {
  return schedules.find((s) => isScheduleActive(s, now)) ?? null;
}

/**
 * Returns true when at least one schedule is currently active.
 * Useful for UI that wants to show "Schedule active" without caring which one.
 */
export function isAnyScheduleActive(schedules: Schedule[], now: Date = new Date()): boolean {
  return schedules.some((s) => isScheduleActive(s, now));
}
