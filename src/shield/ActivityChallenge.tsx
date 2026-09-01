import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { GateQuestion } from '../data/gateQuestions';
import { Button, Meter, Ring, Stat } from '../design/primitives';
import { palette } from '../design/tokens';
import { tapMedium } from '../ui/haptics';
import BreathingExercise from './BreathingExercise';
import PosePreview from './activity/PosePreview';
import { usePoseDetector } from './activity/usePoseDetector';
import { useCameraMotion } from './activity/useCameraMotion';
import { TapState, createTapState, feedTap, tapHint, tapSetSatisfied } from './activity/tapGuard';
import { ActivityKind, ActivitySessionResult, DetectorTier, isActivityKind } from './activity/types';

/**
 * Hard unlock — Strict mode's physical challenge.
 *
 * Counts reps from whatever evidence the device can actually give us, and says
 * plainly which that is. Three tiers, best available wins:
 *
 *   pose    on-device pose model → joint angles → real rep and form gating
 *   motion  camera frame differencing → proves movement, not form
 *   manual  you count, with a cadence guard so the button can't be mashed
 *
 * Camera denied drops out of the ladder entirely and offers a breathing round
 * instead: the point is a behavioural interruption, not a fight about
 * permissions. Nobody who flagged a physical limitation during onboarding
 * reaches this component at all — they get the quiz rotation (see
 * pickChallenge).
 *
 * The tier is never overstated in the UI. If all we have is a button, the
 * screen says so.
 */

/**
 * How long a camera tier gets to start producing usable frames before we give
 * up on it and count taps instead. Generous enough for a slow camera warm-up on
 * a cold start, short enough that nobody sits staring at a dead meter.
 */
const DETECTOR_DEADLINE_MS = 6000;

type Props = {  q: Extract<GateQuestion, { kind: 'activity' }>;
  onDone: () => void;
  /** Reports the attempt for the adaptive difficulty model. Fires once, on
   *  completion or on falling back to breathing — never on a token skip, which
   *  is not a workout and is handled a level up. */
  onComplete?: (session: ActivitySessionResult) => void;
};

export default function ActivityChallenge({ q, onDone, onComplete }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [fellBackToBreathing, setFellBackToBreathing] = useState(false);

  const activity: ActivityKind = isActivityKind(q.activity) ? q.activity : 'squats';
  const target = Math.max(1, q.reps);

  const startedAt = useRef(Date.now());
  /** onDone is a grant — it must happen exactly once no matter how many times
   *  a detector or a render loop decides the set is finished. */
  const finished = useRef(false);

  /* ── detectors ───────────────────────────────────────────────────────
   * Both hooks are always called (rules of hooks), but each is enabled only
   * when the camera is live and no earlier tier has claimed the round. */
  const cameraLive = !!permission?.granted && !fellBackToBreathing;

  const onRep = useCallback(() => {
    tapMedium();
  }, []);

  const pose = usePoseDetector(activity, cameraLive, onRep);
  const motion = useCameraMotion(activity, cameraLive && !pose.available && !pose.loading, onRep);

  /**
   * A detector that never becomes ready would strand the user on a tier that is
   * never going to count anything — no frames, no reps, no way out but the
   * emergency token. So give the camera tiers a deadline and drop to manual if
   * they miss it. This is the single most important guard in the file: every
   * other failure mode is cosmetic next to being unable to finish the unlock.
   */
  const [stalled, setStalled] = useState(false);
  useEffect(() => {
    if (!cameraLive) return;
    setStalled(false);
    const id = setTimeout(() => setStalled(true), DETECTOR_DEADLINE_MS);
    return () => clearTimeout(id);
  }, [cameraLive, activity]);
  const detectorLive = pose.available || motion.ready;
  const waiting = !detectorLive && !stalled && (pose.loading || motion.error === null);

  /**
   * A camera can come back after we've handed the round to the tap counter — it
   * unfreezes, or another app lets go of it. Upgrading tiers at that point swaps
   * the rep source out from under the user, and any taps they had already earned
   * silently vanish. So once taps are on the board, the manual tier keeps the
   * round. Before that there is nothing to lose, and recovering to a real
   * detector is strictly better.
   */
  const [manualLatched, setManualLatched] = useState(false);

  const tier: DetectorTier = manualLatched
    ? 'manual'
    : pose.available
      ? 'pose'
      : motion.ready
        ? 'motion'
        : waiting
          ? 'motion' // still warming up — don't flicker the UI down a tier
          : 'manual';

  /* ── manual tier ─────────────────────────────────────────────────── */
  const tapRef = useRef<TapState>(createTapState(activity));
  const [tapView, setTapView] = useState({ reps: 0, hint: 'Tap once per rep as you go.' });
  const handleTap = () => {
    const now = Date.now();
    const counted = feedTap(tapRef.current, now);
    if (counted) tapMedium();
    setTapView({ reps: tapRef.current.reps, hint: tapHint(tapRef.current, target, now) });
  };

  // See `manualLatched`. Deliberately keyed on counted taps, not on the tier
  // itself: latching the moment we drop would strand a slow-warming camera on
  // the weakest tier for the whole set.
  useEffect(() => {
    if (tier === 'manual' && tapView.reps > 0) setManualLatched(true);
  }, [tier, tapView.reps]);

  /* ── unified reading, whichever tier is live ─────────────────────── */
  const reps = tier === 'pose' ? pose.reps : tier === 'motion' ? motion.reps : tapView.reps;
  const hint = tier === 'pose' ? pose.hint : tier === 'motion' ? motion.hint : tapView.hint;
  const level = tier === 'pose' ? pose.progress : tier === 'motion' ? motion.level : 0;

  // The manual tier has a whole-set time floor on top of its per-tap floor, so
  // "enough taps" is not the same as "set finished".
  const [, forceTick] = useState(0);
  const satisfied =
    tier === 'manual'
      ? tapSetSatisfied(tapRef.current, target, Date.now())
      : reps >= target;

  // When the taps are in but the clock isn't, tick so the button un-disables
  // on its own rather than waiting for a stray render.
  useEffect(() => {
    if (tier !== 'manual' || satisfied || tapView.reps < target) return;
    const id = setInterval(() => forceTick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [tier, satisfied, tapView.reps, target]);

  const report = useCallback(
    (completed: boolean, atTier: DetectorTier, done: number) => {
      onComplete?.({
        date: new Date().toISOString(),
        activity,
        target,
        repsCompleted: done,
        formQuality: atTier === 'pose' ? pose.quality : 0,
        tier: atTier,
        durationMs: Date.now() - startedAt.current,
        completed,
      });
    },
    [onComplete, activity, target, pose.quality],
  );

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    report(true, tier, reps);
    onDone();
  }, [report, tier, reps, onDone]);

  // Automatic tiers complete themselves — no "Continue" tap to farm.
  useEffect(() => {
    if (tier !== 'manual' && satisfied) finish();
  }, [tier, satisfied, finish]);

  const goBreathing = () => {
    if (!finished.current) {
      finished.current = true;
      report(false, tier, reps);
    }
    setFellBackToBreathing(true);
  };

  if (fellBackToBreathing) {
    return (
      <BreathingExercise
        q={{ family: 'F', kind: 'breathe', prompt: 'Two slow breaths before you go in.', cycles: 2 }}
        onDone={onDone}
      />
    );
  }

  if (!permission) {
    return (
      <View style={styles.qBody}>
        <Text style={styles.prompt}>Checking camera access…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.qBody}>
        <Text style={styles.prompt}>{q.prompt}</Text>
        <Text style={styles.hint}>
          We need the camera up so this can't be skipped from a pocket. Nothing is recorded or leaves your phone.
        </Text>
        <View style={styles.ctaWrap}>
          <Button label="Allow camera" variant="primary" onPress={requestPermission} />
        </View>
        <Pressable onPress={goBreathing} hitSlop={10}>
          <Text style={styles.skip}>Prefer not to — do a breathing round instead</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.qBody}>
      <Text style={styles.prompt}>{q.prompt}</Text>

      <View style={styles.stage}>
        <View style={styles.cameraWrap}>
          <PosePreview frameHandler={pose.frameHandler} deciding={pose.loading} />
        </View>
        <Ring progress={target > 0 ? reps / target : 0} size={118} thickness={6} color={palette.accent}>
          <Stat value={`${reps}`} unit={`/${target}`} align="center" compact />
        </Ring>
      </View>

      {tier !== 'manual' && (
        <View style={styles.meterWrap}>
          <Meter progress={level} color={palette.accent} />
          <Text style={styles.tierNote}>{TIER_NOTE[tier]}</Text>
        </View>
      )}
      {tier === 'manual' && <Text style={styles.tierNote}>{TIER_NOTE.manual}</Text>}

      <Text style={styles.hint}>{hint}</Text>

      {tier === 'manual' && (
        <View style={styles.ctaWrap}>
          <Button
            label={satisfied ? 'Continue' : `Count a ${SINGULAR[activity]}`}
            variant="primary"
            onPress={satisfied ? finish : handleTap}
          />
        </View>
      )}

      <Text style={styles.privacy}>Nothing is recorded or leaves your phone.</Text>
    </View>
  );
}

/** What each tier can honestly claim. Shown verbatim. */
const TIER_NOTE: Record<DetectorTier, string> = {
  pose: 'Camera is checking your form — reps count themselves.',
  motion: 'Camera is watching for movement — reps count themselves.',
  manual: "This device can't watch the movement, so you count. Pace is checked.",
};

const SINGULAR: Record<ActivityKind, string> = {
  squats: 'squat',
  'jumping jacks': 'jack',
  'push-ups': 'push-up',
};

const styles = StyleSheet.create({
  qBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
  prompt: { color: palette.text, fontSize: 23, fontWeight: '700', textAlign: 'center', lineHeight: 31, maxWidth: 320 },
  hint: { color: palette.textTertiary, fontSize: 13, textAlign: 'center', maxWidth: 300, minHeight: 18 },
  stage: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cameraWrap: {
    width: 108,
    height: 144,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: palette.border,
  },
  meterWrap: { width: '100%', maxWidth: 300, gap: 8 },
  tierNote: { color: palette.accentBorder, fontSize: 12, textAlign: 'center', maxWidth: 300 },
  ctaWrap: { width: '100%', maxWidth: 300 },
  privacy: { color: palette.textTertiary, fontSize: 12, textAlign: 'center' },
  skip: { color: palette.textTertiary, fontSize: 13, textDecorationLine: 'underline' },
});
