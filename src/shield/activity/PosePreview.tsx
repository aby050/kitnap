import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { CameraView } from 'expo-camera';

/**
 * The camera preview behind the challenge.
 *
 * Split by platform because the two camera libraries in this app cannot both
 * hold the device: expo-camera's `CameraView` is what the web motion tier diffs
 * pixels from, and VisionCamera is what the native pose tier streams frames
 * through. Whichever tier is going to run has to be the only one that opens the
 * hardware. `PosePreview.native.tsx` makes that choice; this file is the web and
 * type-check default, where there is no pose tier to choose.
 */

export type PosePreviewProps = {
  /** The pose tier's camera output, or null when it isn't running. */
  frameHandler: unknown | null;
  /** True while the pose tier is still deciding whether it can run. */
  deciding: boolean;
  style?: ViewStyle;
};

export default function PosePreview({ style }: PosePreviewProps) {
  return <CameraView style={[StyleSheet.absoluteFill, style]} facing="front" />;
}
