export type ProgressPhoto = { date: string; uri: string };

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

/** Weekly cadence, same 7-day rule as the check-in — new capture is offered
 *  once 7 days have passed since the last one (or since first open if none exist). */
export function nextPhotoDue(photos: ProgressPhoto[], firstOpenDate: string, now = new Date()): boolean {
  const last = photos.length ? photos[photos.length - 1] : null;
  const since = last ? new Date(last.date) : new Date(firstOpenDate);
  if (Number.isNaN(since.getTime())) return true;
  return daysBetween(since, now) >= 7;
}

export function weeksTracked(photos: ProgressPhoto[]): number {
  return photos.length;
}
