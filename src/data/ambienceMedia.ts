/**
 * Where the loop footage and ambient audio for each focus room is declared.
 *
 * ── Adding media for a room ───────────────────────────────────────────────
 *  1. Drop the files into `assets/ambience/` named after the room key:
 *       assets/ambience/family.mp4     ← the loop (silent, see below)
 *       assets/ambience/family.m4a     ← the ambient track
 *       assets/ambience/family-poster.jpg  ← first frame, shown while the loop
 *                                        decodes and used on the card
 *  2. Uncomment that room's block below and point the requires at them.
 *
 * The requires must be written out literally. Metro resolves asset requires
 * statically at bundle time, so a computed path (`require('../../assets/' + k)`)
 * does not resolve and a missing file is a bundling error, not a blank card —
 * which is why every entry starts commented out and a room with no entry
 * simply falls back to its wash.
 *
 * ── About the footage ─────────────────────────────────────────────────────
 *  • Keep the loop SILENT and carry sound in the separate audio file. One
 *    muted video plus one looping track is far smaller than re-encoding audio
 *    into every clip, and it lets the sound keep playing when the view is not.
 *  • Seamless loops only — the cut is invisible if the first and last frames
 *    match. 10–20s at 1080×1920 is plenty.
 *  • H.264 in an .mp4. HEVC saves space but decodes to black on some
 *    simulators, which makes it look broken in exactly the place it is hardest
 *    to debug.
 */
export type AmbienceMedia = {
  /** Silent, seamlessly looping clip. */
  video?: number;
  /** Ambient track, looped independently of the video. */
  audio?: number;
  /** Still frame — the card art, and the poster behind the loop. */
  still?: number;
};

export const AMBIENCE_MEDIA: Record<string, AmbienceMedia> = {
  breathe: {
    video: require('../../assets/ambience/breathe.mp4'),
    still: require('../../assets/ambience/breathe-poster.jpg'),
  },
  meditate: {
    video: require('../../assets/ambience/meditate.mp4'),
    still: require('../../assets/ambience/meditate-poster.jpg'),
  },
  morning: {
    video: require('../../assets/ambience/morning.mp4'),
    still: require('../../assets/ambience/morning-poster.jpg'),
  },
  reading: {
    video: require('../../assets/ambience/reading.mp4'),
    still: require('../../assets/ambience/reading-poster.jpg'),
  },
  think: {
    video: require('../../assets/ambience/think.mp4'),
    still: require('../../assets/ambience/think-poster.jpg'),
  },
  winddown: {
    video: require('../../assets/ambience/winddown.mp4'),
    still: require('../../assets/ambience/winddown-poster.jpg'),
  },
  family: {
    video: require('../../assets/ambience/family.mp4'),
    still: require('../../assets/ambience/family-poster.jpg'),
  },
  study: {
    video: require('../../assets/ambience/study.mp4'),
    still: require('../../assets/ambience/study-poster.jpg'),
  },
  peace: {
    video: require('../../assets/ambience/peace.mp4'),
    still: require('../../assets/ambience/peace-poster.jpg'),
  },
  night: {
    video: require('../../assets/ambience/night.mp4'),
    still: require('../../assets/ambience/night-poster.jpg'),
  },
};
