import { useCallback } from 'react';
import { ActivityKind } from './types';

/**
 * Tier 2 on native: not available, deliberately.
 *
 * expo-camera 57 exposes no frame stream on iOS or Android — `takePictureAsync`
 * hands back an encoded JPEG, and there is no JS decoder in the runtime to get
 * pixels back out of it. So there is no honest way to do frame differencing on
 * device without pulling in vision-camera, which is exactly what the pose tier
 * is for.
 *
 * Rather than fake it, this reports `unsupported` and the challenge drops to the
 * manual tier with its cadence guard. That keeps the tier ladder truthful: a
 * device either runs the pose model or it counts taps, and it never claims the
 * camera is watching when it isn't.
 *
 * The web sibling (`useCameraMotion.web.ts`) is the real implementation, so the
 * whole ladder stays exercisable in the Expo preview.
 */

export type MotionDetector = {
  ready: boolean;
  reps: number;
  level: number;
  active: boolean;
  hint: string;
  error: string | null;
  reset: () => void;
};

export function useCameraMotion(
  _activity: ActivityKind,
  _enabled: boolean,
  _onRep?: () => void,
): MotionDetector {
  const reset = useCallback(() => {}, []);
  return {
    ready: false,
    reps: 0,
    level: 0,
    active: false,
    hint: '',
    error: 'unsupported',
    reset,
  };
}
