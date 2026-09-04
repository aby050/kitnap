/**
 * What to say, given the actual hour.
 *
 * The block screen used to fall back to the theme's `forWho` string — a
 * category label from the theme picker ("Late-night scrolling, rest"), written
 * to describe who a theme suits, not to be read at 1pm as a statement about
 * now. Anything shown on the block screen has to be true at the moment it is
 * read, or the app looks like it isn't paying attention.
 */

export type Moment = 'earlyMorning' | 'morning' | 'afternoon' | 'evening' | 'night' | 'lateNight';

export function momentFor(date: Date = new Date()): Moment {
  const h = date.getHours();
  if (h < 5) return 'lateNight';
  if (h < 9) return 'earlyMorning';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  if (h < 24) return 'night';
  return 'lateNight';
}

/** One line per part of the day, for the block screen's subtitle. */
const LINES: Record<Moment, string[]> = {
  earlyMorning: [
    'The day has not started badly yet. Keep it that way.',
    'First hour of the day. Spend it on something that is yours.',
  ],
  morning: [
    'This is the sharpest your head will be today. Use it on something better.',
    'Whatever this is, it will still be here after the work is done.',
  ],
  afternoon: [
    'The afternoon dip is normal. A feed is not the fix for it.',
    'Ten minutes here becomes an hour. It always does.',
  ],
  evening: [
    'The evening is yours. It is the only part of the day that is.',
    'You have earned a rest. This is not one.',
  ],
  night: [
    'Winding down works better without a feed in the middle of it.',
    'Nothing posted in the next hour will matter tomorrow.',
  ],
  lateNight: [
    'It is late. Nothing good is down there at this hour.',
    'Tomorrow starts in a few hours, and it starts with how this ends.',
  ],
};

/** Stable within an hour so it doesn't reshuffle between two glances. */
export function momentLine(date: Date = new Date()): string {
  const pool = LINES[momentFor(date)];
  const bucket = Math.floor(date.getTime() / 3_600_000);
  return pool[bucket % pool.length];
}
