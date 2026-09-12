import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { CommonResolutions, useFrameOutput, type Frame } from 'react-native-vision-camera';
import { useResizer } from 'react-native-vision-camera-resizer';
import { loadTensorflowModel, type TfliteModel } from 'react-native-fast-tflite';
import { scheduleOnRN } from 'react-native-worklets';
import { createFrameClock, frameNow, type FrameClock } from './frameClock';
import { POSE_INPUT, POSE_X_SCALE, readKeypoints, validatePoseModel } from './poseModel';
import { resolvePoseModel } from './poseModelSource';
import {
  createRepState,
  effortProgress,
  feedPose,
  meanQuality,
  rejectionHint,
  type RepState,
} from './repEngine';
import { ActivityKind, PoseDetector } from './types';

/**
 * Tier 1: a real pose model watching the movement.
 *
 * Camera frame → GPU resize to the model's 192×192 RGB input → MoveNet →
 * 17 joints → the rep state machine in `repEngine`. Reps count themselves, depth
 * is measured, and a phone propped at an empty wall counts nothing.
 *
 * ## Thin worklet, stateful JS
 *
 * Only the per-frame pixel work happens on the camera thread: resize, infer,
 * copy out 51 floats, hand them over. The rep state machine stays on the JS
 * thread with the frame clock and the React mirror.
 *
 * That split is deliberate. The state machine is a long-lived mutable object
 * accumulating one traversal across dozens of frames, and a worklet's captured
 * values are not a reliable place to keep something like that — a state object
 * that silently re-hydrated each frame would reset the traversal every time and
 * never count a rep, which is a bug that only shows up on a device. On the JS
 * thread it is an ordinary ref, `feedPose` runs exactly as it was tested, and
 * haptics fire from where haptics are allowed to fire. Fifty-one numbers at
 * fifteen frames a second is not a bridge cost worth optimizing against that.
 *
 * ## How this fails
 *
 * Every failure path here ends at "no reps counted", never at "reps counted
 * wrongly": no model file, a model of the wrong shape, no GPU resizer, a worklet
 * that throws, a camera that freezes. All of them stop keypoints arriving, the
 * watchdog notices within `STALL_MS`, `available` goes false, and the challenge
 * hands the round to the tap counter. The user always has a way to finish.
 */

/**
 * A frame source showing no sign of advancing for this long is frozen, not
 * quiet. Matched to `useCameraMotion.web.ts` so both camera tiers hand the round
 * over on the same schedule, well inside the caller's detector deadline.
 */
const STALL_MS = 2500;

/**
 * Analysis resolution. Downscaled to 192×192 immediately, so anything larger is
 * memory bandwidth spent to be thrown away. 4:3 rather than 16:9 on purpose: in
 * portrait it is the taller framing, and a squat is measured by where the ankles
 * and hips are.
 */
const TARGET_RESOLUTION = CommonResolutions.VGA_4_3;

/** How often the React mirror is allowed to update when nothing notable
 *  happened, in frames. Reps and rejections always mirror immediately. */
const MIRROR_EVERY = 3;

type Status = 'idle' | 'loading' | 'ready' | 'unavailable';

function poseHint(s: RepState): string {
  // `tracked` is read before `lastRejection` because the engine cannot report
  // `noPerson` for someone it never found — a phone facing an empty room stays
  // in `unknown` and sets no rejection at all. See the note in `repEngine`.
  if (!s.tracked) return 'Step back so your whole body is in frame.';
  if (s.lastRejection !== 'none') return rejectionHint(s.lastRejection, s.activity);
  if (s.reps === 0) return 'Got you. Go when you’re ready.';
  return '';
}

export function usePoseDetector(
  activity: ActivityKind,
  enabled: boolean,
  onRep?: () => void,
): PoseDetector {
  const stateRef = useRef<RepState>(createRepState(activity, POSE_X_SCALE));
  const clockRef = useRef<FrameClock>(createFrameClock());
  /** Wall-clock time of the last keypoints that arrived, for the watchdog. */
  const liveRef = useRef(0);
  const tickRef = useRef(0);
  const onRepRef = useRef(onRep);
  onRepRef.current = onRep;

  const [status, setStatus] = useState<Status>('idle');
  const [model, setModel] = useState<TfliteModel | null>(null);
  const [framesSeen, setFramesSeen] = useState(false);
  const [stalled, setStalled] = useState(false);
  const [mirror, setMirror] = useState({
    reps: 0,
    progress: 0,
    quality: 0,
    tracked: false,
    hint: '',
  });

  const { resizer, error: resizerError } = useResizer(POSE_INPUT);

  /* ── model ───────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setStatus('loading');

    (async () => {
      const uri = await resolvePoseModel();
      if (cancelled) return;
      if (!uri) {
        // Expected on any install where nobody supplied the model. Not a
        // warning — see `poseModelSource` for why it isn't bundled.
        setStatus('unavailable');
        return;
      }
      try {
        // CPU delegate. The GPU and Core ML delegates are faster but "don't work
        // on every model", and a delegate that silently mis-executes would
        // produce a plausible skeleton from nothing. MoveNet Lightning is the
        // quantized, mobile-first variant precisely so the CPU is enough.
        const loaded = await loadTensorflowModel({ url: uri }, []);
        if (cancelled) return;
        const issue = validatePoseModel(loaded.inputs, loaded.outputs);
        if (issue) {
          console.warn(`[pose] refusing model at ${uri}: ${issue}`);
          setStatus('unavailable');
          return;
        }
        setModel(loaded);
        setStatus('ready');
      } catch (e) {
        console.warn('[pose] model failed to load:', e);
        setStatus('unavailable');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Nothing to resize with means nothing to infer from — older Android devices
  // have no Vulkan path for the GPU resizer at all.
  useEffect(() => {
    if (resizerError) {
      console.warn('[pose] no GPU resizer on this device:', resizerError.message);
      setStatus('unavailable');
    }
  }, [resizerError]);

  /**
   * The model and resizer are never disposed, deliberately. Both are held by a
   * live frame callback on another thread, and tearing them down while a frame
   * is mid-flight is a use-after-free. Dropping the references and letting the
   * collector finalize them is what `useResizer` itself does.
   */

  /* ── frames ──────────────────────────────────────────────────────────── */

  /** Last mirrored `tracked`, so gaining or losing the person re-renders at
   *  once rather than up to `MIRROR_EVERY` frames later. */
  const mirrorTracked = useRef(false);

  /** Latches the first frame, so promoting the tier is a one-off setState
   *  rather than one per frame. */
  const framesSeenRef = useRef(false);

  /** Live joints for the dot overlay. See `PoseDetector.keypoints`. */
  const keypoints = useSharedValue<number[]>([]);

  const onKeypoints = useCallback((kp: number[], rawTimestamp: number) => {
    const s = stateRef.current;
    const wall = Date.now();
    liveRef.current = wall;
    // Straight to the shared value so the dot overlay can follow the body on
    // the UI thread. Written every frame, unlike the throttled `setMirror`
    // below — a dot that updates five times a second reads as broken.
    keypoints.value = kp;
    // Through React state, not a ref: the *first* frame is what promotes the
    // tier from "starting up" to "trustworthy". Guarded by a ref so it fires
    // exactly once — React bails out on an unchanged value, but the call still
    // schedules render work, and at camera frame rate that is thirty wasted
    // scheduling passes a second on the thread the rep engine runs on.
    if (!framesSeenRef.current) {
      framesSeenRef.current = true;
      setFramesSeen(true);
    }

    const counted = feedPose(s, kp, frameNow(clockRef.current, rawTimestamp, wall));
    if (counted) onRepRef.current?.();

    tickRef.current++;
    const notable = counted || s.tracked !== mirrorTracked.current;
    mirrorTracked.current = s.tracked;
    if (notable || tickRef.current % MIRROR_EVERY === 0) {
      setMirror({
        reps: s.reps,
        progress: effortProgress(s),
        quality: meanQuality(s),
        tracked: s.tracked,
        hint: poseHint(s),
      });
    }
  }, []);

  /**
   * Dropped frames are the design, not a fault: `dropFramesWhileBusy` is how
   * inference back-pressures the camera, and the rep engine works off timestamps
   * so it doesn't care what rate they arrive at. Handled explicitly only because
   * the default handler logs a warning for every single one.
   */
  const onFrameDropped = useCallback(() => {}, []);

  const frameOutput = useFrameOutput({
    targetResolution: TARGET_RESOLUTION,
    // The GPU resizer requires YUV input on iOS and accepts anything on Android,
    // so YUV is the one format that works on both. It is also the camera-native
    // family, unlike RGB, which would cost a conversion pass per frame.
    pixelFormat: 'yuv',
    // Rotate the buffers so the pixels are upright regardless of how the phone
    // is propped. Without this the frame arrives in sensor orientation — usually
    // landscape — and every vertical measurement in the rep engine would be
    // reading along the wrong axis. It costs a rotation pass per frame, which is
    // cheap at VGA and far cheaper than getting the geometry wrong.
    enablePhysicalBufferRotation: true,
    // Skip frames that arrive mid-inference rather than queueing them. A queue
    // would grow without bound on a slow device and feed the state machine
    // minutes-old poses.
    dropFramesWhileBusy: true,
    onFrameDropped,
    onFrame: (frame: Frame) => {
      'worklet';
      try {
        if (model == null || resizer == null) return;
        const resized = resizer.resize(frame);
        try {
          const outputs = model.runSync([resized.getPixelBuffer()]);
          const kp: number[] = [];
          if (readKeypoints(outputs[0], kp)) {
            // The raw timestamp travels with the pose: the JS side needs the
            // camera's own sense of when this frame happened, not when the
            // hand-off got scheduled, because batched hand-offs would compress
            // apparent cadence and reject honest reps as too fast.
            scheduleOnRN(onKeypoints, kp, frame.timestamp);
          }
        } finally {
          // Both disposes are unconditional. A leaked GPUFrame exhausts the
          // resizer's memory pool and a leaked Frame stalls the camera pipeline,
          // so neither can be allowed to depend on the inference succeeding.
          resized.dispose();
        }
      } finally {
        frame.dispose();
      }
    },
  });

  /* ── watchdog ────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!enabled || status !== 'ready') return;
    // Seeded here rather than at declaration so a slow camera start isn't
    // counted against a model that only just finished loading.
    liveRef.current = Date.now();
    setStalled(false);
    const id = setInterval(() => {
      setStalled(Date.now() - liveRef.current > STALL_MS);
    }, 500);
    return () => clearInterval(id);
  }, [enabled, status]);

  /* ── lifecycle ───────────────────────────────────────────────────────── */

  const reset = useCallback(() => {
    stateRef.current = createRepState(activity, POSE_X_SCALE);
    clockRef.current = createFrameClock();
    tickRef.current = 0;
    mirrorTracked.current = false;
    liveRef.current = Date.now();
    setMirror({ reps: 0, progress: 0, quality: 0, tracked: false, hint: '' });
  }, [activity]);

  useEffect(() => {
    reset();
  }, [activity, reset]);

  const usable = status === 'ready' && model != null && resizer != null;

  return {
    keypoints,
    available: usable && framesSeen && !stalled,
    // Stays true across the gap between "model loaded" and "first frame
    // arrived". If it went false in that window the challenge would drop a tier
    // for the second before the camera warmed up, and a single tap in that
    // second latches the manual tier for the rest of the set.
    loading: enabled && (status === 'loading' || (usable && !framesSeen && !stalled)),
    reps: mirror.reps,
    progress: mirror.progress,
    quality: mirror.quality,
    tracked: mirror.tracked,
    hint: mirror.hint,
    // Not gated on `framesSeen` or `stalled`: this decides which camera library
    // owns the device, and that has to stay settled for the whole round. A
    // frozen camera makes the tier untrustworthy (`available`), but handing the
    // hardware to a different library mid-set is how you get two cameras
    // fighting and neither working.
    frameHandler: usable ? frameOutput : null,
    reset,
  };
}
