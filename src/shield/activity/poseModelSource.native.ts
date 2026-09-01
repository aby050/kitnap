import { Directory, File, Paths } from 'expo-file-system';

/**
 * Finds the pose model on disk, downloading it once if it isn't there.
 *
 * ## Why the model isn't just bundled
 *
 * The obvious thing is `require('../../assets/movenet.tflite')` and let Metro
 * bundle it. Two problems, one fatal.
 *
 * The fatal one: `require` of a missing asset is a *bundle* error, not a runtime
 * error. If the file is absent — a fresh clone, a partial checkout, a build that
 * skipped LFS — the whole app fails to build. A feature that degrades to a
 * tap-to-count fallback should never be able to take the app down with it.
 *
 * The other: MoveNet's own download requires signing in to accept its licence,
 * so the file cannot be fetched by a build script and cannot live in this repo.
 * Anything that assumed it was present would be assuming wrong.
 *
 * So the model is located at runtime. Absent means the pose tier quietly doesn't
 * exist and the camera-motion tier handles the unlock, which is the same thing
 * that happens on a device too slow to run it.
 *
 * ## Supplying it
 *
 * Either drop the file at `<documents>/models/movenet.tflite` on the device, or
 * set `POSE_MODEL_URL` below to somewhere it can be fetched from once.
 *
 * Get it from https://www.kaggle.com/models/google/movenet — "singlepose
 * lightning", TFLite, the **int8** variant (~2.9 MB). A free account is needed to
 * accept the licence. The float variants will load and then be rejected by
 * `validatePoseModel`, on purpose: see `poseModel.ts`.
 *
 * This file uses TensorFlow Hub's public int8 export directly — no account or
 * licence click needed, and it is the same model Kaggle hosts. `validatePoseModel`
 * refuses to run on anything else, so pointing at a float16/float32 build just
 * results in the pose tier not activating, never in wrong keypoints.
 */

/** Set this to fetch the model on first use. Empty means "only look on disk". */
export const POSE_MODEL_URL =
  'https://tfhub.dev/google/lite-model/movenet/singlepose/lightning/tflite/int8/4?lite-format=tflite';

const MODEL_DIR = new Directory(Paths.document, 'models');
const MODEL_NAME = 'movenet.tflite';

/**
 * Floor for a believable model file. The quantized MoveNet is around 2.9 MB; an
 * HTML error page or a login redirect saved to disk is a handful of KB. Without
 * this, a URL that 404s leaves a text file named `.tflite` sitting in the cache
 * looking exactly like a valid model, and every launch afterwards tries to load
 * it instead of re-downloading.
 */
const MIN_MODEL_BYTES = 500_000;

/** A model shipped inside the app binary, if a future build adds one. Checked
 *  first so bundling it later needs no code change here. */
function bundledModel(): string | null {
  try {
    const file = new File(Paths.bundle, MODEL_NAME);
    return file.exists && file.size >= MIN_MODEL_BYTES ? file.uri : null;
  } catch {
    // `Paths.bundle` is a real directory on iOS but backed by the asset manager
    // on Android, where probing a missing name can throw rather than report
    // false. Not finding a model is the expected case, so it isn't an error.
    return null;
  }
}

/**
 * @returns a `file://` URI for the model, or null if there isn't one. Never
 *          throws — every failure here means "no pose tier", which the caller
 *          already has to handle for unsupported devices anyway.
 */
export async function resolvePoseModel(): Promise<string | null> {
  const bundled = bundledModel();
  if (bundled) return bundled;

  try {
    const destination = new File(MODEL_DIR, MODEL_NAME);
    if (destination.exists) {
      // Size-checked on read too, not just after download: a download
      // interrupted by a killed app leaves a short file behind that would
      // otherwise be trusted forever.
      if (destination.size >= MIN_MODEL_BYTES) return destination.uri;
      destination.delete();
    }

    if (!POSE_MODEL_URL) return null;

    if (!MODEL_DIR.exists) MODEL_DIR.create({ intermediates: true });
    const downloaded = await File.downloadFileAsync(POSE_MODEL_URL, MODEL_DIR);

    // Named from the URL's last path segment, which is rarely what we want to
    // look for next launch — normalize to the fixed name.
    let model = downloaded;
    if (downloaded.uri !== destination.uri) {
      await downloaded.move(destination);
      model = destination;
    }

    if (model.size < MIN_MODEL_BYTES) {
      // Ours, written seconds ago, and known bad — safe to remove, and worth
      // removing so the next attempt retries the download instead of loading it.
      model.delete();
      return null;
    }
    return model.uri;
  } catch {
    return null;
  }
}
