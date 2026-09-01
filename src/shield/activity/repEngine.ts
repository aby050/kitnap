import { ActivityKind, RejectionReason } from './types';

/**
 * Pose → reps.
 *
 * Pure and worklet-safe by construction: no module imports beyond types, no
 * closures, no `Date.now()` (the caller passes `now`), and no allocation on the
 * hot path — everything is read from and written back into the `RepState` it is
 * handed. That is what lets the same code run inside a VisionCamera frame
 * worklet on the UI thread at 10fps and inside a plain unit check on the JS
 * thread.
 *
 * ── Why a state machine and not a peak detector ────────────────────────────
 * A peak detector on a joint angle counts jitter. Half a squat, a tracking
 * glitch, or a phone knocked sideways all produce peaks. What actually defines
 * a rep is a *completed traversal*: rest → effort → rest, deep enough, slow
 * enough to be a body rather than a model artefact, and with the person still
 * confidently in frame for the whole trip. So the engine tracks the traversal
 * and refuses to emit anything until it closes.
 *
 * Anti-cheat is not a separate layer bolted on top — it is the same set of
 * gates. A propped, empty phone fails presence. A hand waved past the lens
 * fails the joint-confidence check. Bouncing at the knees fails depth. A
 * shaken phone fails the cadence floor. Each of these is a `rejected` rep with
 * a reason the UI can coach on, never a silent no-op.
 */

/* ── Keypoints ────────────────────────────────────────────────────────────
 * MoveNet SinglePose emits 17 COCO keypoints as a flat [y, x, score] triplet
 * run, each normalized 0–1 against the (square) model input. We read that
 * layout directly rather than reshaping it, so a frame processor never has to
 * allocate an intermediate array.
 */

export const KP = {
  nose: 0,
  leftEye: 1,
  rightEye: 2,
  leftEar: 3,
  rightEar: 4,
  leftShoulder: 5,
  rightShoulder: 6,
  leftElbow: 7,
  rightElbow: 8,
  leftWrist: 9,
  rightWrist: 10,
  leftHip: 11,
  rightHip: 12,
  leftKnee: 13,
  rightKnee: 14,
  leftAnkle: 15,
  rightAnkle: 16,
} as const;

export const KEYPOINT_COUNT = 17;

/** A flat MoveNet output: 51 numbers, `[y, x, score] × 17`. */
export type Keypoints = ArrayLike<number>;

/* ── Tuning ───────────────────────────────────────────────────────────────
 * Every number here is a threshold on a *normalized* quantity (degrees, or a
 * fraction of frame height, or a ratio of body widths) so none of them depend
 * on camera resolution or how far away the phone is propped. They are honest
 * starting values derived from the geometry of each movement, and they are the
 * first thing to re-tune on a real device — see PROJECT.md.
 */

/** A joint below this score is treated as not seen at all. */
const JOINT_MIN_SCORE = 0.3;
/** Mean score across an activity's required joints, below which we have no
 *  usable read on the body and the machine parks in `unknown`. */
const PRESENCE_MIN_SCORE = 0.32;
/** Untracked for longer than this and the in-flight rep is discarded — a rep
 *  that spans a tracking hole is not a rep we watched. */
const TRACK_LOST_MS = 1200;
/** You cannot be at the bottom of a squat for zero time. */
const MIN_EFFORT_MS = 180;
/** A traversal open longer than this has been abandoned mid-way. */
const MAX_REP_MS = 20000;
/** Minimum hip drop, as a fraction of frame height, for a squat to count.
 *  This is the gate that a stationary body with a jittering skeleton fails. */
const MIN_HIP_DROP = 0.04;
/** Above this the torso is upright — someone standing and bending their arms,
 *  not doing a push-up. */
const MAX_PUSHUP_VERTICALITY = 0.72;

export type RepPhase = 'unknown' | 'neutral' | 'effort';

export type RepState = {
  activity: ActivityKind;
  /**
   * Multiplier applied to the normalized x before any angle maths. MoveNet
   * sees a square input, so if the frame was squashed rather than letterboxed
   * into it, x is compressed by the frame's aspect ratio and every angle is
   * wrong in the same direction. The caller supplies the correction; 1 is
   * right for a letterboxed square crop.
   */
  xScale: number;

  /* Live, for the UI */
  reps: number;
  phase: RepPhase;
  /** Current effort metric, 0 at rest rising toward ~100+ at full depth.
   *  Drives the on-screen meter, so it is deliberately in one shared range
   *  across all three activities. */
  metric: number;
  /** Mean score of this activity's required joints, 0–1. */
  confidence: number;
  /** A person is confidently in frame right now. */
  tracked: boolean;

  /* In-flight traversal */
  peakMetric: number;
  /** Frame-space y of the hip midpoint when this traversal left rest. */
  neutralHipY: number;
  peakHipY: number;
  /** When the metric first rose out of the rest band — the true start of the
   *  rep, including the descent, not just the moment full depth was reached. */
  leftRestAt: number;
  effortEnteredAt: number;
  repStartedAt: number;
  lostTrackingSince: number;

  /* Tallies */
  /** Sum of per-rep quality; divide by `reps` for the mean. */
  qualitySum: number;
  rejected: number;
  lastRejection: RejectionReason;
  lastRepAt: number;
};

export function createRepState(activity: ActivityKind, xScale: number = 1): RepState {
  'worklet';
  return {
    activity,
    xScale,
    reps: 0,
    phase: 'unknown',
    metric: 0,
    confidence: 0,
    tracked: false,
    peakMetric: 0,
    neutralHipY: 0,
    peakHipY: 0,
    leftRestAt: 0,
    effortEnteredAt: 0,
    repStartedAt: 0,
    lostTrackingSince: 0,
    qualitySum: 0,
    rejected: 0,
    lastRejection: 'none',
    lastRepAt: 0,
  };
}

/** Drops the in-flight traversal without touching the rep tally. */
export function abortTraversal(s: RepState): void {
  'worklet';
  s.phase = 'unknown';
  s.peakMetric = 0;
  s.leftRestAt = 0;
  s.effortEnteredAt = 0;
  s.repStartedAt = 0;
  s.neutralHipY = 0;
  s.peakHipY = 0;
}

/** Mean form quality of the counted reps, 0–1. 0 when nothing has counted. */
export function meanQuality(s: RepState): number {
  'worklet';
  return s.reps > 0 ? s.qualitySum / s.reps : 0;
}

/* ── Geometry ─────────────────────────────────────────────────────────── */

function y(k: Keypoints, i: number): number {
  'worklet';
  return k[i * 3];
}

function x(k: Keypoints, i: number): number {
  'worklet';
  return k[i * 3 + 1];
}

function score(k: Keypoints, i: number): number {
  'worklet';
  return k[i * 3 + 2];
}

function clamp01(v: number): number {
  'worklet';
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Interior angle at B, in degrees, for the path A→B→C. */
function angleAt(
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): number {
  'worklet';
  const abx = ax - bx;
  const aby = ay - by;
  const cbx = cx - bx;
  const cby = cy - by;
  const magAB = Math.sqrt(abx * abx + aby * aby);
  const magCB = Math.sqrt(cbx * cbx + cby * cby);
  // Degenerate limb (two joints predicted on top of each other) — report
  // "straight" rather than a wild value, so it reads as rest, not as effort.
  if (magAB < 1e-6 || magCB < 1e-6) return 180;
  let cos = (abx * cbx + aby * cby) / (magAB * magCB);
  if (cos > 1) cos = 1;
  else if (cos < -1) cos = -1;
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Flexion at a joint: 0 when the limb is straight, rising as it folds. */
function flexionAt(
  k: Keypoints, xs: number,
  a: number, b: number, c: number,
): number {
  'worklet';
  return 180 - angleAt(x(k, a) * xs, y(k, a), x(k, b) * xs, y(k, b), x(k, c) * xs, y(k, c));
}

function allSeen3(k: Keypoints, a: number, b: number, c: number): boolean {
  'worklet';
  return score(k, a) >= JOINT_MIN_SCORE && score(k, b) >= JOINT_MIN_SCORE && score(k, c) >= JOINT_MIN_SCORE;
}

function dist(
  ax: number, ay: number,
  bx: number, by: number,
): number {
  'worklet';
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

/* ── Per-activity presence and effort metric ──────────────────────────────
 * Each activity reduces the skeleton to one scalar in a shared 0–100+ range
 * where 0 is rest and bigger is deeper into the movement, which is what lets
 * one state machine drive all three.
 */

/** Mean score over the joints this activity actually depends on. */
function presenceScore(s: RepState, k: Keypoints): number {
  'worklet';
  let sum = 0;
  let n = 0;
  if (s.activity === 'squats') {
    // Legs and hips. The upper body may well be cropped out of frame.
    const idx = [KP.leftHip, KP.rightHip, KP.leftKnee, KP.rightKnee, KP.leftAnkle, KP.rightAnkle];
    for (let i = 0; i < idx.length; i++) { sum += score(k, idx[i]); n++; }
  } else if (s.activity === 'push-ups') {
    const idx = [KP.leftShoulder, KP.rightShoulder, KP.leftElbow, KP.rightElbow, KP.leftWrist, KP.rightWrist, KP.leftHip, KP.rightHip];
    for (let i = 0; i < idx.length; i++) { sum += score(k, idx[i]); n++; }
  } else {
    const idx = [KP.leftShoulder, KP.rightShoulder, KP.leftWrist, KP.rightWrist, KP.leftHip, KP.rightHip, KP.leftAnkle, KP.rightAnkle];
    for (let i = 0; i < idx.length; i++) { sum += score(k, idx[i]); n++; }
  }
  return n > 0 ? sum / n : 0;
}

/**
 * Knee flexion, averaged over whichever legs are actually visible. Standing is
 * ~0–15; a parallel squat is ~90–110.
 */
function squatMetric(s: RepState, k: Keypoints): number {
  'worklet';
  const xs = s.xScale;
  const left = allSeen3(k, KP.leftHip, KP.leftKnee, KP.leftAnkle);
  const right = allSeen3(k, KP.rightHip, KP.rightKnee, KP.rightAnkle);
  if (left && right) {
    return (
      flexionAt(k, xs, KP.leftHip, KP.leftKnee, KP.leftAnkle) +
      flexionAt(k, xs, KP.rightHip, KP.rightKnee, KP.rightAnkle)
    ) / 2;
  }
  if (left) return flexionAt(k, xs, KP.leftHip, KP.leftKnee, KP.leftAnkle);
  if (right) return flexionAt(k, xs, KP.rightHip, KP.rightKnee, KP.rightAnkle);
  return -1; // not measurable
}

/**
 * Elbow flexion, averaged over visible arms. Locked out at the top is ~0–20;
 * chest-to-floor is ~90–110.
 */
function pushupMetric(s: RepState, k: Keypoints): number {
  'worklet';
  const xs = s.xScale;
  const left = allSeen3(k, KP.leftShoulder, KP.leftElbow, KP.leftWrist);
  const right = allSeen3(k, KP.rightShoulder, KP.rightElbow, KP.rightWrist);
  if (left && right) {
    return (
      flexionAt(k, xs, KP.leftShoulder, KP.leftElbow, KP.leftWrist) +
      flexionAt(k, xs, KP.rightShoulder, KP.rightElbow, KP.rightWrist)
    ) / 2;
  }
  if (left) return flexionAt(k, xs, KP.leftShoulder, KP.leftElbow, KP.leftWrist);
  if (right) return flexionAt(k, xs, KP.rightShoulder, KP.rightElbow, KP.rightWrist);
  return -1;
}

/**
 * How upright the torso is, 0 (horizontal, a plank) → 1 (vertical, standing).
 * The gate that separates a push-up from standing arm curls.
 */
function torsoVerticality(s: RepState, k: Keypoints): number {
  'worklet';
  const shX = (x(k, KP.leftShoulder) + x(k, KP.rightShoulder)) / 2 * s.xScale;
  const shY = (y(k, KP.leftShoulder) + y(k, KP.rightShoulder)) / 2;
  const hipX = (x(k, KP.leftHip) + x(k, KP.rightHip)) / 2 * s.xScale;
  const hipY = (y(k, KP.leftHip) + y(k, KP.rightHip)) / 2;
  const dy = Math.abs(shY - hipY);
  const dx = Math.abs(shX - hipX);
  const total = dy + dx;
  return total < 1e-6 ? 1 : dy / total;
}

/**
 * Jumping-jack openness, 0 (arms down, feet together) → ~100 (arms overhead,
 * feet wide). Half from the legs, half from the arms, so waving your arms
 * without moving your feet tops out at 50 and never crosses the effort line.
 * Both terms are normalized against the body itself — shoulder width and torso
 * length — so it holds at any distance from the camera.
 */
function jackMetric(s: RepState, k: Keypoints): number {
  'worklet';
  const xs = s.xScale;
  const shLX = x(k, KP.leftShoulder) * xs;
  const shRX = x(k, KP.rightShoulder) * xs;
  const shLY = y(k, KP.leftShoulder);
  const shRY = y(k, KP.rightShoulder);
  const shoulderWidth = Math.abs(shLX - shRX);
  const shMidY = (shLY + shRY) / 2;

  const hipMidX = (x(k, KP.leftHip) + x(k, KP.rightHip)) / 2 * xs;
  const hipMidY = (y(k, KP.leftHip) + y(k, KP.rightHip)) / 2;
  const shMidX = (shLX + shRX) / 2;
  const torsoLen = dist(shMidX, shMidY, hipMidX, hipMidY);

  if (shoulderWidth < 1e-3 || torsoLen < 1e-3) return -1;

  // Legs: ankle spread relative to shoulder width. Together ≈ 0.4–0.9,
  // jacked out ≈ 1.6–2.4.
  let legTerm = 0;
  if (score(k, KP.leftAnkle) >= JOINT_MIN_SCORE && score(k, KP.rightAnkle) >= JOINT_MIN_SCORE) {
    const spread = Math.abs(x(k, KP.leftAnkle) * xs - x(k, KP.rightAnkle) * xs) / shoulderWidth;
    legTerm = clamp01((spread - 0.9) / 0.8);
  }

  // Arms: how far the wrists sit above the shoulder line, in torso lengths.
  // Hands at the hips is negative; hands overhead is ~0.6–1.0.
  let armTerm = 0;
  let armSeen = 0;
  let armSum = 0;
  if (score(k, KP.leftWrist) >= JOINT_MIN_SCORE) { armSum += (shMidY - y(k, KP.leftWrist)) / torsoLen; armSeen++; }
  if (score(k, KP.rightWrist) >= JOINT_MIN_SCORE) { armSum += (shMidY - y(k, KP.rightWrist)) / torsoLen; armSeen++; }
  if (armSeen > 0) armTerm = clamp01((armSum / armSeen + 0.2) / 0.7);

  return 50 * legTerm + 50 * armTerm;
}

/** Metric value at or below which the body is at rest. */
function neutralBelow(activity: ActivityKind): number {
  'worklet';
  if (activity === 'squats') return 22;
  if (activity === 'push-ups') return 25;
  return 25;
}

/** Metric value at or above which the movement counts as performed. */
function effortAbove(activity: ActivityKind): number {
  'worklet';
  if (activity === 'squats') return 78;
  if (activity === 'push-ups') return 82;
  return 68;
}

/** Metric value representing a textbook-depth rep — the top of the quality
 *  scale, not a requirement. */
function fullDepth(activity: ActivityKind): number {
  'worklet';
  if (activity === 'squats') return 108;
  if (activity === 'push-ups') return 100;
  return 94;
}

/**
 * Floor on a whole rest → effort → rest traversal. Below this it is a shake, a
 * bounce, or a dropped phone rather than a repetition. Per-activity because a
 * jumping jack genuinely is about twice as fast as a squat, and a single global
 * floor would either wave shaking through or reject real jacks.
 */
function minRepMs(activity: ActivityKind): number {
  'worklet';
  if (activity === 'jumping jacks') return 500;
  return 700;
}

/** Hip midpoint y, or -1 when the hips aren't visible. */
function hipMidY(k: Keypoints): number {
  'worklet';
  const l = score(k, KP.leftHip) >= JOINT_MIN_SCORE;
  const r = score(k, KP.rightHip) >= JOINT_MIN_SCORE;
  if (l && r) return (y(k, KP.leftHip) + y(k, KP.rightHip)) / 2;
  if (l) return y(k, KP.leftHip);
  if (r) return y(k, KP.rightHip);
  return -1;
}

/* ── The state machine ────────────────────────────────────────────────── */

/**
 * Advances the machine by one frame.
 *
 * @param s   mutated in place — live fields (`reps`, `metric`, `phase`,
 *            `confidence`, `tracked`, `lastRejection`) are all readable after.
 * @param k   flat MoveNet output, `[y, x, score] × 17`.
 * @param now monotonic-ish milliseconds. Supplied rather than read so this
 *            stays pure and worklet-safe.
 * @returns 1 when this frame closed a valid rep, else 0. The caller uses the
 *          return to fire a haptic exactly once per rep.
 */
export function feedPose(s: RepState, k: Keypoints, now: number): number {
  'worklet';

  const presence = presenceScore(s, k);
  s.confidence = presence;
  const wasTracked = s.tracked;
  s.tracked = presence >= PRESENCE_MIN_SCORE;

  if (!s.tracked) {
    // Nobody credibly in frame. Hold the tally, drop anything in flight once
    // the gap is long enough that we can't vouch for the movement across it.
    //
    // Note the `phase !== 'unknown'` guard: this reports losing someone we had,
    // not never having found them. A phone propped at a wall from the start
    // stays in `unknown` and sets no rejection at all — so a caller building a
    // coaching line must read `tracked` directly for that case rather than
    // relying on `lastRejection` to say "step into frame".
    if (wasTracked || s.lostTrackingSince === 0) s.lostTrackingSince = now;
    if (now - s.lostTrackingSince > TRACK_LOST_MS && s.phase !== 'unknown') {
      abortTraversal(s);
      s.lastRejection = 'noPerson';
    }
    s.metric = 0;
    return 0;
  }
  s.lostTrackingSince = 0;

  const raw =
    s.activity === 'squats' ? squatMetric(s, k)
    : s.activity === 'push-ups' ? pushupMetric(s, k)
    : jackMetric(s, k);

  if (raw < 0) {
    // Person is there but the specific limbs we need are not — e.g. knees out
    // of frame. Freeze rather than guess.
    s.lastRejection = 'lowConfidence';
    return 0;
  }
  s.metric = raw;

  // `noPerson` and `lowConfidence` describe the *live* view rather than a
  // verdict on a rep, so they expire the instant the view is good again —
  // otherwise "step back into frame" stays on screen while the person is
  // standing in it. Reached only once we have both a tracked body and a
  // measurable metric, which is precisely when both conditions are false.
  if (s.lastRejection === 'noPerson' || s.lastRejection === 'lowConfidence') s.lastRejection = 'none';

  // Push-ups have one extra hard gate: the body has to be horizontal. Checked
  // before the FSM so an upright bend never even opens a traversal.
  if (s.activity === 'push-ups' && torsoVerticality(s, k) > MAX_PUSHUP_VERTICALITY) {
    if (s.phase !== 'unknown') {
      abortTraversal(s);
      s.rejected++;
      s.lastRejection = 'shallow';
    }
    return 0;
  }

  const rest = neutralBelow(s.activity);
  const work = effortAbove(s.activity);
  const hy = hipMidY(k);

  // A traversal left open far too long was abandoned, not performed.
  if (s.phase === 'effort' && s.repStartedAt > 0 && now - s.repStartedAt > MAX_REP_MS) {
    abortTraversal(s);
  }

  if (s.phase === 'unknown') {
    // Only ever join the machine at rest. Starting mid-movement would let the
    // very first partial rep count.
    if (raw <= rest) {
      s.phase = 'neutral';
      s.neutralHipY = hy;
      s.peakMetric = 0;
      s.peakHipY = hy;
      s.leftRestAt = 0;
    }
    return 0;
  }

  if (s.phase === 'neutral') {
    if (raw >= work) {
      // Into the effort. `neutralHipY` already holds the resting hip line and
      // must not be overwritten with the hip position we see *now* — by this
      // frame the body has already moved, which would zero out the hip-drop
      // check that makes the squat gate work.
      s.phase = 'effort';
      s.effortEnteredAt = now;
      s.repStartedAt = s.leftRestAt > 0 ? s.leftRestAt : now;
      s.peakMetric = raw;
      s.peakHipY = hy;
      // Deliberately does *not* clear `lastRejection`. A form or cadence verdict
      // ("sit lower", "slow it down") is most useful while they are performing
      // the next rep, which is exactly this moment — and it is cleared by the
      // next rep that counts, so it can never outlive its usefulness. Only the
      // live-view reasons expire on their own, above.
    } else if (raw <= rest) {
      // Genuinely still at rest: keep the reference hip line current, in case
      // they shuffle their feet between reps.
      if (hy >= 0) s.neutralHipY = hy;
      s.leftRestAt = 0;
    } else if (s.leftRestAt === 0) {
      // On the way down. This is where the rep clock starts, so a slow
      // descent counts toward the cadence floor rather than against it.
      s.leftRestAt = now;
    }
    return 0;
  }

  /* phase === 'effort' */
  if (raw > s.peakMetric) s.peakMetric = raw;
  if (hy >= 0 && hy > s.peakHipY) s.peakHipY = hy;

  if (raw > rest) return 0; // still down, or on the way up

  // Back at rest — the traversal has closed. Now decide whether it was a rep.
  const effortMs = now - s.effortEnteredAt;
  const repMs = now - s.repStartedAt;

  if (effortMs < MIN_EFFORT_MS || repMs < minRepMs(s.activity)) {
    s.rejected++;
    s.lastRejection = 'tooFast';
    s.phase = 'neutral';
    s.peakMetric = 0;
    s.leftRestAt = 0;
    s.neutralHipY = hy;
    s.peakHipY = hy;
    return 0;
  }

  // Squats additionally have to show the hips actually travelling down the
  // frame. This is what a stationary body with a noisy skeleton cannot fake.
  if (s.activity === 'squats' && s.neutralHipY >= 0 && s.peakHipY >= 0) {
    if (s.peakHipY - s.neutralHipY < MIN_HIP_DROP) {
      s.rejected++;
      s.lastRejection = 'shallow';
      s.phase = 'neutral';
      s.peakMetric = 0;
      s.leftRestAt = 0;
      s.neutralHipY = hy;
      s.peakHipY = hy;
      return 0;
    }
  }

  // Counted. Quality is how far past the effort line the deepest point got:
  // clearing the bar is 0.5, textbook depth is 1.0.
  const span = fullDepth(s.activity) - work;
  const quality = 0.5 + 0.5 * clamp01(span > 0 ? (s.peakMetric - work) / span : 1);
  s.reps++;
  s.qualitySum += quality;
  s.lastRepAt = now;
  s.lastRejection = 'none';
  s.phase = 'neutral';
  s.peakMetric = 0;
  s.leftRestAt = 0;
  s.neutralHipY = hy;
  s.peakHipY = hy;
  return 1;
}

/** 0–1 fill for the live effort meter. */
export function effortProgress(s: RepState): number {
  'worklet';
  const work = effortAbove(s.activity);
  return clamp01(s.metric / work);
}

/** Human coaching for the last rejection, or '' when there's nothing to say. */
export function rejectionHint(reason: RejectionReason, activity: ActivityKind): string {
  if (reason === 'tooFast') return 'Too quick to count — slow it down.';
  if (reason === 'shallow') {
    if (activity === 'squats') return "Didn't go deep enough — sit lower.";
    if (activity === 'push-ups') return 'Chest lower, and keep your body flat.';
    return 'Arms all the way overhead, feet all the way out.';
  }
  if (reason === 'lowConfidence') return "Can't see enough of you — step back a little.";
  if (reason === 'noPerson') return 'Step back into frame.';
  return '';
}
