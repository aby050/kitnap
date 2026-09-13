/**
 * Where each focus room's loop and poster come from.
 *
 * ── Why two places ────────────────────────────────────────────────────────
 * Posters are bundled, always. They are ~40–200 KB each, they are what the
 * browse grid is made of, and a grid that waits on the network to draw itself
 * is a grid that looks broken on a train.
 *
 * Loops are remote, with two exceptions. Ten of them is ~14 MB after
 * encoding, and bundling all of them makes every user download every room to
 * use one — and pins the set to an App Store release. `peace` and `winddown`
 * stay in the binary so the very first run, and any run with no signal, still
 * has somewhere to be.
 *
 * ── Adding or changing a loop ─────────────────────────────────────────────
 *   1. Drop `<key>.mp4` and `<key>-poster.jpg` into assets/ambience/
 *   2. `scripts/publish-ambience.sh` — encodes, uploads to R2, sets a
 *      one-year immutable cache
 *   3. Add the key to REMOTE below (or to the bundled block, for a loop that
 *      must work offline)
 *
 * A loop is immutable under its name, because the CDN caches it for a year.
 * Re-cutting one means publishing it under a new key, not overwriting it.
 */

/** Cloudflare R2, public bucket `byre-ambience`. Zero egress cost, which is
 *  the entire cost of serving video anywhere else. */
import { REMOTE_KEYS, remoteVideoUrl } from './ambienceSource';
import { localVideoUri } from './ambiencePrefetch';

/** A bundled asset (a `require` id) or a URL the player streams. */
export type MediaSource = number | { uri: string };

export type AmbienceMedia = {
  /** Silent, seamlessly looping clip. */
  video?: MediaSource;
  /** Still frame — the card art, and what sits under the loop until its
   *  first frame decodes. */
  still?: MediaSource;
  /** Ambient track, looped independently of the video. None supplied yet;
   *  the room plays silent until one is. */
  audio?: MediaSource;
};

/** Loops that ship inside the binary. Everything else streams. */
const BUNDLED_VIDEO: Record<string, number> = {
  peace: require('../../assets/ambience/peace.mp4'),
  winddown: require('../../assets/ambience/winddown.mp4'),
};

/** Posters, all bundled. Metro resolves asset requires statically, so these
 *  have to be written out one by one — a computed path does not resolve. */
const POSTERS: Record<string, number> = {
  breathe: require('../../assets/ambience/breathe-poster.jpg'),
  meditate: require('../../assets/ambience/meditate-poster.jpg'),
  morning: require('../../assets/ambience/morning-poster.jpg'),
  reading: require('../../assets/ambience/reading-poster.jpg'),
  think: require('../../assets/ambience/think-poster.jpg'),
  winddown: require('../../assets/ambience/winddown-poster.jpg'),
  family: require('../../assets/ambience/family-poster.jpg'),
  study: require('../../assets/ambience/study-poster.jpg'),
  peace: require('../../assets/ambience/peace-poster.jpg'),
  night: require('../../assets/ambience/night-poster.jpg'),
};

export function mediaFor(key: string): AmbienceMedia {
  const bundled = BUNDLED_VIDEO[key];
  if (bundled) return { video: bundled, still: POSTERS[key] };

  if (!REMOTE_KEYS.includes(key)) return { still: POSTERS[key] };

  /* Prefer the copy fetched during onboarding. A local file starts on the
   * first frame; the CDN copy has to open a connection first, which is the
   * black beat this whole cache exists to remove. */
  const local = localVideoUri(key);
  return {
    video: { uri: local ?? remoteVideoUrl(key) },
    still: POSTERS[key],
  };
}
