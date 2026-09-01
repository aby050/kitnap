/**
 * Turns a camera's presentation timestamps into milliseconds.
 *
 * `Frame.timestamp` is documented only as "the presentation timestamp this Frame
 * was timed at" — no unit. In practice it is seconds on one platform and
 * nanoseconds on another, and neither is promised. The rep engine gates on real
 * durations (a 180ms minimum effort, a 700ms minimum rep), so guessing wrong by
 * a factor of a thousand would either reject every rep as too fast or accept a
 * shaken phone as a workout.
 *
 * The obvious alternative — ignore the camera clock and call `Date.now()` when
 * the frame reaches the JS thread — is worse than it looks. Frames arrive on a
 * separate thread and hand off asynchronously, so a busy moment delivers several
 * callbacks in a burst with nearly identical wall-clock readings. That compresses
 * apparent cadence and trips the "too quick to count" guard on honest reps.
 *
 * So: infer the unit. Consecutive frames from any real camera are a few
 * milliseconds to a few hundred milliseconds apart, and the plausible units are
 * spaced a thousand-fold apart, so exactly one candidate can put the observed
 * interval inside that window. Measure a handful of intervals, pick the one that
 * fits, and fall back to the wall clock if none does.
 *
 * Pure and dependency-free so it can be checked without a camera.
 */

/** Multipliers from a candidate unit to milliseconds: s, ms, µs, ns. */
const SCALES = [1000, 1, 1e-3, 1e-6];

/* The plausible band for the gap between two consecutive frames. Deliberately
 * generous at both ends — a thermally throttled phone can crawl, and a
 * high-speed sensor can sprint — but still far narrower than the thousand-fold
 * spacing between candidate units, which is what guarantees at most one fit. */
const MIN_INTERVAL_MS = 4;
const MAX_INTERVAL_MS = 250;

/** Intervals to observe before committing to a unit. Small: this delays the
 *  first counted rep, and the wall clock covers the gap meanwhile. */
const SAMPLES = 5;

export type FrameClock = {
  /** Multiplier from raw units to ms. 0 while calibrating, -1 once we've given
   *  up and settled on the wall clock. */
  scale: number;
  /** Observed raw intervals, until calibration completes. */
  intervals: number[];
  lastRaw: number;
  /** Raw and wall-clock readings at the moment we locked on, so mapped time
   *  continues smoothly from whatever the wall clock had been reporting. */
  originRaw: number;
  originMs: number;
};

export function createFrameClock(): FrameClock {
  return { scale: 0, intervals: [], lastRaw: -1, originRaw: 0, originMs: 0 };
}

function median(xs: number[]): number {
  const sorted = xs.slice().sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Maps one raw timestamp to milliseconds.
 *
 * @param raw    the frame's presentation timestamp, in whatever unit it uses.
 * @param wallMs `Date.now()`, used while calibrating and as the fallback.
 * @returns milliseconds on a monotonic-enough timeline for cadence gating.
 */
export function frameNow(c: FrameClock, raw: number, wallMs: number): number {
  if (c.scale > 0) return (raw - c.originRaw) * c.scale + c.originMs;
  if (c.scale < 0) return wallMs;

  // A zero or backwards timestamp means an invalid frame or a source that
  // restarted its clock. Neither is evidence about the unit, so drop the
  // interval and re-anchor rather than feeding a wild sample into the median.
  if (raw > 0 && c.lastRaw > 0 && raw > c.lastRaw) {
    c.intervals.push(raw - c.lastRaw);
  }
  c.lastRaw = raw;

  if (c.intervals.length >= SAMPLES) {
    // The median, not the mean: one dropped frame doubles an interval, and one
    // outlier would otherwise be enough to push a correct unit out of the band.
    const typical = median(c.intervals);
    for (let i = 0; i < SCALES.length; i++) {
      const ms = typical * SCALES[i];
      if (ms >= MIN_INTERVAL_MS && ms <= MAX_INTERVAL_MS) {
        c.scale = SCALES[i];
        c.originRaw = raw;
        c.originMs = wallMs;
        c.intervals = [];
        return wallMs;
      }
    }
    // Nothing fit. Either the source's timestamps are not a clock at all, or
    // frames are arriving so erratically that no unit is distinguishable. The
    // wall clock is imprecise but never wrong by orders of magnitude, so take
    // it and stop asking.
    c.scale = -1;
    c.intervals = [];
  }

  return wallMs;
}
