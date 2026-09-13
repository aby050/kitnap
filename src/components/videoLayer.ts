import type React from 'react';
import type { MediaSource } from '../data/ambienceMedia';

export type VideoLayerProps = {
  source: MediaSource;
  onFirstFrame?: () => void;
};

let cached: React.ComponentType<VideoLayerProps> | null | undefined;

/**
 * The video layer, if this binary has one.
 *
 * `undefined` = not looked up yet, `null` = looked up and unavailable.
 * expo-video resolves its native module at import time, so a binary built
 * before the package was added throws there and would otherwise take the
 * whole app down rather than one layer. Every caller branches on `null` and
 * falls back to something painted.
 *
 * Shared so the focus room and the onboarding backdrop cannot drift into two
 * different guards.
 */
export function getVideoLayer(): React.ComponentType<VideoLayerProps> | null {
  if (cached === undefined) {
    try {
      cached = require('../main/AmbienceVideoLayer').default;
    } catch {
      cached = null;
    }
  }
  return cached ?? null;
}
