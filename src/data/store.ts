import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeKey, IntensityKey } from './themes';
import { GoalData, EMPTY_GOAL } from './goal';
import { EMPTY_PROGRESS, ProgressState, rollStreakForToday, seedProgressFromLegacy } from './progress';
import { BedtimeWindow, DEFAULT_BEDTIME } from './bedtime';
import { CheckIn } from './checkin';
import { ProgressPhoto } from './progressPhotos';
import { DEFAULT_BLOCKED_PACKAGES } from './blockedApps';
import { EssentialKey } from './gateQuestions';
import { ActivitySessionResult } from '../shield/activity/types';

const KEY = 'screentime.v1';

/** A locked focus session, held as an absolute end time so it survives the app
 *  being backgrounded or killed — a block you can escape by force-quitting is
 *  not a block. */
export type FocusSession = {
  endsAt: number;
  totalSec: number;
  label: string;
  hardMode: boolean;
};

export type PersistedState = {
  onboardingComplete: boolean;
  themeKey: ThemeKey;
  intensityKey: IntensityKey;
  /** ISO date the current level started. Shown as tenure — a level with
   *  visible history reads as a commitment, a bare label reads as a toggle. */
  intensitySince?: string | null;
  /** A requested step *down* in strictness, and when it lands. Loosening is
   *  deliberately not instant: being able to leave Strict at the moment
   *  Strict starts to bite is the same as not having chosen it. */
  pendingIntensityKey?: IntensityKey | null;
  pendingIntensityAt?: number | null;
  futureSelfMessage: string;
  goal: GoalData;
  hoursReclaimed: number;
  reclaimedToday: number;
  reclaimedTodayDate: string;
  unlockNumber: number;
  dayNumber: number;
  firstOpenDate: string;
  guardian: {
    enabled: boolean;
    name: string;
    contact: string;
    /** Salted hash of the unlock code — the code itself is never persisted. */
    codeHash: string;
    codeSalt: string;
  } | null;
  account: Account | null;
  /** Raw onboarding answers, kept after onboarding completes so later
   *  screens (recommendation, personalization) can still read them. */
  onboardingAnswers: Record<string, { value: string; label: string }>;
  /** Categories the user asked to have blocked outright, by HARD_BLOCKS key.
   *  Persisted so the shield can say *why* a thing is shut, in their words. */
  hardBlocks: string[];
  progress: ProgressState;
  bedtime: BedtimeWindow;
  checkIns: CheckIn[];
  lastCheckInDate: string | null;
  progressPhotos: ProgressPhoto[];
  blockedPackages: string[];
  /** Per-app challenge intensity. Apps absent from this map fall back to the
   *  global intensityKey chosen during onboarding, so an existing install
   *  keeps behaving exactly as it did before any app was set individually. */
  blockedAppModes: Record<string, IntensityKey>;
  session: FocusSession | null;
  /** Which essential categories stay reachable during a block. */
  essentials: Record<EssentialKey, boolean>;
  /** Waiting Room: which gate families may appear. Absent means all of them.
   *  Keyed by family letter, matching gateQuestions' A/C/E. */
  waitingRoomFamilies?: Record<string, boolean>;
  gateReflections: GateReflection[];
  schedules: Schedule[];
  appLimits?: AppLimit[];
  /** Finished physical-unlock attempts, newest last, capped at 100. Feeds the
   *  adaptive rep target so the difficulty tracks what this person can
   *  actually do rather than a fixed number. */
  activitySessions: ActivitySessionResult[];
  /** Bailouts — every user starts with 2 free. Spent one at a time to leave
   *  a locked focus timer early. Never taken away, never expire;
   *  more can only be bought, never earned or reset.
   *  In __DEV__, loadState tops the balance up to DEV_EMERGENCY_TOKEN_FLOOR
   *  so skip/unlock flows can be exercised without buying packs. */
  emergencyTokens: number;
  /** Date string of the last emergency unlock — one per day. */
  emergencyUsedOn?: string | null;
  /** Day (toDateString) the unlock counter below belongs to. */
  unlocksUsedOn?: string | null;
  /** Earned unlocks spent today. Capped at DAILY_UNLOCK_LIMIT — the point of
   *  the app is a ceiling, and an unlimited "just do the reps again" loop
   *  quietly removed it. */
  unlocksUsedToday?: number;
};

/** Production starting grant. Do not raise this for shipping builds. */
export const FREE_EMERGENCY_TOKENS = 1;

/** Schedules the free plan keeps. PlanCompareScreen has advertised "free: 1,
 *  Pro: Unlimited" since it was written; this is the number that makes that
 *  true. Existing schedules above the limit are never deleted — the gate only
 *  stops a new one being added. */
export const FREE_SCHEDULE_LIMIT = 1;

/** Dev-only floor so testers can skip gates and end locked timers. */
export const DEV_EMERGENCY_TOKEN_FLOOR = 10;

export function startingEmergencyTokens(): number {
  return __DEV__ ? DEV_EMERGENCY_TOKEN_FLOOR : FREE_EMERGENCY_TOKENS;
}

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

/**
 * A schedule is a lockdown window — while one is active the blocklist is
 * unchanged but every way out closes (see `activeLockdown`). One default, not
 * five: the old set shipped Sleep (22:00–07:00) *and* Work (09:00–17:00)
 * *and* three more, which under lockdown semantics would mean a new install
 * had no bailout, no emergency and no unlocks for most of the day. Sleep is
 * the window almost everyone actually wants sealed; the rest are the user's
 * to add.
 */
export const DEFAULT_SCHEDULES: Schedule[] = [
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

/** Why a Bailout left the balance. Both of these are real spend paths —
 *  the timer cancel and the gate/shield skip — and the screen copy has to
 *  name both, not just the timer. */
export type TokenSpendReason = 'gate-skip' | 'timer-cancel';

/** Why a Bailout entered the balance. `starting-grant` is the two free ones,
 *  `carried-over` is what survives a delete-account wipe, `testing` is the
 *  dev-only top-up — kept distinct so a ledger read never has to guess
 *  whether a balance was paid for. */
export type TokenGrantReason = 'purchased' | 'restored' | 'starting-grant' | 'carried-over' | 'testing';

export type TokenReason = TokenSpendReason | TokenGrantReason;

/** An immutable record of every token spend and grant, for auditability.
 *  Capped at 200 entries — oldest are dropped first. */
export type TokenLedgerEntry = {
  /** ISO timestamp of the transaction. */
  date: string;
  reason: TokenReason;
  /** Negative for spends, positive for grants. */
  delta: number;
  /** Balance immediately after this transaction. */
  balanceAfter: number;
};

const MAX_TOKEN_LEDGER = 200;

export function appendTokenLedger(
  existing: TokenLedgerEntry[],
  entry: TokenLedgerEntry,
): TokenLedgerEntry[] {
  return [...existing, entry].slice(-MAX_TOKEN_LEDGER);
}

/** The result of a balance change: the new balance and the new ledger, always
 *  moved together so one can never be written without the other. */
export type TokenTxn = { balance: number; ledger: TokenLedgerEntry[] };

/**
 * The single place a Bailout is ever spent. Returns `null` — not a silently
 * unchanged balance — when there is nothing to spend, so a caller that forgets
 * the zero check gets a value it cannot use rather than a free unlock. Every
 * spend path in the app goes through here; none of them do their own
 * arithmetic.
 */
export function spendToken(
  balance: number,
  ledger: TokenLedgerEntry[],
  reason: TokenSpendReason,
  now: number = Date.now(),
): TokenTxn | null {
  if (!Number.isFinite(balance) || balance <= 0) return null;
  const next = balance - 1;
  return {
    balance: next,
    ledger: appendTokenLedger(ledger, {
      date: new Date(now).toISOString(),
      reason,
      delta: -1,
      balanceAfter: next,
    }),
  };
}

/**
 * The single place Bailouts are ever added — purchases, restores, the starting
 * grant, the dev top-up. A non-positive quantity is a no-op rather than a
 * ledger entry for nothing.
 */
export function grantTokens(
  balance: number,
  ledger: TokenLedgerEntry[],
  quantity: number,
  reason: TokenGrantReason,
  now: number = Date.now(),
): TokenTxn {
  const safe = Number.isFinite(balance) ? Math.max(0, balance) : 0;
  const qty = Math.floor(quantity);
  if (!Number.isFinite(qty) || qty <= 0) return { balance: safe, ledger };
  const next = safe + qty;
  return {
    balance: next,
    ledger: appendTokenLedger(ledger, {
      date: new Date(now).toISOString(),
      reason,
      delta: qty,
      balanceAfter: next,
    }),
  };
}

/**
 * Sets the balance to an absolute figure, used only by the dev top-up. Logged
 * like everything else so a tester's 99 is never mistaken for a purchase.
 */
export function setTokenBalance(
  balance: number,
  ledger: TokenLedgerEntry[],
  target: number,
  now: number = Date.now(),
): TokenTxn {
  const safe = Number.isFinite(balance) ? Math.max(0, balance) : 0;
  const next = Math.max(0, Math.floor(target));
  if (next === safe) return { balance: safe, ledger };
  return {
    balance: next,
    ledger: appendTokenLedger(ledger, {
      date: new Date(now).toISOString(),
      reason: 'testing',
      delta: next - safe,
      balanceAfter: next,
    }),
  };
}

const MAX_GATE_REFLECTIONS = 100;

export function recordGateReflection(
  existing: GateReflection[],
  entry: GateReflection,
): GateReflection[] {
  return [...existing, entry].slice(-MAX_GATE_REFLECTIONS);
}

const MAX_ACTIVITY_SESSIONS = 100;

/**
 * Appends a finished physical-unlock attempt. Abandoned and token-skipped
 * attempts are recorded too (with `completed: false`) — the difficulty model
 * needs to see what people are walking away from, not just what they finish.
 */
export function recordActivitySession(
  existing: ActivitySessionResult[],
  entry: ActivitySessionResult,
): ActivitySessionResult[] {
  return [...existing, entry].slice(-MAX_ACTIVITY_SESSIONS);
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
  account: null,
  onboardingAnswers: {},
  hardBlocks: [],
  progress: EMPTY_PROGRESS,
  bedtime: DEFAULT_BEDTIME,
  checkIns: [],
  lastCheckInDate: null,
  progressPhotos: [],
  blockedPackages: DEFAULT_BLOCKED_PACKAGES,
  blockedAppModes: {},
  session: null,
  essentials: { call: true, payment: true, maps: true, health: true },
  gateReflections: [],
  schedules: DEFAULT_SCHEDULES,
  appLimits: [],
  activitySessions: [],
  emergencyTokens: startingEmergencyTokens(),
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

    const merged: PersistedState = { ...DEFAULT_STATE, ...parsed };
    // Existing installs still have the production grant of 2. Top up only
    // while developing so the tester isn't stuck after two skips.
    if (__DEV__ && merged.emergencyTokens < DEV_EMERGENCY_TOKEN_FLOOR) {
      merged.emergencyTokens = DEV_EMERGENCY_TOKEN_FLOOR;
    }
    return merged;
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
