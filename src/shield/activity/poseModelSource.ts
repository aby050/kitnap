/**
 * Where the pose model comes from.
 *
 * Base implementation: nowhere. Web has no pose tier at all — there is no
 * VisionCamera to feed it — so reporting "no model" here is the honest answer
 * rather than a stub standing in for something real. `usePoseDetector.native.ts`
 * pairs with `poseModelSource.native.ts`; both are inert everywhere else.
 */

export const POSE_MODEL_URL = '';

export async function resolvePoseModel(): Promise<string | null> {
  return null;
}
