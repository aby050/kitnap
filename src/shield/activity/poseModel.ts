import { KEYPOINT_COUNT } from './repEngine';

/**
 * What the pose tier expects of its model, and how to read what comes back.
 *
 * Kept free of native imports so the spec and its validation can be checked
 * without a device — and so the tier's most dangerous failure mode is covered by
 * a pure function rather than by hoping.
 *
 * That failure mode: the model is supplied at runtime (see `poseModelSource`),
 * which means it can be the wrong model. A file that loads happily but expects a
 * different input size, layout, or dtype will still produce 51 plausible-looking
 * floats, and those decode into a skeleton that jitters convincingly enough to
 * count reps nobody performed. Silently accepting that would be worse than
 * having no pose tier at all, because the UI would be claiming to check form.
 *
 * So the tier refuses to run at all unless the tensors match exactly. Refusing
 * costs the user nothing — the motion and manual tiers are right there — while a
 * wrong model would cost them the integrity of the whole unlock.
 */

/**
 * MoveNet SinglePose Lightning, int8-quantized: a 192×192 RGB byte image in,
 * 17 COCO keypoints out.
 *
 * The quantized variant specifically, not the float one. It is the fastest on a
 * CPU delegate, and its byte input is what the GPU resizer can hand over with no
 * conversion — one format, one code path, nothing to negotiate at runtime.
 */
export const POSE_INPUT = {
  width: 192,
  height: 192,
  /** MoveNet wants NHWC — channels interleaved per pixel, not planar. */
  pixelLayout: 'interleaved',
  channelOrder: 'rgb',
  dataType: 'uint8',
  /**
   * Letterbox rather than crop.
   *
   * `'cover'` would centre-crop the long axis, and on a portrait phone the long
   * axis is height — so it would cut off exactly the ankles and head that squats
   * and jumping jacks are measured by. `'contain'` keeps the whole body at the
   * cost of black bars either side.
   *
   * It also keeps the geometry honest: aspect ratio is preserved, so normalized
   * x and y stay on the same scale and `RepState.xScale` is 1. A stretched fit
   * would compress x and quietly skew every joint angle in one direction.
   */
  scaleMode: 'contain',
} as const;

/** No aspect distortion to undo, because of `scaleMode: 'contain'` above. */
export const POSE_X_SCALE = 1;

/** MoveNet emits `[y, x, score] × 17` as float32. */
export const KEYPOINT_FLOATS = KEYPOINT_COUNT * 3;

/** The parts of a tflite tensor description this module needs. Structural, so
 *  the native `Tensor` type satisfies it without being imported here. */
export type TensorLike = {
  dataType: string;
  shape: number[];
};

/** Total elements described by a shape, ignoring leading batch dimensions. */
function elementCount(shape: number[]): number {
  let n = 1;
  for (let i = 0; i < shape.length; i++) n *= shape[i];
  return n;
}

/**
 * Checks a loaded model really is the one the tier is written against.
 *
 * @returns null when the model is usable, or a plain-language reason it isn't.
 *          The reason is for the developer log, not the user — someone stuck
 *          behind a blocked app should never be shown a tensor shape.
 */
export function validatePoseModel(inputs: TensorLike[], outputs: TensorLike[]): string | null {
  if (inputs.length !== 1) {
    return `expected 1 input tensor, model has ${inputs.length}`;
  }
  const input = inputs[0];
  if (input.dataType !== POSE_INPUT.dataType) {
    return `expected a ${POSE_INPUT.dataType} input, model wants ${input.dataType} — this looks like a float build of the model rather than the quantized one`;
  }
  // Compared as a set of dimensions rather than by index: exporters disagree
  // about whether the batch dimension is present, and `[192,192,3]` is the same
  // image as `[1,192,192,3]`.
  const expected = POSE_INPUT.width * POSE_INPUT.height * 3;
  if (elementCount(input.shape) !== expected) {
    return `expected a ${POSE_INPUT.width}×${POSE_INPUT.height}×3 input (${expected} bytes), model wants ${input.shape.join('×')}`;
  }

  if (outputs.length < 1) {
    return 'model has no output tensors';
  }
  const output = outputs[0];
  if (elementCount(output.shape) !== KEYPOINT_FLOATS) {
    return `expected ${KEYPOINT_FLOATS} output floats (${KEYPOINT_COUNT} keypoints × y/x/score), model gives ${output.shape.join('×')}`;
  }
  if (output.dataType !== 'float32') {
    return `expected float32 keypoints, model gives ${output.dataType}`;
  }
  return null;
}

/**
 * Copies one inference result into a reusable keypoint array.
 *
 * Runs in the frame worklet, so: no allocation beyond the `Float32Array` view
 * (which is a view, not a copy), and the destination is written in place.
 *
 * The destination is a plain array rather than the view itself because it has to
 * cross back to the JS thread, and a plain array of numbers is the one shape
 * that is guaranteed to survive that hop intact.
 *
 * @returns false if the buffer isn't the expected size or the model returned
 *          NaN. A NaN skeleton is the nastiest case: every comparison in the rep
 *          engine silently comes out false, so the state machine simply parks
 *          forever with no error and no reps, which reads to the user as "this
 *          is broken" with nothing to act on.
 */
export function readKeypoints(buffer: ArrayBuffer, into: number[]): boolean {
  'worklet';
  const floats = new Float32Array(buffer);
  if (floats.length < KEYPOINT_FLOATS) return false;
  for (let i = 0; i < KEYPOINT_FLOATS; i++) {
    const v = floats[i];
    if (!isFinite(v)) return false;
    into[i] = v;
  }
  return true;
}
