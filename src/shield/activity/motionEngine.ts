import { ActivityKind } from './types';

/**
 * Motion energy → reps, for the tier where we have camera pixels but no pose
 * model (the web preview, and any device the pose model won't load on).
 *
 * Same shape as repEngine — pure, mutate-in-place, `now` passed in — but a much
 * weaker claim. All this can prove is that a substantial part of the frame kept
 * changing for long enough, in bursts, with real gaps between them. That rules
 * out a phone propped at a wall, a still room, and a thumb over the lens. It
 * cannot tell a squat from a star jump, and the UI must not pretend otherwise.
 *
 * The signal is mean absolute luma difference between consecutive frames,
 * measured against an *adaptive* noise floor rather than a fixed threshold:
 * sensor noise in a dim room is an order of magnitude above sensor noise in
 * daylight, and a fixed threshold would either count noise as movement at night
 * or ignore real movement in a bright room.
 */

/** Rise this far above the floor to start a burst. */
const ACTIVE_ENTER = 0.026;
/** Fall back below this to end it. Hysteresis, so a burst doesn't flicker into
 *  several reps as the movement momentarily slows at its own turning point. */
const ACTIVE_EXIT = 0.013;
/** How fast the noise floor tracks downward toward quiet. Slow, so a long
 *  burst of real movement can't drag the floor up and mask itself. */
const FLOOR_FALL = 0.08;
const FLOOR_RISE = 0.004;
/** A burst shorter than this is a flicker, a passing shadow, or a hand swiped
 *  past the lens. */
const MIN_BURST_MS = 320;
/** Frames must be arriving for this long before anything counts, so the very
 *  first frame-diff (against nothing) is never read as movement. */
const WARMUP_MS = 600;

export type MotionState = {
  activity: ActivityKind;
  reps: number;
  /** Raw mean-abs-difference of the latest frame pair, 0–1. */
  energy: number;
  /** Adaptive noise floor the energy is judged against. */
  floor: number;
  /** 0–1 for the on-screen meter: how close this frame is to counting. */
  level: number;
  /** Mid-burst right now. */
  active: boolean;
  /** Enough frames have arrived to trust the signal. */
  ready: boolean;

  burstStartedAt: number;
  lastRepAt: number;
  firstFrameAt: number;
  /** Bursts thrown away, and why — same coaching contract as repEngine. */
  rejected: number;
  lastRejection: 'none' | 'tooFast' | 'tooShort';
};

export function createMotionState(activity: ActivityKind): MotionState {
  return {
    activity,
    reps: 0,
    energy: 0,
    floor: 0.01,
    level: 0,
    active: false,
    ready: false,
    burstStartedAt: 0,
    lastRepAt: 0,
    firstFrameAt: 0,
    rejected: 0,
    lastRejection: 'none',
  };
}

/** A jumping jack really is about twice as fast as a squat.
 *
 *  These are longer than the pose tier's equivalents on purpose. There, a rep
 *  is bounded by joint angles crossing back through rest, so the clock starts
 *  the moment the body begins to move. Here a rep is bounded by the *pause*
 *  either side of a burst, so the floor has to cover the movement and the beat
 *  of stillness that segments it. */
function minRepMs(activity: ActivityKind): number {
  switch (activity) {
    case 'jumping jacks':
      return 700;
    case 'push-ups':
      return 1300;
    case 'squats':
    default:
      return 1100;
  }
}

/**
 * Mean absolute difference between two equal-length luma buffers, normalized
 * to 0–1. Split out from `feedMotion` so the frame source (a canvas on web, a
 * frame buffer on native) can hand over whatever it already has.
 */
export function frameDifference(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = a[i] - b[i];
    sum += d < 0 ? -d : d;
  }
  return sum / n / 255;
}

/**
 * Advances the burst detector by one frame pair.
 *
 * @returns 1 when this frame closed a countable burst, else 0.
 */
export function feedMotion(s: MotionState, energy: number, now: number): number {
  s.energy = energy;

  if (s.firstFrameAt === 0) {
    s.firstFrameAt = now;
    s.floor = energy;
    return 0;
  }
  s.ready = now - s.firstFrameAt >= WARMUP_MS;

  // Asymmetric floor tracking: drop toward a new quiet level quickly, creep
  // upward slowly. A minute of real movement nudges the floor a few percent;
  // a room going still resets it within a second.
  s.floor += energy < s.floor ? (energy - s.floor) * FLOOR_FALL : (energy - s.floor) * FLOOR_RISE;

  const above = energy - s.floor;
  s.level = Math.max(0, Math.min(1, above / (ACTIVE_ENTER * 2)));

  if (!s.ready) return 0;

  if (!s.active) {
    if (above >= ACTIVE_ENTER) {
      s.active = true;
      s.burstStartedAt = now;
      // `lastRejection` is a verdict on the burst that just *finished*, so it
      // expires the moment a new one starts. Leaving it set outranks the live
      // coaching in motionHint() and tells someone their movement was "too
      // brief" while they are still moving — and since it is only cleared by a
      // counted rep, one stray flicker at the start would pin the wrong message
      // there until the first rep landed. Which is exactly when coaching matters.
      s.lastRejection = 'none';
    }
    return 0;
  }

  if (above > ACTIVE_EXIT) return 0; // still moving

  /* Burst just ended. */
  s.active = false;
  const burstMs = now - s.burstStartedAt;
  const sinceLast = s.lastRepAt === 0 ? Number.MAX_SAFE_INTEGER : now - s.lastRepAt;

  if (burstMs < MIN_BURST_MS) {
    s.rejected++;
    s.lastRejection = 'tooShort';
    return 0;
  }
  if (sinceLast < minRepMs(s.activity)) {
    s.rejected++;
    s.lastRejection = 'tooFast';
    return 0;
  }

  s.reps++;
  s.lastRepAt = now;
  s.lastRejection = 'none';
  return 1;
}

export function motionHint(s: MotionState, now: number): string {
  if (!s.ready) return 'Getting a read on the room…';
  if (s.lastRejection === 'tooShort') return 'Full movements — that was too brief to count.';
  if (s.lastRejection === 'tooFast') return "Slow down, that's faster than a real rep.";
  if (s.active) {
    // A rep here is segmented by the stillness either side of it, so someone
    // flowing straight from one rep into the next reads as a single long burst
    // and their count stalls at one. That is the likeliest way for an honest
    // person to get stuck on this tier, so say so early rather than let them
    // wonder why the number isn't moving.
    if (now - s.burstStartedAt > minRepMs(s.activity) * 2) return 'Pause a beat at the top of each rep.';
    return 'Counting…';
  }
  return 'Move so the camera can see it.';
}
