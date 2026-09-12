import { CheckIn } from './checkin';
import { GateReflection, PersistedState } from './store';
import {
  ActivityKind,
  ActivitySessionResult,
  DetectorTier,
} from '../shield/activity/types';
import {
  addDays,
  dateKey,
  DailyLog,
  EMPTY_PROGRESS,
  ProgressState,
  unlockAchievements,
} from './progress';

/**
 * Six months of plausible history, for looking at populated screens during
 * development. Nothing here is ever shown to a real user: the Settings rows
 * that call it are __DEV__-only, because a screen-time app that can invent
 * its own numbers is exactly the thing this project refuses to ship.
 *
 * The shape is deliberately not flat — an app that improves in a smooth line
 * makes every chart look correct even when it isn't. This arc starts rough,
 * improves fast and then *plateaus* rather than climbing forever, takes three
 * visible slumps, and misses days, so streaks break, bestStreak differs from
 * currentStreak, and the graphs have something to actually render.
 */

/** Half a year. Long enough that the month and season views have real range,
 *  and that the plateau at the end is visibly a plateau. */
export const DEMO_DAYS = 183;

/** Deterministic, so reloading demo data twice gives the same screenshots. */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** 0 → six months ago, 1 → today. */
function improvement(t: number): number {
  // Saturating rather than linear: most of the gain lands in the first two
  // months and the rest holds. Over this long a window a straight line would
  // read as a chart someone drew, not a habit someone kept.
  const rise = Math.pow(t, 0.62) * 0.88 + 0.08;
  // Three bad weeks, not three bad months — narrow enough in `t` that each is
  // ~5 days, so they break streaks instead of flattening whole months.
  const slump =
    Math.exp(-(((t - 0.22) / 0.03) ** 2)) +
    Math.exp(-(((t - 0.52) / 0.025) ** 2)) +
    Math.exp(-(((t - 0.78) / 0.035) ** 2));
  return Math.max(0, Math.min(1, rise - slump * 0.5));
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

/** Roughly one written reflection every five days, capped well under the
 *  store's 100-entry ceiling so nothing is silently dropped. */
const DEMO_REFLECTIONS = Math.min(90, Math.round(DEMO_DAYS / 5));

function buildReflections(today: string): GateReflection[] {
  const out: GateReflection[] = [];
  for (let i = 0; i < DEMO_REFLECTIONS; i++) {
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

/**
 * Control trends up over the six months; screen time trends down.
 *
 * On the real weekly cadence (`shouldShowCheckIn`) rather than a fixed four, so
 * the check-in history is as dense as it would actually be by now — and the
 * control score saturates near the end instead of marching to 10/10.
 */
function buildCheckIns(today: string): CheckIn[] {
  const out: CheckIn[] = [];
  const count = Math.floor((DEMO_DAYS - 4) / 7);
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 1 : i / (count - 1);
    const date = new Date(addDays(today, -((count - 1 - i) * 7 + 2)));
    // 3 → ~8, easing off, with a little week-to-week wobble either way.
    const raw = 3 + Math.pow(t, 0.7) * 5 + (rand(i + 500) - 0.5);
    const control = String(Math.max(1, Math.min(10, Math.round(raw))));
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
 * Finished Strict-mode physical unlocks.
 *
 * Seeded because `computeRepTarget` reads this list, not `progress` — without it
 * a six-month demo install still shows a first-day rep target and the reason
 * line "still learning what works for you", which is the one part of the app
 * that is *supposed* to look experienced by now.
 *
 * Targets are written to sit inside `activityDifficulty`'s per-movement bands
 * rather than importing them: that table is internal there, and a dev seed
 * should not be the reason it becomes public API. `computeRepTarget` clamps its
 * own output anyway, so a drift here can only ever soften the anchor.
 */
const DEMO_ACTIVITIES: { kind: ActivityKind; min: number; max: number }[] = [
  { kind: 'squats', min: 8, max: 18 },
  { kind: 'jumping jacks', min: 10, max: 19 },
  { kind: 'marching', min: 16, max: 34 },
  { kind: 'arm raises', min: 42, max: 66 },
];

/** Capped under the store's 100-entry ceiling — about one unlock every three
 *  days, which is what the `hardUnlocks` counts above already imply. */
const DEMO_SESSIONS = Math.min(96, Math.round(DEMO_DAYS / 3));

function buildActivitySessions(today: string): ActivitySessionResult[] {
  const out: ActivitySessionResult[] = [];

  for (let i = 0; i < DEMO_SESSIONS; i++) {
    const t = i / Math.max(1, DEMO_SESSIONS - 1);
    const arc = improvement(t);
    const spec = DEMO_ACTIVITIES[i % DEMO_ACTIVITIES.length];

    const date = new Date(addDays(today, -Math.round((1 - t) * (DEMO_DAYS - 1))));
    date.setHours(7 + Math.floor(rand(i + 1400) * 15), Math.floor(rand(i + 1600) * 60), 0, 0);

    // The target climbs with the arc — the difficulty model raising its ask is
    // the thing a long history is meant to demonstrate.
    const target = Math.round(spec.min + (spec.max - spec.min) * (0.25 + arc * 0.7));

    // Early attempts get walked away from; late ones rarely do.
    const completed = rand(i + 1800) < 0.45 + arc * 0.5;
    const repsCompleted = completed ? target : Math.floor(target * (0.2 + rand(i + 2000) * 0.5));

    // Pose is the common tier, with motion and manual fallbacks mixed in so the
    // list exercises all three. Form is only ever measured on pose.
    const tierRoll = rand(i + 2200);
    const tier: DetectorTier = tierRoll < 0.62 ? 'pose' : tierRoll < 0.85 ? 'motion' : 'manual';
    const formQuality = tier === 'pose' ? Math.min(0.95, 0.52 + arc * 0.3 + rand(i + 2400) * 0.12) : 0;

    out.push({
      date: date.toISOString(),
      activity: spec.kind,
      target,
      repsCompleted,
      formQuality: Math.round(formQuality * 100) / 100,
      tier,
      durationMs: Math.round(repsCompleted * (2600 + rand(i + 2600) * 1800) + 4000),
      completed,
    });
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
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
    activitySessions: buildActivitySessions(today),
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
    activitySessions: [],
  };
}
