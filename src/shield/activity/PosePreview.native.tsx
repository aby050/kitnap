import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { CameraView } from 'expo-camera';
import { Camera, type CameraOutput, type Constraint } from 'react-native-vision-camera';

/**
 * The camera preview behind the challenge, on device.
 *
 * Exactly one camera library opens the hardware, and this is where that is
 * decided: VisionCamera when the pose tier has a model running, expo-camera
 * otherwise. See `PosePreview.tsx` for why the two can't coexist.
 *
 * The three states are ordered so nothing is claimed before it's true:
 *
 *   pose running   VisionCamera, streaming frames into the model
 *   still deciding nothing — a black panel for the second the model takes to
 *                  load, rather than opening a camera we may have to hand over
 *   no pose tier   expo-camera, a plain preview
 *
 * That middle state is the point. Opening expo-camera first and swapping to
 * VisionCamera a second later means two libraries negotiating the same device
 * mid-session, which is how you end up with neither of them working.
 */

/** Mirrors `PosePreview.tsx`. Declared rather than imported because on native
 *  `./PosePreview` resolves to this file — the same reason `MotionDetector` is
 *  written out in both `useCameraMotion` platform files. */
export type PosePreviewProps = {
  /** The pose tier's camera output, or null when it isn't running. */
  frameHandler: unknown | null;
  /** True while the pose tier is still deciding whether it can run. */
  deciding: boolean;
  style?: ViewStyle;
};

/**
 * Inference is the bottleneck, not capture. Asking the sensor for 15fps costs
 * nothing to negotiate and halves the frames the pipeline has to rotate, resize
 * and then throw away, which on a mid-range phone is the difference between a
 * warm device and a hot one. Module-level so `Camera`'s memo isn't defeated by a
 * fresh array every render.
 */
const CONSTRAINTS: Constraint[] = [{ fps: 15 }];

export default function PosePreview({ frameHandler, deciding, style }: PosePreviewProps) {
  if (frameHandler != null) {
    return (
      <Camera
        style={[StyleSheet.absoluteFill, style]}
        device="front"
        isActive
        // Cast at the boundary: `frameHandler` is deliberately `unknown` in the
        // shared detector type so the web build never has to name a
        // VisionCamera type. `usePoseDetector.native.ts` is the only thing that
        // puts a value in it, and it only ever puts a CameraFrameOutput there.
        outputs={[frameHandler as CameraOutput]}
        constraints={CONSTRAINTS}
      />
    );
  }

  if (deciding) {
    return <View style={[StyleSheet.absoluteFill, style]} />;
  }

  return <CameraView style={[StyleSheet.absoluteFill, style]} facing="front" />;
}
