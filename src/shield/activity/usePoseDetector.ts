import { useCallback } from 'react';
import { ActivityKind, PoseDetector } from './types';

/**
 * Tier 1 base implementation: reports unavailable.
 *
 * The real one lives in `usePoseDetector.native.ts`. This file is what web and
 * type-checking resolve to, following the same base-plus-override convention as
 * `AppleSignInButton.tsx` / `.ios.tsx`.
 */

export type { PoseDetector };

export function usePoseDetector(
  _activity: ActivityKind,
  _enabled: boolean,
  _onRep?: () => void,
): PoseDetector {
  const reset = useCallback(() => {}, []);
  return {
    available: false,
    loading: false,
    reps: 0,
    progress: 0,
    quality: 0,
    tracked: false,
    hint: '',
    frameHandler: null,
    reset,
  };
}
