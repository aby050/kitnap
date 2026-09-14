import type { SharedValue } from 'react-native-reanimated';
/**
 * Shared vocabulary for the Strict-mode physical unlock. Kept in its own file
 * so the pure engines (repEngine, motionEngine, tapGuard) never have to import
 * a React hook or a native module just to name their own inputs.
 */

/** The three movements Family G asks for. Narrow union rather than `string`
 *  so the rep engine's per-activity switches are exhaustive at compile time. */
export type ActivityKind =
  | 'squats'
  | 'jumping jacks'
  | 'push-ups'
  | 'marching'
  | 'arm raises'
  | 'side raises'
  | 'toe touches';

export const ACTIVITY_KINDS: ActivityKind[] = [
  // 'squats' is deliberately absent: the kind stays in `ActivityKind` (the rep
  // engine still knows how to count one, and any saved preference still
  // parses) but it is no longer offered. It is the option people are least
  // willing to do where they actually get stuck — at a desk, on a sofa, near
  // other people — so offering it mostly pushed users to the bailout.
  'jumping jacks',
  'push-ups',
  // The easy end of the ladder. Standing marches and overhead arm raises ask
  // far less than a squat — they can be done in a doorway, in work clothes,
  // in a quiet office, and arm raises work sitting down. Without them the
  // only physical options were three that a lot of people will not do in
  // front of anyone, which is its own way of pushing someone to the token.
  'marching',
  'arm raises',
  'side raises',
  'toe touches',
];

export function isActivityKind(v: string): v is ActivityKind {
  return v === 'squats' || v === 'jumping jacks' || v === 'push-ups';
}

/**
 * How the reps in front of us are actually being measured, best → weakest.
 * This is surfaced in the UI verbatim: the app must never imply it is watching
 * your form when all it has is a button.
 *
 *   pose    on-device pose model, joint angles, real form gating
 *   motion  camera frame differencing — proves movement, not form
 *   manual  you count, with a cadence guard on the taps
 */
export type DetectorTier = 'pose' | 'motion' | 'manual';

/** Why the engine threw a rep away. Surfaced as coaching, not an accusation. */
export type RejectionReason = 'none' | 'tooFast' | 'shallow' | 'lowConfidence' | 'noPerson';

/**
 * What the pose tier reports to the UI each frame.
 *
 * Lives here rather than beside the hook because `usePoseDetector.native.ts`
 * would otherwise have to import from `./usePoseDetector` — which, on native,
 * resolves to itself. Both platform files import the shape from here instead, so
 * they cannot drift apart.
 */
export type PoseDetector = {
  /**
   * Live keypoints for the overlay: `[y, x, score] × 17`, normalized to the
   * model's square input, newest frame wins.
   *
   * A shared value rather than React state on purpose — dots have to follow a
   * body at frame rate, and pushing 51 floats through `setState` 20 times a
   * second would re-render the whole challenge screen for a cosmetic layer.
   * Empty while nothing is tracked.
   */
  keypoints: SharedValue<number[]>;
  /** True only when the native modules loaded *and* frames are arriving now. */
  available: boolean;
  /** Still starting up — distinct from `available: false`, which is final. */
  loading: boolean;
  reps: number;
  /** 0–1 progress through the current rep, for the live meter. */
  progress: number;
  /** Mean form quality of counted reps, 0–1. */
  quality: number;
  /** A person is currently in frame and confidently tracked. */
  tracked: boolean;
  hint: string;
  /**
   * The camera output to attach, or null when this device can't run the tier.
   *
   * Deliberately *not* cleared when the tier stops being trustworthy — see the
   * note in `usePoseDetector.native.ts`. It answers "which camera library owns
   * the device", which has to stay settled for the whole round, while
   * `available` answers "can these reps be believed right now".
   */
  frameHandler: unknown | null;
  reset: () => void;
};

/**
 * What the challenge reports back when it finishes, recorded to
 * `activitySessions` and fed to the next unlock's difficulty calculation.
 */
export type ActivitySessionResult = {
  /** ISO timestamp of when the challenge ended. */
  date: string;
  activity: ActivityKind;
  /** Reps we asked for. */
  target: number;
  /** Reps actually counted. Equals `target` when `completed`. */
  repsCompleted: number;
  /** Mean form quality of the counted reps, 0–1. Only meaningful on the
   *  `pose` tier; 0 elsewhere, so the difficulty model can tell the
   *  difference between "shallow reps" and "we couldn't see your form". */
  formQuality: number;
  tier: DetectorTier;
  durationMs: number;
  /** False when they abandoned, fell back to breathing, or spent a token. */
  completed: boolean;
};
