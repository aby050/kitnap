export type DailyLog = {
  date: string;
  focusMinutes: number;
  savedMinutes: number;
  lockSessions: number;
  distractionsBlocked: number;
  hardUnlocks: number;
};

export type ProgressEvent =
  | { type: 'focus'; minutes: number }
  | { type: 'saved'; minutes: number }
  | { type: 'lockSession' }
  | { type: 'blocked' }
  | { type: 'hardUnlock' };

export type AchievementCategory = 'streak' | 'focus' | 'saved' | 'behavior';

export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  shareLine: string;
  statLabel: string;
  medal: 'flame' | 'mint' | 'gold' | 'steel' | 'violet';
  threshold: number;
};

export type EarnedAchievement = {
  id: string;
  earnedAt: string;
};

export type ProgressState = {
  days: Record<string, DailyLog>;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  achievements: EarnedAchievement[];
};

export const EMPTY_PROGRESS: ProgressState = {
  days: {},
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  achievements: [],
};

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 100, 150, 200, 365];

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'streak-3', name: 'Spark Starter', description: '3-day streak completed.', category: 'streak', shareLine: "I've protected my focus for 3 days in a row.", statLabel: '3-day streak', medal: 'flame', threshold: 3 },
  { id: 'streak-7', name: 'The Comeback', description: '7-day streak completed.', category: 'streak', shareLine: "I've protected my focus for 7 days.", statLabel: '7-day streak', medal: 'flame', threshold: 7 },
  { id: 'streak-14', name: 'Fortnight Flame', description: '14-day streak completed.', category: 'streak', shareLine: "Two weeks of protected focus.", statLabel: '14-day streak', medal: 'gold', threshold: 14 },
  { id: 'streak-30', name: 'Quiet Month', description: '30-day streak completed.', category: 'streak', shareLine: "I've protected my focus for 30 days.", statLabel: '30-day streak', medal: 'gold', threshold: 30 },
  { id: 'streak-60', name: 'Unbreakable', description: '60-day streak completed.', category: 'streak', shareLine: "60 days of showing up for my focus.", statLabel: '60-day streak', medal: 'steel', threshold: 60 },
  { id: 'streak-100', name: 'Century Club', description: '100-day streak completed.', category: 'streak', shareLine: "100 days of protected focus.", statLabel: '100-day streak', medal: 'violet', threshold: 100 },

  { id: 'focus-first', name: 'First Light', description: 'Completed your first focus session.', category: 'focus', shareLine: 'I finished my first focus session.', statLabel: '1 session', medal: 'mint', threshold: 1 },
  { id: 'focus-10h', name: 'Deep Current', description: '10 hours focused.', category: 'focus', shareLine: "I've focused for 10 hours.", statLabel: '10h focused', medal: 'mint', threshold: 10 * 60 },
  { id: 'focus-50h', name: 'Iron Hours', description: '50 hours focused.', category: 'focus', shareLine: "I've focused for 50 hours.", statLabel: '50h focused', medal: 'steel', threshold: 50 * 60 },
  { id: 'focus-100h', name: 'Quiet Century', description: '100 hours focused.', category: 'focus', shareLine: "I've focused for 100 hours.", statLabel: '100h focused', medal: 'gold', threshold: 100 * 60 },
  { id: 'focus-500h', name: 'Time Architect', description: '500 hours focused.', category: 'focus', shareLine: "I've focused for 500 hours.", statLabel: '500h focused', medal: 'violet', threshold: 500 * 60 },

  { id: 'saved-1h', name: 'Minute Thief', description: 'Saved 1 hour from distracting apps.', category: 'saved', shareLine: 'I saved my first hour from my phone.', statLabel: '1h saved', medal: 'mint', threshold: 60 },
  { id: 'saved-10h', name: 'Time Thief Hunter', description: 'Saved 10 hours from distracting apps.', category: 'saved', shareLine: 'I saved 10 hours from my phone.', statLabel: '10h saved', medal: 'gold', threshold: 10 * 60 },
  { id: 'saved-50h', name: 'Hours Reclaimed', description: 'Saved 50 hours from distracting apps.', category: 'saved', shareLine: 'I saved 50 hours from my phone.', statLabel: '50h saved', medal: 'steel', threshold: 50 * 60 },
  { id: 'saved-100h', name: 'Daylight Keeper', description: 'Saved 100 hours from distracting apps.', category: 'saved', shareLine: 'I saved 100 hours from my phone.', statLabel: '100h saved', medal: 'violet', threshold: 100 * 60 },

  { id: 'hard-1', name: 'Soft Exit', description: 'First successful Hard Unlock.', category: 'behavior', shareLine: 'I completed my first Hard Unlock challenge.', statLabel: '1 hard unlock', medal: 'steel', threshold: 1 },
  { id: 'hard-10', name: 'Iron Focus', description: 'Completed 10 Hard Unlock challenges.', category: 'behavior', shareLine: 'I completed 10 Hard Unlock challenges.', statLabel: '10 hard unlocks', medal: 'gold', threshold: 10 },
  { id: 'blocked-100', name: 'Shield Wall', description: '100 distractions blocked.', category: 'behavior', shareLine: "I've blocked 100 distractions.", statLabel: '100 blocked', medal: 'steel', threshold: 100 },
  { id: 'week-1', name: 'First Week', description: 'Completed your first week.', category: 'behavior', shareLine: 'I finished my first week of protected focus.', statLabel: '7 days in', medal: 'mint', threshold: 7 },
  { id: 'month-1', name: 'First Month', description: 'Completed your first month.', category: 'behavior', shareLine: 'I finished my first month of protected focus.', statLabel: '30 days in', medal: 'gold', threshold: 30 },
];

export function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return dateKey(dt);
}

export function emptyDay(date: string): DailyLog {
  return {
    date,
    focusMinutes: 0,
    savedMinutes: 0,
    lockSessions: 0,
    distractionsBlocked: 0,
    hardUnlocks: 0,
  };
}

export function getDay(progress: ProgressState, date: string): DailyLog {
  return progress.days[date] ?? emptyDay(date);
}

function dayCounts(log: DailyLog): boolean {
  return log.focusMinutes > 0 || log.savedMinutes > 0 || log.lockSessions > 0;
}

export function formatDuration(mins: number): string {
  const safe = Math.max(0, Math.round(mins));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatSignedMinutes(delta: number): string {
  const abs = Math.abs(Math.round(delta));
  const body = abs >= 60 ? formatDuration(abs) : `${abs} min`;
  if (delta > 0) return `+${body}`;
  if (delta < 0) return `−${body}`;
  return 'same as yesterday';
}

export function formatPrettyDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function weekdayShort(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short' });
}

export function sumRange(progress: ProgressState, start: string, end: string) {
  let focusMinutes = 0;
  let savedMinutes = 0;
  let lockSessions = 0;
  let distractionsBlocked = 0;
  let hardUnlocks = 0;
  let daysWithFocus = 0;
  let bestFocusDay = emptyDay(start);

  for (let key = start; key <= end; key = addDays(key, 1)) {
    const log = getDay(progress, key);
    focusMinutes += log.focusMinutes;
    savedMinutes += log.savedMinutes;
    lockSessions += log.lockSessions;
    distractionsBlocked += log.distractionsBlocked;
    hardUnlocks += log.hardUnlocks;
    if (log.focusMinutes > 0) daysWithFocus += 1;
    if (log.focusMinutes > bestFocusDay.focusMinutes) bestFocusDay = log;
  }

  const span = Math.max(1, daySpan(start, end));
  return {
    focusMinutes,
    savedMinutes,
    lockSessions,
    distractionsBlocked,
    hardUnlocks,
    daysWithFocus,
    bestFocusDay,
    avgDailyFocus: focusMinutes / span,
    span,
  };
}

export function daySpan(start: string, end: string): number {
  const [ys, ms, ds] = start.split('-').map(Number);
  const [ye, me, de] = end.split('-').map(Number);
  const a = new Date(ys, ms - 1, ds).getTime();
  const b = new Date(ye, me - 1, de).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

export function totals(progress: ProgressState) {
  return Object.values(progress.days).reduce(
    (acc, log) => {
      acc.focusMinutes += log.focusMinutes;
      acc.savedMinutes += log.savedMinutes;
      acc.lockSessions += log.lockSessions;
      acc.distractionsBlocked += log.distractionsBlocked;
      acc.hardUnlocks += log.hardUnlocks;
      return acc;
    },
    { focusMinutes: 0, savedMinutes: 0, lockSessions: 0, distractionsBlocked: 0, hardUnlocks: 0 },
  );
}

export function daysSinceJoin(firstOpenDate: string, today = dateKey()): number {
  const parsed = new Date(firstOpenDate);
  if (Number.isNaN(parsed.getTime())) return 1;
  return Math.max(1, daySpan(dateKey(parsed), today));
}

export function nextStreakMilestone(streak: number): { current: number; next: number } {
  const next = STREAK_MILESTONES.find((m) => m > streak) ?? STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  return { current: streak, next };
}

export function rollStreakForToday(progress: ProgressState, today = dateKey()): ProgressState {
  const yesterday = addDays(today, -1);
  if (!progress.lastActiveDate) {
    return { ...progress, currentStreak: 0 };
  }
  if (progress.lastActiveDate === today || progress.lastActiveDate === yesterday) {
    return progress;
  }
  return { ...progress, currentStreak: 0 };
}

function applyToDay(log: DailyLog, event: ProgressEvent): DailyLog {
  const next = { ...log };
  if (event.type === 'focus') next.focusMinutes += Math.max(0, event.minutes);
  if (event.type === 'saved') next.savedMinutes += Math.max(0, event.minutes);
  if (event.type === 'lockSession') next.lockSessions += 1;
  if (event.type === 'blocked') next.distractionsBlocked += 1;
  if (event.type === 'hardUnlock') next.hardUnlocks += 1;
  return next;
}

function metricFor(def: AchievementDef, progress: ProgressState, joinedDays: number): number {
  const t = totals(progress);
  switch (def.id) {
    case 'streak-3':
    case 'streak-7':
    case 'streak-14':
    case 'streak-30':
    case 'streak-60':
    case 'streak-100':
      return Math.max(progress.currentStreak, progress.bestStreak);
    case 'focus-first':
      return t.lockSessions + (t.focusMinutes > 0 ? 1 : 0);
    case 'focus-10h':
    case 'focus-50h':
    case 'focus-100h':
    case 'focus-500h':
      return t.focusMinutes;
    case 'saved-1h':
    case 'saved-10h':
    case 'saved-50h':
    case 'saved-100h':
      return t.savedMinutes;
    case 'hard-1':
    case 'hard-10':
      return t.hardUnlocks;
    case 'blocked-100':
      return t.distractionsBlocked;
    case 'week-1':
    case 'month-1':
      return joinedDays;
    default:
      return 0;
  }
}

export function achievementProgress(def: AchievementDef, progress: ProgressState, joinedDays: number): number {
  return Math.min(1, metricFor(def, progress, joinedDays) / Math.max(1, def.threshold));
}

export function unlockAchievements(progress: ProgressState, joinedDays: number, now = new Date()): EarnedAchievement[] {
  const have = new Set(progress.achievements.map((a) => a.id));
  const earned = [...progress.achievements];
  for (const def of ACHIEVEMENTS) {
    if (have.has(def.id)) continue;
    if (metricFor(def, progress, joinedDays) >= def.threshold) {
      earned.push({ id: def.id, earnedAt: now.toISOString() });
    }
  }
  return earned;
}

export function recordEvents(
  progress: ProgressState,
  events: ProgressEvent[],
  opts: { today?: string; joinedDays?: number } = {},
): ProgressState {
  return events.reduce((p, event) => recordEvent(p, event, opts), progress);
}

export function recordEvent(
  progress: ProgressState,
  event: ProgressEvent,
  opts: { today?: string; joinedDays?: number } = {},
): ProgressState {
  const today = opts.today ?? dateKey();
  const rolled = rollStreakForToday(progress, today);
  const day = applyToDay(getDay(rolled, today), event);
  const days = { ...rolled.days, [today]: day };

  let currentStreak = rolled.currentStreak;
  let lastActiveDate = rolled.lastActiveDate;
  if (dayCounts(day) && lastActiveDate !== today) {
    const yesterday = addDays(today, -1);
    currentStreak = lastActiveDate === yesterday ? currentStreak + 1 : 1;
    lastActiveDate = today;
  }

  const next: ProgressState = {
    ...rolled,
    days,
    currentStreak,
    bestStreak: Math.max(rolled.bestStreak, currentStreak),
    lastActiveDate,
  };
  next.achievements = unlockAchievements(next, opts.joinedDays ?? 1);
  return next;
}

export function seedProgressFromLegacy(hoursReclaimed: number, firstOpenDate: string): ProgressState {
  const today = dateKey();
  const savedMinutes = Math.round(hoursReclaimed * 60);
  if (savedMinutes <= 0) return rollStreakForToday(EMPTY_PROGRESS, today);
  const firstKey = dateKey(new Date(firstOpenDate));
  const joined = daysSinceJoin(firstOpenDate, today);
  const seeded = recordEvent(
    EMPTY_PROGRESS,
    { type: 'saved', minutes: savedMinutes },
    { today: Number.isNaN(new Date(firstOpenDate).getTime()) ? today : firstKey, joinedDays: joined },
  );
  return rollStreakForToday(seeded, today);
}

/**
 * A score for THIS person's own activity. Not a ranking against anybody.
 *
 * ⚠️ Read the name carefully before using this: it was called
 * `globalPercentile` and surfaced under the label "percentile", which told
 * the user they were ahead of N% of Byre's users. Byre has no user base to
 * compare against — there is no server, no ranking, and this function never
 * saw another account. It is a weighted blend of the user's OWN totals mapped
 * into 12–95, and presenting that as a percentile is an invented statistic of
 * exactly the kind AUDIT.md flags (C4) and the project's own rule forbids.
 *
 * The maths is unchanged and still useful as a single progress figure — only
 * the claim attached to it was false. Renamed and relabelled rather than
 * removed. Do not reintroduce "percentile", "top N%", or "better than"
 * copy around it unless a real ranking exists to back it.
 *
 * Weights: focus 30%, time saved 25%, streak 20%, lock sessions 15%, blocked 10%.
 * Mapped into 12–95 so a first day is never 0% and no one is shown as maxed.
 */
export function focusScore(progress: ProgressState): { percent: number; score: number } {
  const t = totals(progress);
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  const score =
    0.3 * clamp01(t.focusMinutes / (50 * 60)) +
    0.25 * clamp01(t.savedMinutes / (40 * 60)) +
    0.2 * clamp01(progress.currentStreak / 30) +
    0.15 * clamp01(t.lockSessions / 40) +
    0.1 * clamp01(t.distractionsBlocked / 100);
  const percent = Math.round(12 + score * 83);
  return { percent, score };
}

export function weeklyWindows(today = dateKey()) {
  const thisStart = addDays(today, -6);
  const prevEnd = addDays(thisStart, -1);
  const prevStart = addDays(prevEnd, -6);
  const monthStart = addDays(today, -29);
  return { thisStart, today, prevStart, prevEnd, monthStart };
}

export function dailySeries(progress: ProgressState, start: string, end: string): DailyLog[] {
  const out: DailyLog[] = [];
  for (let key = start; key <= end; key = addDays(key, 1)) {
    out.push(getDay(progress, key));
  }
  return out;
}

export function earnedThisMonth(progress: ProgressState, monthStart: string): AchievementDef[] {
  const ids = new Set(
    progress.achievements.filter((a) => dateKey(new Date(a.earnedAt)) >= monthStart).map((a) => a.id),
  );
  return ACHIEVEMENTS.filter((d) => ids.has(d.id));
}

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function shareMessage(def: AchievementDef, extra?: string): string {
  const line = extra ? `${def.shareLine} ${extra}` : def.shareLine;
  return `${def.name}\n${line}\n\n— Byre`;
}

/** @deprecated Misleading name — see `focusScore`. Kept as an alias only so a
 *  stale import cannot silently resolve to nothing. */

