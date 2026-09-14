import { Schedule } from './store';
import { SLIP_WINDOWS } from '../onboarding/questions';

/**
 * Four windows worth sealing, written for the phone habits people actually
 * have rather than for an office day.
 *
 * ## Why these are offers, not defaults
 *
 * A schedule is a **lockdown**: while one runs, the blocklist is unchanged but
 * every way out shuts — no bailout, no emergency, no unlock (`activeLockdown`).
 * That is why `DEFAULT_SCHEDULES` ships exactly one. Turning four of these on
 * for a new install would seal most of their waking day behind a door with no
 * handle, on the first launch, before they trust the app at all. So these are
 * one tap each, chosen deliberately.
 *
 * ## Why these four
 *
 * Each is a named moment rather than a block of clock time, because nobody
 * thinks "09:00–17:30" — they think "I lost the whole evening again".
 *
 *   Revenge hour   The scroll after you have already decided to sleep. It is
 *                  the single most common way an evening becomes a bad
 *                  morning, and the one window people most want taken out of
 *                  their own hands.
 *   First light    The reach for the phone before you are properly awake,
 *                  which sets the tone for everything after it.
 *   Deep work      One protected stretch, on weekdays only — a lecture block,
 *                  a shift, the two hours the real work actually needs.
 *   The table      Dinner. Short, daily, and the one that other people notice.
 *
 * `matchesSlipWindow` is the smart part: onboarding already asks when the
 * phone usually wins, so the preset covering that answer is surfaced first and
 * marked. It is a recommendation from something the user told us, not a guess
 * about them.
 */
export type SchedulePreset = {
  id: string;
  /** What it is called once added. */
  name: string;
  /** One line: what the window is for, in their words not clock words. */
  blurb: string;
  start: string;
  end: string;
  days: string;
};

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  {
    id: 'revenge-hour',
    name: 'Revenge Hour',
    blurb: 'The scroll after you already decided to sleep.',
    start: '23:00',
    end: '01:30',
    days: 'Every day',
  },
  {
    id: 'first-light',
    name: 'First Light',
    blurb: 'The first half hour is yours before it is anyone else’s.',
    start: '07:00',
    end: '07:45',
    days: 'Every day',
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    blurb: 'One stretch on weekdays that nothing gets to interrupt.',
    start: '10:00',
    end: '12:00',
    days: 'Weekdays',
  },
  {
    id: 'the-table',
    name: 'The Table',
    blurb: 'Dinner. The one other people notice you doing.',
    start: '19:30',
    end: '20:30',
    days: 'Every day',
  },
];

/** Minutes past midnight, for windows that may cross it. */
function mins(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Does `preset` cover any part of the window the user named in onboarding?
 *
 *  Both sides may wrap past midnight (a 23:00–01:30 preset against a
 *  22:00–01:00 answer), so each is normalised into one or two plain ranges
 *  before they are compared — a naive start/end comparison reports no overlap
 *  for exactly the late-night case this exists to catch. */
export function matchesSlipWindow(preset: SchedulePreset, slipLabel?: string | null): boolean {
  const w = SLIP_WINDOWS.find((x) => x.label === slipLabel);
  if (!w) return false;

  const split = (start: string, end: string): [number, number][] => {
    const s = mins(start);
    const e = mins(end);
    return e > s ? [[s, e]] : [[s, 1440], [0, e]];
  };

  return split(preset.start, preset.end).some(([as, ae]) =>
    split(w.start, w.end).some(([bs, be]) => as < be && bs < ae),
  );
}

/** A preset, as a schedule ready to store. */
export function toSchedule(preset: SchedulePreset): Schedule {
  return {
    id: preset.id,
    name: preset.name,
    start: preset.start,
    end: preset.end,
    days: preset.days,
  };
}
