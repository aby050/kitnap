import { Directory, File, Paths } from 'expo-file-system';
import { REMOTE_KEYS, remoteVideoUrl } from './ambienceSource';

/**
 * Pulls the streamed room loops onto the device while the user is answering
 * onboarding questions.
 *
 * Without this, the first tap on a streamed room waits on a 300–900 KB
 * download before the first frame — on a slow connection that is a black
 * screen where a loop should be, in the exact moment the feature has to look
 * effortless. Onboarding is a minute of the user reading and tapping and the
 * network doing nothing, so that is where the fetching goes.
 *
 * Rules this follows:
 *  • Never blocks. Every call is fire-and-forget and every failure is
 *    swallowed — a room whose loop did not arrive falls back to streaming,
 *    and a room that cannot stream falls back to its wash. Onboarding must
 *    not be able to fail because of a video.
 *  • One at a time, with a breath between. Ten parallel downloads saturate
 *    the connection and make the very screen we are trying to keep smooth
 *    stutter; sequential is slower on paper and better in the hand.
 *  • Resumes rather than restarts. Anything already on disk is skipped, so a
 *    reinstall-free relaunch costs nothing.
 */

const DIR_NAME = 'ambience';

/** key → local file URI, for loops already on disk. Read synchronously by
 *  `mediaFor`, so it has to be a plain map rather than state. */
const onDisk = new Map<string, string>();

let sweeping = false;

function dir(): Directory {
  return new Directory(Paths.cache, DIR_NAME);
}

function fileFor(key: string): File {
  return new File(dir(), `${key}.mp4`);
}

/** The local copy of a room's loop, if there is one. */
export function localVideoUri(key: string): string | null {
  return onDisk.get(key) ?? null;
}

/**
 * Fills the map from whatever is already cached. Called once at startup,
 * before the first render, so a returning user plays from disk immediately
 * rather than re-streaming everything.
 */
export function hydrateAmbienceCache(): void {
  try {
    const d = dir();
    if (!d.exists) return;
    for (const key of REMOTE_KEYS) {
      const f = fileFor(key);
      if (f.exists) onDisk.set(key, f.uri);
    }
  } catch {
    /* A cache we cannot read is the same as an empty one. */
  }
}

/**
 * Downloads every streamed loop that is not already on disk, one after the
 * other. Safe to call more than once; the second call returns immediately
 * while the first is still running.
 */
export function prefetchAmbience(): void {
  if (sweeping) return;
  sweeping = true;

  void (async () => {
    try {
      const d = dir();
      if (!d.exists) d.create({ intermediates: true });

      for (const key of REMOTE_KEYS) {
        if (onDisk.has(key)) continue;
        try {
          const target = fileFor(key);
          if (target.exists) {
            onDisk.set(key, target.uri);
            continue;
          }
          const got = await File.downloadFileAsync(remoteVideoUrl(key), target);
          if (got?.exists) onDisk.set(key, got.uri);
        } catch {
          /* This one stays streamed. Move on rather than abandoning the rest. */
        }
        // A breath between files: the point of doing this during onboarding is
        // that onboarding still feels instant.
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch {
      /* No cache directory, no prefetch. Everything still streams. */
    } finally {
      sweeping = false;
    }
  })();
}
