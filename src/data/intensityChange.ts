import { IntensityKey } from './themes';

/** How long a step down in strictness waits before it takes effect.
 *
 *  This is the number `themes.ts` has always advertised on the Strict card
 *  ("24 hour delay") and which nothing enforced — the string was shown during
 *  onboarding and read by no logic anywhere. Making it real is the difference
 *  between a commitment and a setting. */
export const LOOSEN_DELAY_MS = 24 * 60 * 60 * 1000;

/** Ordered least to most strict, so "is this a step down?" is a comparison. */
const ORDER: IntensityKey[] = ['steady', 'strict'];

export function isLoosening(from: IntensityKey, to: IntensityKey): boolean {
  return ORDER.indexOf(to) < ORDER.indexOf(from);
}

export type IntensityState = {
  intensityKey: IntensityKey;
  intensitySince?: string | null;
  pendingIntensityKey?: IntensityKey | null;
  pendingIntensityAt?: number | null;
};

export type IntensityChange =
  /** Applied now: tightening, or a loosening the 7-day check-in earned. */
  | { kind: 'applied'; patch: IntensityState }
  /** Requested; lands at `at`. */
  | { kind: 'scheduled'; at: number; patch: IntensityState }
  /** Already there, or already requested. */
  | { kind: 'noop' };

/**
 * The single rule for changing level.
 *
 * Tightening is instant — wanting to be stricter should never be made to
 * wait. Loosening waits a day, unless the weekly check-in recommended it, in
 * which case the week's evidence is the price rather than the delay.
 */
export function requestIntensityChange(
  current: IntensityState,
  next: IntensityKey,
  opts: { earned?: boolean; now?: number } = {},
): IntensityChange {
  const now = opts.now ?? Date.now();
  if (next === current.intensityKey && !current.pendingIntensityKey) return { kind: 'noop' };

  const apply: IntensityState = {
    intensityKey: next,
    intensitySince: new Date(now).toISOString(),
    pendingIntensityKey: null,
    pendingIntensityAt: null,
  };

  if (!isLoosening(current.intensityKey, next) || opts.earned) {
    return { kind: 'applied', patch: apply };
  }

  const at = now + LOOSEN_DELAY_MS;
  return {
    kind: 'scheduled',
    at,
    patch: { ...current, pendingIntensityKey: next, pendingIntensityAt: at },
  };
}

/** Lands a scheduled loosening once its time has passed. Call on foreground —
 *  the delay has to survive the app being closed, so it's a stored deadline
 *  rather than a timer. */
export function settleIntensity(
  state: IntensityState,
  now = Date.now(),
): IntensityState | null {
  if (!state.pendingIntensityKey || !state.pendingIntensityAt) return null;
  if (state.pendingIntensityAt > now) return null;
  return {
    intensityKey: state.pendingIntensityKey,
    intensitySince: new Date(now).toISOString(),
    pendingIntensityKey: null,
    pendingIntensityAt: null,
  };
}

/** "23 days" — tenure, for the difficulty row. */
export function daysOnLevel(since: string | null | undefined, now = Date.now()): number | null {
  if (!since) return null;
  const started = Date.parse(since);
  if (Number.isNaN(started)) return null;
  return Math.max(0, Math.floor((now - started) / 86400000));
}
