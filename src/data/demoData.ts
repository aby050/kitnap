import { CheckIn } from './checkin';
import { GateReflection, PersistedState } from './store';
import {
  addDays,
  dateKey,
  DailyLog,
  EMPTY_PROGRESS,
  ProgressState,
  unlockAchievements,
} from './progress';

/**
 * Two months of plausible history, for looking at populated screens during
 * development. Nothing here is ever shown to a real user: the Settings rows
 * that call it are __DEV__-only, because a screen-time app that can invent
 * its own numbers is exactly the thing this project refuses to ship.
 *
 * The shape is deliberately not flat — an app that improves in a smooth line
 * makes every chart look correct even when it isn't. This arc starts rough,
 * improves unevenly, takes two visible slumps, and misses days, so streaks
 * break, bestStreak differs from currentStreak, and the graphs have something
 * to actually render.
 */

export const DEMO_DAYS = 60;

/** Deterministic, so reloading demo data twice gives the same screenshots. */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** 0 → start of the two months, 1 → today. */
function improvement(t: number): number {
  // Two slumps, around a third and two-thirds of the way in.
  const slump = Math.exp(-(((t - 0.32) / 0.07) ** 2)) + Math.exp(-(((t - 0.68) / 0.06) ** 2));
  return Math.max(0, Math.min(1, t * 0.85 + 0.1 - slump * 0.45));
}

function demoDay(date: string, i: number): DailyLog {
  const t = i / (DEMO_DAYS - 1);
  const arc = improvement(t);
  const r = rand(i + 1);
  const weekday = new Date(date).getDay();
  const weekend = weekday === 0 || weekday === 6;

  // Missed days cluster early and during slumps, so streaks break where the
  // arc dips rather than at random.
  if (r > 0.72 + arc * 0.22) return { date, focusMinutes: 0, savedMinutes: 0, lockSessions: 0, distractionsBlocked: 0, hardUnlocks: 0 };

  const base = weekend ? 0.72 : 1;
  const focusMinutes = Math.round((25 + arc * 115 + rand(i + 200) * 45) * base);
  const savedMinutes = Math.round((15 + arc * 85 + rand(i + 400) * 40) * base);
  const lockSessions = 1 + Math.floor(arc * 3 + rand(i + 600) * 2);
  // Blocks fall as the habit holds — the whole point is needing the shield less.
  const distractionsBlocked = Math.max(0, Math.round(14 - arc * 9 + rand(i + 800) * 7));
  // Slips are meant to be the exception, not half the calendar: ~22% of days
  // early on, tapering to ~4% as the arc improves. The old expression was
  // inverted and produced a slip on nearly every other day.
  const slipChance = 0.22 - arc * 0.18;
  const hardUnlocks = rand(i + 1000) < slipChance ? 1 + Math.round(rand(i + 1200)) : 0;

  return { date, focusMinutes, savedMinutes, lockSessions, distractionsBlocked, hardUnlocks };
}

function dayCounts(log: DailyLog): boolean {
  return log.focusMinutes > 0 || log.savedMinutes > 0 || log.lockSessions > 0;
}

function buildProgress(today: string, joinedDays: number): ProgressState {
  const days: Record<string, DailyLog> = {};
  let currentStreak = 0;
  let bestStreak = 0;
  let lastActiveDate: string | null = null;

  for (let i = 0; i < DEMO_DAYS; i++) {
    const date = addDays(today, -(DEMO_DAYS - 1 - i));
    const log = demoDay(date, i);
    days[date] = log;

    // Mirrors recordEvent's rule rather than reimplementing it loosely: a
    // streak survives only on consecutive counting days.
    if (dayCounts(log)) {
      currentStreak = lastActiveDate === addDays(date, -1) ? currentStreak + 1 : 1;
      lastActiveDate = date;
      bestStreak = Math.max(bestStreak, currentStreak);
    }
  }

  // A gap between the last counting day and today means the run is already over.
  if (lastActiveDate !== today && lastActiveDate !== addDays(today, -1)) currentStreak = 0;

  const state: ProgressState = { days, currentStreak, bestStreak, lastActiveDate, achievements: [] };
  state.achievements = unlockAchievements(state, joinedDays);
  return state;
}

const REFLECTION_PROMPTS = [
  'What are you hoping to find in there?',
  'What would you rather be doing right now?',
  "Is this the thing you meant to do, or the thing that's easiest?",
];

const REFLECTION_TEXTS = [
  'Honestly just bored. Nothing I actually need.',
  'Waiting on a reply, but I could check once instead of ten times.',
  'Wanted to look up one thing and then kept going.',
  'Tired more than anything. Should probably just sleep.',
  'Avoiding the thing I said I would finish tonight.',
];

function buildReflections(today: string): GateReflection[] {
  const out: GateReflection[] = [];
  for (let i = 0; i < 14; i++) {
    const dayBack = Math.floor(rand(i + 30) * (DEMO_DAYS - 1));
    const date = new Date(addDays(today, -dayBack));
    date.setHours(9 + Math.floor(rand(i + 60) * 13), Math.floor(rand(i + 90) * 60), 0, 0);
    out.push({
      date: date.toISOString(),
      prompt: REFLECTION_PROMPTS[i % REFLECTION_PROMPTS.length],
      text: REFLECTION_TEXTS[i % REFLECTION_TEXTS.length],
      unlocked: rand(i + 120) > 0.55,
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** Control trends up over the two months; screen time trends down. */
function buildCheckIns(today: string): CheckIn[] {
  const out: CheckIn[] = [];
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const date = new Date(addDays(today, -Math.round((1 - t) * (DEMO_DAYS - 4))));
    const control = String(Math.round(3 + t * 5));
    out.push({
      date: date.toISOString(),
      answers: {
        checkin_control: { value: control, label: `${control} / 10` },
      },
    });
  }
  return out;
}

/**
 * Returns the slice of persisted state that makes the app look lived-in.
 * Deliberately does not touch onboarding answers, goal, theme, account,
 * blocked packages or bailouts — those are the user's real setup, and a demo
 * toggle overwriting them would be worse than useless.
 */
export function buildDemoState(): Partial<PersistedState> {
  const today = dateKey();
  const firstOpenDate = addDays(today, -(DEMO_DAYS - 1));
  const progress = buildProgress(today, DEMO_DAYS);

  const totalSaved = Object.values(progress.days).reduce((sum, d) => sum + d.savedMinutes, 0);
  const totalLocks = Object.values(progress.days).reduce((sum, d) => sum + d.lockSessions, 0);
  const checkIns = buildCheckIns(today);

  return {
    firstOpenDate,
    dayNumber: DEMO_DAYS,
    progress,
    hoursReclaimed: Math.round((totalSaved / 60) * 10) / 10,
    reclaimedToday: progress.days[today]?.savedMinutes ?? 0,
    reclaimedTodayDate: today,
    unlockNumber: totalLocks,
    gateReflections: buildReflections(today),
    checkIns,
    lastCheckInDate: checkIns[checkIns.length - 1]?.date.slice(0, 10) ?? null,
  };
}

/** Resets exactly the keys buildDemoState writes, so turning demo data off
 *  can't leave a half-real history behind. */
export function clearDemoState(): Partial<PersistedState> {
  const today = dateKey();
  return {
    firstOpenDate: today,
    dayNumber: 1,
    progress: EMPTY_PROGRESS,
    hoursReclaimed: 0,
    reclaimedToday: 0,
    reclaimedTodayDate: today,
    unlockNumber: 0,
    gateReflections: [],
    checkIns: [],
    lastCheckInDate: null,
  };
}
