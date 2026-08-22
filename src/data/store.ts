import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeKey, IntensityKey } from './themes';
import { GoalData, EMPTY_GOAL } from './goal';
import { EMPTY_PROGRESS, ProgressState, rollStreakForToday, seedProgressFromLegacy } from './progress';
import { BedtimeWindow, DEFAULT_BEDTIME } from './bedtime';
import { CheckIn } from './checkin';
import { ProgressPhoto } from './progressPhotos';
import { DEFAULT_BLOCKED_PACKAGES } from './blockedApps';

const KEY = 'screentime.v1';

export type PersistedState = {
  onboardingComplete: boolean;
  themeKey: ThemeKey;
  intensityKey: IntensityKey;
  futureSelfMessage: string;
  goal: GoalData;
  hoursReclaimed: number;
  reclaimedToday: number;
  reclaimedTodayDate: string;
  unlockNumber: number;
  dayNumber: number;
  firstOpenDate: string;
  guardian: { enabled: boolean; name: string; contact: string } | null;
  pin: string | null;
  account: Account | null;
  /** Raw onboarding answers, kept after onboarding completes so later
   *  screens (recommendation, personalization) can still read them. */
  onboardingAnswers: Record<string, { value: string; label: string }>;
  progress: ProgressState;
  bedtime: BedtimeWindow;
  checkIns: CheckIn[];
  lastCheckInDate: string | null;
  progressPhotos: ProgressPhoto[];
  blockedPackages: string[];
  gateReflections: GateReflection[];
  schedules: Schedule[];
  appLimits?: AppLimit[];
  /** Emergency tokens — every user starts with 2 free, spent one at a time
   *  to end a locked focus session early. Never taken away, never expire;
   *  more can only be bought, never earned or reset, so the free 2 stay
   *  meaningfully free rather than a bait-and-switch trial. */
  emergencyTokens: number;
};

export type AppLimit = {
  packageName: string;
  appName: string;
  limitMinutes: number;
  emergencyUses: number;
  showReminders: boolean;
  strictMode: boolean;
};

export type Schedule = {
  id: string;
  name: string;
  /** "HH:MM", 24-hour. */
  start: string;
  end: string;
  days: string;
};

export const DEFAULT_SCHEDULES: Schedule[] = [
  { id: 'work', name: 'Work Time', start: '09:00', end: '17:00', days: 'Mon–Fri' },
  { id: 'sleep', name: 'Sleep Mode', start: '22:00', end: '07:00', days: 'Every day' },
];

export type GateReflection = {
  /** ISO timestamp. */
  date: string;
  prompt: string;
  text: string;
  /** Whether they went through with the unlock after writing this. */
  unlocked: boolean;
};

const MAX_GATE_REFLECTIONS = 100;

export function recordGateReflection(
  existing: GateReflection[],
  entry: GateReflection,
): GateReflection[] {
  return [...existing, entry].slice(-MAX_GATE_REFLECTIONS);
}

export type Account = {
  method: 'apple' | 'google' | 'email';
  identifier: string; // email address, or Apple's opaque user id when email is withheld
  name: string;
};

export const DEFAULT_STATE: PersistedState = {
  onboardingComplete: false,
  themeKey: 'quiet',
  intensityKey: 'steady',
  futureSelfMessage: '',
  goal: EMPTY_GOAL,
  hoursReclaimed: 0,
  reclaimedToday: 0,
  reclaimedTodayDate: new Date().toDateString(),
  unlockNumber: 1,
  dayNumber: 1,
  firstOpenDate: new Date().toDateString(),
  guardian: null,
  pin: null,
  account: null,
  onboardingAnswers: {},
  progress: EMPTY_PROGRESS,
  bedtime: DEFAULT_BEDTIME,
  checkIns: [],
  lastCheckInDate: null,
  progressPhotos: [],
  blockedPackages: DEFAULT_BLOCKED_PACKAGES,
  gateReflections: [],
  schedules: DEFAULT_SCHEDULES,
  appLimits: [],
  emergencyTokens: 2,
};

export async function loadState(): Promise<PersistedState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);

    // "Reclaimed today" and the day counter both roll over on a real calendar
    // day change — nothing about them should carry over silently.
    const today = new Date().toDateString();
    if (parsed.reclaimedTodayDate !== today) {
      const daysSinceFirst = parsed.firstOpenDate
        ? Math.max(1, Math.round((Date.now() - new Date(parsed.firstOpenDate).getTime()) / 86400000) + 1)
        : parsed.dayNumber;
      parsed.reclaimedToday = 0;
      parsed.unlockNumber = 1;
      parsed.reclaimedTodayDate = today;
      parsed.dayNumber = daysSinceFirst;
    }

    if (!parsed.progress) {
      parsed.progress = seedProgressFromLegacy(parsed.hoursReclaimed ?? 0, parsed.firstOpenDate ?? today);
    } else {
      parsed.progress = rollStreakForToday(parsed.progress);
    }

    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Best-effort — losing a write should never crash the app.
  }
}

export async function clearState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
