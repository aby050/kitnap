import { ActivityKind } from './types';

/**
 * Cadence guard for the manual tier — the last resort, where the only evidence
 * we have is when the button was pressed.
 *
 * This cannot detect a workout. What it can do is make mashing the button
 * strictly slower than doing the reps, which is the whole point of Strict mode:
 * the friction has to be real. Three guards, in increasing subtlety:
 *
 *   1. A tap sooner than a rep physically takes is dropped.
 *   2. A whole set cannot finish faster than target × that floor.
 *   3. Taps that are *too* evenly spaced — a thumb keeping time rather than a
 *      body recovering between reps — get one warning tap dropped.
 *
 * (3) is deliberately narrow. Honest tap-per-rep timing varies a lot (people
 * pause, reset their feet, breathe); a metronome does not. Only near-perfect
 * uniformity at close to the minimum gap trips it, so an unhurried, steady
 * exerciser is never accused.
 */

/** Gaps kept for the uniformity test. Four gaps = five taps. */
const WINDOW = 4;
/** Coefficient of variation below this is not a human recovering between reps. */
const UNIFORM_CV = 0.05;
/** ...but only suspicious if they're also rushing. Multiple of the floor, kept
 *  deliberately tight: the signature this guard exists to catch is tapping *at*
 *  the floor with machine regularity. Widen the band and it starts accusing
 *  honest people — jumping jacks in particular are genuinely rhythmic, and a
 *  steady real cadence sits only a little above the floor. Anyone metronomic
 *  but slower than this is already paying the wall-clock cost the floors exist
 *  to impose, so there is nothing left to catch. */
const UNIFORM_SPEED = 1.2;

export type TapVerdict = 'counted' | 'tooFast' | 'tooRegular';

/** Sentinel for "hasn't happened yet". Not 0 — a caller passing a monotonic
 *  clock that starts at zero would otherwise never see the guards run. */
const NEVER = -1;

export type TapState = {
  activity: ActivityKind;
  reps: number;
  /** Taps thrown away by any guard. */
  rejected: number;
  lastVerdict: TapVerdict | 'none';
  lastTapAt: number;
  startedAt: number;
  /** Ring buffer of the last `WINDOW` inter-tap gaps, newest last. */
  gaps: number[];
};

export function createTapState(activity: ActivityKind): TapState {
  return {
    activity,
    reps: 0,
    rejected: 0,
    lastVerdict: 'none',
    lastTapAt: NEVER,
    startedAt: NEVER,
    gaps: [],
  };
}

/** The fastest a rep of this movement can honestly be performed, in ms. */
export function tapFloorMs(activity: ActivityKind): number {
  switch (activity) {
    case 'jumping jacks':
      return 800;
    case 'push-ups':
      return 1400;
    case 'squats':
    default:
      return 1200;
  }
}

function coefficientOfVariation(xs: number[]): number {
  const n = xs.length;
  if (n < 2) return 1;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += xs[i];
  const mean = sum / n;
  if (mean <= 0) return 1;
  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += (xs[i] - mean) * (xs[i] - mean);
  return Math.sqrt(varSum / n) / mean;
}

/**
 * Records a tap.
 *
 * @returns 1 if it counted as a rep, 0 if a guard dropped it. Inspect
 *          `lastVerdict` for which guard, so the UI can coach rather than
 *          silently swallow the press.
 */
export function feedTap(s: TapState, now: number): number {
  if (s.startedAt === NEVER) s.startedAt = now;

  const floor = tapFloorMs(s.activity);

  if (s.lastTapAt !== NEVER) {
    const gap = now - s.lastTapAt;

    if (gap < floor) {
      s.rejected++;
      s.lastVerdict = 'tooFast';
      // Deliberately does *not* advance `lastTapAt`: holding the button down
      // must not let a burst of rejected taps ratchet the clock forward.
      return 0;
    }

    if (s.gaps.length >= WINDOW) {
      const recent = s.gaps.slice(-(WINDOW - 1)).concat(gap);
      let sum = 0;
      for (let i = 0; i < recent.length; i++) sum += recent[i];
      const mean = sum / recent.length;
      if (mean < floor * UNIFORM_SPEED && coefficientOfVariation(recent) < UNIFORM_CV) {
        s.rejected++;
        s.lastVerdict = 'tooRegular';
        // Unlike `tooFast`, this *does* record the gap and advance the clock.
        // The interval itself was plausible — it's the pattern that isn't — and
        // dropping it from the history would let a metronome launder its own
        // rhythm: every rejection would widen the next measured gap and the
        // guard would go blind after a single catch. Keeping the history honest
        // means a metronome stays caught for as long as it keeps time, and the
        // way out is simply to slow to a real pace.
        s.gaps.push(gap);
        if (s.gaps.length > WINDOW) s.gaps.shift();
        s.lastTapAt = now;
        return 0;
      }
    }

    s.gaps.push(gap);
    if (s.gaps.length > WINDOW) s.gaps.shift();
  }

  s.reps++;
  s.lastTapAt = now;
  s.lastVerdict = 'counted';
  return 1;
}

/**
 * Guard 2. True when the set has counted enough taps *and* enough wall-clock
 * time has passed for those reps to have happened.
 *
 * The per-tap floor already forces (target − 1) × floor between the first and
 * last tap, so this adds exactly one rep's worth: it stops the first tap being
 * free. Tapping the instant the screen appears no longer buys a rep you didn't
 * do, and the set as a whole can never beat target × floor.
 */
export function tapSetSatisfied(s: TapState, target: number, now: number): boolean {
  if (s.reps < target) return false;
  if (s.startedAt === NEVER) return false;
  return now - s.startedAt >= target * tapFloorMs(s.activity);
}

export function tapHint(s: TapState, target: number, now: number): string {
  if (s.lastVerdict === 'tooFast') return "Quicker than the rep takes — that one didn't count.";
  if (s.lastVerdict === 'tooRegular') return 'Give each rep the time it needs.';
  if (s.reps >= target) {
    // Two different states once the taps are in, and they need different copy:
    // the set clock may still be running, or it may be done and waiting on them.
    return tapSetSatisfied(s, target, now) ? "That's the set." : 'Nearly — finish the set at a real pace.';
  }
  return 'Tap once per rep as you go.';
}
