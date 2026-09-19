export type ProgressPhoto = { date: string; uri: string };

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Weekly cadence — but only once there is a week to count from.
 *
 * The first photo is always available. It used to be measured from
 * `firstOpenDate`, which meant a user who passed on the photo during
 * onboarding was told to "come back next week" before they had taken a single
 * one — the gap the rule exists to protect was being enforced against nothing.
 * Skipping it at setup is a decision to do it later, not a decision to wait.
 *
 * After that the 7-day rule applies as before, from the last photo taken.
 */
export function nextPhotoDue(photos: ProgressPhoto[], _firstOpenDate?: string, now = new Date()): boolean {
  const last = photos.length ? photos[photos.length - 1] : null;
  if (!last) return true;
  const since = new Date(last.date);
  if (Number.isNaN(since.getTime())) return true;
  return daysBetween(since, now) >= 7;
}

/** Whole days until the next photo unlocks; 0 when one can be taken now. */
export function daysUntilNextPhoto(photos: ProgressPhoto[], now = new Date()): number {
  const last = photos.length ? photos[photos.length - 1] : null;
  if (!last) return 0;
  const since = new Date(last.date);
  if (Number.isNaN(since.getTime())) return 0;
  return Math.max(0, 7 - daysBetween(since, now));
}

export function weeksTracked(photos: ProgressPhoto[]): number {
  return photos.length;
}
