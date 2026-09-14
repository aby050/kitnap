import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { KP } from './repEngine';
import { palette } from '../../design/tokens';

/**
 * The joints, drawn over the camera.
 *
 * This exists to answer one question the user asks every time they stand in
 * front of the lens: *is this thing actually watching me, or is it a camera
 * preview with a counter next to it?* Numbers going up cannot answer that —
 * a tap counter does the same. A dot that follows your wrist can, immediately
 * and without a word of copy.
 *
 * It draws only what the model is actually confident about. A joint below the
 * confidence floor is hidden rather than guessed at or interpolated from its
 * neighbours — a skeleton that keeps drawing a leg it cannot see is exactly
 * the overclaiming the rest of this feature is built to avoid.
 *
 * ## Two rules this file has to obey, both learned the hard way
 *
 * 1. **Every `useAnimatedStyle` return must carry the same keys.** Returning
 *    `{ opacity }` for a hidden joint and `{ opacity, left, top }` for a
 *    visible one makes Reanimated raise a fatal error — which in a Release
 *    build is an `RCTFatal` abort, not a warning. The first version of this
 *    file did exactly that and crashed the app a few seconds into every
 *    challenge, as soon as one joint dropped below the score floor.
 * 2. **Position with `transform`, not animated `left`/`top` percentages.**
 *    Pixel translations off a measured box are the well-supported path.
 */

/** Below this the joint isn't drawn. Matches the rep engine's own floor, so
 *  what you see is what the counter is working from — no more, no less. */
const DOT_MIN_SCORE = 0.3;

/** Head, hands, feet, and the joints between them. Not all seventeen: the
 *  face points (eyes, ears) cluster into an unreadable blob at this size and
 *  add nothing — you cannot tell a rep from someone's ear. */
const JOINTS: { index: number; size: number }[] = [
  { index: KP.nose, size: 13 },
  { index: KP.leftShoulder, size: 9 },
  { index: KP.rightShoulder, size: 9 },
  { index: KP.leftElbow, size: 8 },
  { index: KP.rightElbow, size: 8 },
  { index: KP.leftWrist, size: 12 },
  { index: KP.rightWrist, size: 12 },
  { index: KP.leftHip, size: 9 },
  { index: KP.rightHip, size: 9 },
  { index: KP.leftKnee, size: 10 },
  { index: KP.rightKnee, size: 10 },
  { index: KP.leftAnkle, size: 12 },
  { index: KP.rightAnkle, size: 12 },
];

/** The bones, as pairs of joint indices. Same set the dots use — a limb whose
 *  either end is below the score floor simply isn't drawn, so the skeleton can
 *  never invent a connection the model didn't see. No face bones: the eyes and
 *  ears cluster too tightly to read, exactly as for the dots. */
const BONES: [number, number][] = [
  [KP.leftShoulder, KP.rightShoulder],
  [KP.leftShoulder, KP.leftElbow],
  [KP.leftElbow, KP.leftWrist],
  [KP.rightShoulder, KP.rightElbow],
  [KP.rightElbow, KP.rightWrist],
  [KP.leftShoulder, KP.leftHip],
  [KP.rightShoulder, KP.rightHip],
  [KP.leftHip, KP.rightHip],
  [KP.leftHip, KP.leftKnee],
  [KP.leftKnee, KP.leftAnkle],
  [KP.rightHip, KP.rightKnee],
  [KP.rightKnee, KP.rightAnkle],
];

/** Thickness of a bone, in points. */
const BONE_W = 3;

type Props = {
  /** `[y, x, score] × 17`, normalized to the model's square input. */
  keypoints: SharedValue<number[]>;
  /** Front camera previews are mirrored, so raise your right hand and the dot
   *  has to appear on the same side of the screen as the hand you see. */
  mirrored?: boolean;
};

function Dot({
  keypoints,
  index,
  size,
  mirrored,
  width,
  height,
}: {
  keypoints: SharedValue<number[]>;
  index: number;
  size: number;
  mirrored: boolean;
  width: number;
  height: number;
}) {
  const style = useAnimatedStyle(() => {
    const k = keypoints.value;
    const at = index * 3;

    // Same keys on every path — see rule 1 above. A hidden dot is a
    // transparent dot parked where it last was, never a different style shape.
    let opacity = 0;
    let tx = 0;
    let ty = 0;

    if (k && k.length >= at + 3) {
      const score = k[at + 2];
      if (score >= DOT_MIN_SCORE) {
        const ny = k[at];
        const nx = mirrored ? 1 - k[at + 1] : k[at + 1];
        opacity = Math.min(1, (score - DOT_MIN_SCORE) / 0.25);
        tx = nx * width;
        ty = ny * height;
      }
    }

    return { opacity, transform: [{ translateX: tx }, { translateY: ty }] };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          // Centres the dot on the joint: the translation puts its top-left
          // corner there, so pull it back by half its own size.
          marginLeft: -size / 2,
          marginTop: -size / 2,
        },
        style,
      ]}
    />
  );
}

/**
 * One limb, drawn as a rotated 1×N bar.
 *
 * A line between two moving points is a width, an angle and an origin — all
 * three derived on the UI thread from the same shared value the dots read, so
 * the skeleton can never lag a frame behind its own joints. Rendered as a View
 * rather than SVG deliberately: react-native-svg's props are not animatable
 * from a worklet without a bridge hop per frame, which is precisely the cost
 * this whole pipeline is built to avoid.
 *
 * Obeys the same two rules as `Dot`: identical style keys on every path, and
 * `transform` rather than animated layout props.
 */
function Bone({
  keypoints,
  from,
  to,
  mirrored,
  width,
  height,
}: {
  keypoints: SharedValue<number[]>;
  from: number;
  to: number;
  mirrored: boolean;
  width: number;
  height: number;
}) {
  const style = useAnimatedStyle(() => {
    const k = keypoints.value;
    const a = from * 3;
    const b = to * 3;

    let opacity = 0;
    let tx = 0;
    let ty = 0;
    let angle = 0;
    let length = 0;

    if (k && k.length >= Math.max(a, b) + 3) {
      const scoreA = k[a + 2];
      const scoreB = k[b + 2];
      if (scoreA >= DOT_MIN_SCORE && scoreB >= DOT_MIN_SCORE) {
        const ax = (mirrored ? 1 - k[a + 1] : k[a + 1]) * width;
        const ay = k[a] * height;
        const bx = (mirrored ? 1 - k[b + 1] : k[b + 1]) * width;
        const by = k[b] * height;
        const dx = bx - ax;
        const dy = by - ay;
        length = Math.sqrt(dx * dx + dy * dy);
        angle = Math.atan2(dy, dx);
        // The bar is anchored at its left edge, vertically centred on the
        // joint, then rotated about that end — so it runs from A to B.
        tx = ax;
        ty = ay - BONE_W / 2;
        // Dimmer than the dots on purpose: the joints are what the counter
        // works from, the bones are only there to make a body legible.
        opacity = Math.min(1, (Math.min(scoreA, scoreB) - DOT_MIN_SCORE) / 0.25) * 0.65;
      }
    }

    return {
      opacity,
      width: length,
      transform: [{ translateX: tx }, { translateY: ty }, { rotateZ: `${angle}rad` }],
    };
  });

  return <Animated.View pointerEvents="none" style={[styles.bone, style]} />;
}

function PoseDotsInner({ keypoints, mirrored = true }: Props) {
  // Measured rather than assumed: the normalized keypoints only become pixels
  // once we know how big the preview actually is.
  const [box, setBox] = useState({ width: 0, height: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {/* Bones first so the joints sit on top of them. */}
      {box.width > 0 &&
        BONES.map(([from, to]) => (
          <Bone
            key={`${from}-${to}`}
            keypoints={keypoints}
            from={from}
            to={to}
            mirrored={mirrored}
            width={box.width}
            height={box.height}
          />
        ))}
      {box.width > 0 &&
        JOINTS.map((j) => (
          <Dot
            key={j.index}
            keypoints={keypoints}
            index={j.index}
            size={j.size}
            mirrored={mirrored}
            width={box.width}
            height={box.height}
          />
        ))}
    </View>
  );
}

/**
 * Memoized, and it matters more than it looks.
 *
 * The parent re-renders roughly ten times a second while a challenge runs (the
 * rep counter, the progress ring, the coaching line all mirror from the
 * detector). Without this, every one of those rebuilt thirteen animated views,
 * and Reanimated tearing down and recreating thirteen animated styles at 10 Hz
 * was enough to wedge the JS thread — the screen froze rather than crashed.
 *
 * Both props are stable: `keypoints` is a shared value whose identity never
 * changes, and `mirrored` is a constant. So this renders once and then updates
 * purely on the UI thread, which is the whole point of driving it off a shared
 * value in the first place.
 */
const PoseDots = React.memo(PoseDotsInner);
export default PoseDots;

const styles = StyleSheet.create({
  bone: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: BONE_W,
    borderRadius: BONE_W / 2,
    backgroundColor: palette.accent,
    // Rotate about the end that sits on joint A, not the bar's centre.
    transformOrigin: '0% 50%',
  },
  dot: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: palette.accent,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    // Reads against a bright shirt and a dark room alike.
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
});
