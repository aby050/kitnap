import { ActivityKind, ActivitySessionResult } from '../shield/activity/types';

/**
 * How many reps this unlock should cost.
 *
 * The number has to earn its authority. Too low and Strict mode is theatre; too
 * high and people stop using the app rather than do the reps — which is the
 * worse failure, because an uninstalled app blocks nothing. So this leans on
 * evidence in a fixed order of confidence:
 *
 *   1. What this person has actually completed recently (strongest signal)
 *   2. Their age band (a real constraint, not a guess)
 *   3. Time of day, and whether they told us life is hard right now (nudges)
 *
 * Everything is clamped into a per-activity band, so no combination of inputs
 * can produce a target that's trivial or punishing.
 */

/** Floors and caps per movement. A push-up is not a squat. */
const BANDS: Record<ActivityKind, { min: number; max: number; base: number }> = {
  squats: { min: 6, max: 20, base: 10 },
  'jumping jacks': { min: 6, max: 20, base: 12 },
  'push-ups': { min: 4, max: 15, base: 8 },
  // Easy movements, so the counts run higher — the ask is still a real minute
  // of moving, just a far more approachable one.
  marching: { min: 10, max: 40, base: 20 },
  // Arm raises are the least demanding movement in the set, so the count is
  // the thing that makes it a real minute of effort rather than a formality.
  'arm raises': { min: 40, max: 70, base: 50 },
  'side raises': { min: 30, max: 60, base: 40 },
  'toe touches': { min: 10, max: 30, base: 15 },
};

/** How far back the history signal looks. */
const HISTORY_WINDOW = 8;
/** Sessions needed before history overrides the age-based starting point. */
const HISTORY_MIN = 3;

export type RepTargetInput = {
  activity: ActivityKind;
  /** From onboarding; undefined or unparseable falls back to the base target. */
  age?: number;
  /** Newest last. Only same-activity entries are considered. */
  history?: ActivitySessionResult[];
  /** Injected rather than read from the clock, so this stays pure and testable. */
  now: Date;
  /** True when they told us something major changed recently. */
  lifeChange?: boolean;
  /** What they said in onboarding they could do in ONE go, for this movement.
   *  Used only until real history exists — see the note in computeRepTarget. */
  baseline?: number;
};

export type RepTarget = {
  reps: number;
  /** Plain-language reasons, newest signal first. Shown nowhere by default, but
   *  available for a "why this number?" affordance and invaluable in support. */
  reasons: string[];
};

function clampToBand(n: number, activity: ActivityKind): number {
  const band = BANDS[activity];
  return Math.max(band.min, Math.min(band.max, Math.round(n)));
}

/**
 * Age bands, as a multiplier on the base target. Deliberately gentle at both
 * ends: a 15-year-old is not necessarily fitter than a 40-year-old, and the
 * point is friction, not a fitness test.
 */
function ageFactor(age: number | undefined): { factor: number; reason: string | null } {
  if (age === undefined || !Number.isFinite(age)) return { factor: 1, reason: null };
  if (age >= 65) return { factor: 0.6, reason: 'gentler target for your age' };
  if (age >= 50) return { factor: 0.8, reason: 'slightly gentler for your age' };
  if (age >= 35) return { factor: 0.95, reason: null };
  if (age >= 18) return { factor: 1, reason: null };
  return { factor: 0.85, reason: 'gentler target while you are still growing' };
}

/** Share of a declared one-go maximum to ask for on a single unlock.
 *
 *  Not 100%: the unlock has to be completable on the tenth try of a bad day,
 *  not just on the day they were feeling strong enough to claim a number.
 *  Asking someone for their true maximum every time they want their phone is
 *  how the app gets deleted. 60% is real effort that still finishes. */
const BASELINE_SHARE = 0.6;

export function computeRepTarget(input: RepTargetInput): RepTarget {
  const { activity, age, history, now, lifeChange, baseline } = input;
  const band = BANDS[activity];
  const reasons: string[] = [];

  const age0 = ageFactor(age);
  if (age0.reason) reasons.push(age0.reason);
  /* Start from what THIS person said they can do, not from a generic band
   * base. The band base is an average of nobody: it gives the same first
   * challenge to someone who can do 3 push-ups and someone who can do 30, and
   * exactly one of them completes it. The declared baseline is replaced by
   * real history as soon as there is any — it is a starting point, not a
   * claim the app keeps trusting. */
  let target = band.base * age0.factor;
  if (baseline && Number.isFinite(baseline) && baseline > 0) {
    target = baseline * BASELINE_SHARE * age0.factor;
    reasons.push('based on what you said you can do');
  }

  /* ── 1. Recent performance, same movement ─────────────────────────── */
  const recent = (history ?? [])
    .filter((s) => s.activity === activity)
    .slice(-HISTORY_WINDOW);

  if (recent.length >= HISTORY_MIN) {
    const completions = recent.filter((s) => s.completed).length;
    const ratio = completions / recent.length;
    // Anchor on what they last managed rather than the generic base — this is
    // the only signal that reflects the actual person.
    const meanTarget = recent.reduce((a, s) => a + s.target, 0) / recent.length;
    target = meanTarget;

    if (ratio >= 0.9) {
      target = meanTarget * 1.15;
      reasons.unshift("you've been finishing these comfortably");
    } else if (ratio <= 0.4) {
      target = meanTarget * 0.8;
      reasons.unshift("we've eased off — these were going unfinished");
    } else {
      reasons.unshift('held steady at your recent level');
    }

    // Form is only observable on the pose tier, where 0 means "not measured".
    // Shallow-but-counted reps mean the target is too high for good form, so
    // trade reps for depth rather than piling more on.
    const measured = recent.filter((s) => s.formQuality > 0);
    if (measured.length >= HISTORY_MIN) {
      const meanForm = measured.reduce((a, s) => a + s.formQuality, 0) / measured.length;
      if (meanForm < 0.6) {
        target *= 0.85;
        reasons.push('fewer reps, so you can go deeper on each');
      }
    }
  } else if (recent.length > 0) {
    reasons.push('still learning what works for you');
  }

  /* ── 2. Nudges ────────────────────────────────────────────────────── */
  const hour = now.getHours();
  if (hour < 7 || hour >= 23) {
    target *= 0.8;
    reasons.push('lighter at this hour');
  }

  if (lifeChange) {
    target *= 0.85;
    reasons.push('going easier on you right now');
  }

  return { reps: clampToBand(target, activity), reasons };
}

/**
 * Reads the onboarding `age` answer, which is stored as a display string.
 * Returns undefined rather than a guess when it can't be parsed.
 */
export function parseAge(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 5 || n > 120) return undefined;
  return n;
}

/**
 * True only for a clear "yes". The question is optional and has an explicit
 * "I'd rather not say", neither of which is a yes.
 */
export function parseLifeChange(raw: string | undefined): boolean {
  if (!raw) return false;
  return raw.toLowerCase().startsWith('yes');
}
