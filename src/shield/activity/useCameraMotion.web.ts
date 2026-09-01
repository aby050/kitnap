import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MotionState,
  createMotionState,
  feedMotion,
  frameDifference,
  motionHint,
} from './motionEngine';
import { ActivityKind } from './types';

/**
 * Tier 2 on web: samples the live `<video>` element expo-camera renders, and
 * turns frame-to-frame luma change into reps.
 *
 * This exists because the whole flow has to be exercisable in the Expo web
 * preview — the pose tier is device-only, and a fallback nobody can run is a
 * fallback nobody can trust. On web there is a real DOM video element to draw
 * from, so we downscale it into a tiny offscreen canvas and diff the pixels.
 * One `drawImage` per sample, no encode round-trip.
 *
 * Everything is deliberately kept in a ref-held mutable state object with a
 * throttled React mirror: at 8fps a `setState` per frame would re-render the
 * whole gate 8 times a second for a number that changes once a second.
 */

/** Sampling rate. Fast enough to segment reps, slow enough to be free. */
const SAMPLE_MS = 125;
/** Analysis resolution. 48×36 is ~1.7k pixels — plenty for whole-body motion,
 *  and small enough that a full-frame diff costs nothing. Also means no
 *  recognisable image ever exists in memory. */
const W = 48;
const H = 36;
/** A frame source showing no sign of advancing for this long is frozen, not
 *  quiet. Long enough to ride out a hiccup, short enough to hand the round over
 *  well inside the caller's detector deadline. */
const STALL_MS = 2500;

export type MotionDetector = {
  /** Ready to be believed — frames are arriving *now* and the noise floor has
   *  settled. Goes false again if the source stops advancing, so a frozen
   *  camera hands the round on instead of looking healthy forever. */
  ready: boolean;
  reps: number;
  /** 0–1 live movement level, for the meter. */
  level: number;
  active: boolean;
  hint: string;
  /** Null while starting up; a message when this device can't do it at all. */
  error: string | null;
  reset: () => void;
};

/**
 * Evidence that the frame source is still advancing.
 *
 * `readyState` is no help: a stalled MediaStream keeps reporting
 * HAVE_ENOUGH_DATA with the last frame it managed to deliver. The decoder's
 * presented-frame count and the stream clock both stop dead instead, and either
 * one moving is proof of life. Both are read defensively — support varies, and a
 * browser reporting neither must not be mistaken for a broken camera, which is
 * why the caller also counts any pixel change as advancement.
 */
function sourceProgress(v: HTMLVideoElement): { frames: number; clock: number } {
  const q = typeof v.getVideoPlaybackQuality === 'function' ? v.getVideoPlaybackQuality() : null;
  return { frames: q ? q.totalVideoFrames : 0, clock: v.currentTime };
}

export function useCameraMotion(
  activity: ActivityKind,
  enabled: boolean,
  onRep?: () => void,
): MotionDetector {
  const stateRef = useRef<MotionState>(createMotionState(activity));
  const prevRef = useRef<Uint8ClampedArray | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onRepRef = useRef(onRep);
  onRepRef.current = onRep;

  const [mirror, setMirror] = useState({
    ready: false,
    reps: 0,
    level: 0,
    active: false,
    hint: 'Getting a read on the room…',
  });
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    stateRef.current = createMotionState(activity);
    prevRef.current = null;
    setMirror({ ready: false, reps: 0, level: 0, active: false, hint: 'Getting a read on the room…' });
  }, [activity]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof document === 'undefined') {
      setError('unsupported');
      return;
    }

    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    // Frames are counted so the React mirror can lag the engine deliberately.
    let tick = 0;
    // Last time the frame source showed any sign of advancing. Seeded to now so
    // a camera that takes a moment to start isn't called frozen on sample one.
    const live = { frames: -1, clock: -1, at: Date.now() };
    let wasStalled = false;

    const sample = () => {
      if (cancelled) return;
      const s = stateRef.current;
      const now = Date.now();

      // expo-camera's web implementation mounts a plain <video>. Look it up
      // each sample rather than caching: the element is remounted whenever the
      // camera view re-renders, and a stale handle silently reads black frames.
      const video = document.querySelector('video') as HTMLVideoElement | null;
      if (!video || video.readyState < 2 || !video.videoWidth) return;

      const progress = sourceProgress(video);
      if (progress.frames !== live.frames || progress.clock !== live.clock) {
        live.frames = progress.frames;
        live.clock = progress.clock;
        live.at = now;
      }

      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        canvasRef.current = canvas;
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        setError('unsupported');
        return;
      }

      let rgba: Uint8ClampedArray;
      try {
        ctx.drawImage(video, 0, 0, W, H);
        rgba = ctx.getImageData(0, 0, W, H).data;
      } catch {
        // A cross-origin or not-yet-playing video taints the canvas. Not fatal
        // on its own — the next sample usually succeeds — so don't tear down.
        return;
      }

      // Pack to luma in place. Rec. 601 weights, integer-ish, no allocation
      // beyond the one reused buffer.
      const n = W * H;
      const luma = new Uint8ClampedArray(n);
      for (let i = 0; i < n; i++) {
        const o = i * 4;
        luma[i] = (rgba[o] * 77 + rgba[o + 1] * 151 + rgba[o + 2] * 28) >> 8;
      }

      const prev = prevRef.current;
      prevRef.current = luma;
      if (!prev) return;

      const energy = frameDifference(luma, prev);
      // Any pixel change at all is also proof of life, and the backstop for a
      // browser whose counters never move. A real sensor never returns exactly
      // zero twice — a frozen buffer always does.
      if (energy > 0) live.at = now;
      const stalled = now - live.at >= STALL_MS;
      const stallChanged = stalled !== wasStalled;
      wasStalled = stalled;

      const counted = feedMotion(s, energy, now);
      if (counted) onRepRef.current?.();

      // Mirror into React at ~3fps, or immediately when something happened
      // that the user needs to see. `stallChanged` rather than `stalled`: a
      // frozen camera stays frozen, and mirroring a fresh object every 125ms
      // for a state that never changes would re-render the gate forever.
      tick++;
      if (counted || stallChanged || tick % 3 === 0) {
        setMirror({
          // A stalled source can't be believed, however warm the engine is.
          ready: s.ready && !stalled,
          reps: s.reps,
          level: stalled ? 0 : s.level,
          active: s.active,
          hint: stalled ? 'Camera stopped sending frames — counting by hand instead.' : motionHint(s, now),
        });
      }
    };

    timer = setInterval(sample, SAMPLE_MS);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      prevRef.current = null;
    };
  }, [enabled, activity]);

  return { ...mirror, error, reset };
}
