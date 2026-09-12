import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon, { IconName } from './Icon';
import { curves } from '../design/motion';
import { motion } from '../design/tokens';

/**
 * An {@link Icon} that presents itself.
 *
 * `Icon` draws static SVG, and animating stroke colour would mean animated
 * props on every path in every glyph. This wraps it instead and gets the same
 * result from three things a wrapper can do cheaply:
 *
 *  - **entrance** — fades and scales up once on mount, `delay` staggers a group
 *  - **pop** — a spring overshoot whenever `pop` changes value
 *  - **active** — lifts the glyph and, when `activeColor` is given, cross-fades
 *    between two stacked copies rather than animating the stroke
 *
 * Only `opacity` and `transform` are animated, so this behaves the same on
 * device and in the web preview (see the note in `design/motion.ts`).
 */
export default function AnimatedIcon({
  name,
  size = 20,
  color = '#FFFFFF',
  activeColor,
  active = false,
  strokeWidth = 1.7,
  delay,
  pop,
  lift = 0,
}: {
  name: IconName;
  size?: number;
  color?: string;
  /** When set, the active state cross-fades to this colour instead of a jump. */
  activeColor?: string;
  active?: boolean;
  strokeWidth?: number;
  /** Entrance stagger in ms. Omit to skip the entrance entirely. */
  delay?: number;
  /** Any changing value fires a pop — a count, a boolean, a selected id. */
  pop?: unknown;
  /** Points the glyph rises by while active. */
  lift?: number;
}) {
  const entered = useSharedValue(delay === undefined ? 1 : 0);
  const scale = useSharedValue(1);
  const on = useSharedValue(active ? 1 : 0);
  const first = React.useRef(true);

  React.useEffect(() => {
    if (delay === undefined) return;
    entered.value = withDelay(delay, withTiming(1, { duration: motion.enter, easing: curves.standard }));
  }, [delay, entered]);

  React.useEffect(() => {
    on.value = withTiming(active ? 1 : 0, { duration: motion.enter, easing: curves.standard });
  }, [active, on]);

  // Skipped on mount: otherwise every icon on screen pops at once, which reads
  // as the screen twitching rather than as feedback.
  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (pop === undefined) return;
    scale.value = withSequence(
      withTiming(1.18, { duration: motion.instant, easing: curves.standard }),
      withSpring(1, motion.snap),
    );
  }, [pop, scale]);

  const wrap = useAnimatedStyle(() => ({
    opacity: entered.value,
    transform: [
      { translateY: -on.value * lift + (1 - entered.value) * 6 },
      { scale: scale.value * (0.82 + entered.value * 0.18) },
    ],
  }));

  const activeLayer = useAnimatedStyle(() => ({ opacity: on.value }));
  const baseLayer = useAnimatedStyle(() => ({
    opacity: activeColor === undefined ? 1 : 1 - on.value,
  }));

  return (
    <Animated.View style={wrap}>
      <Animated.View style={baseLayer}>
        <Icon name={name} size={size} color={color} strokeWidth={strokeWidth} />
      </Animated.View>
      {activeColor !== undefined ? (
        // Absolutely positioned so the two copies occupy one box and the
        // cross-fade cannot shift anything around it.
        <Animated.View style={[StyleSheet.absoluteFill, activeLayer]} pointerEvents="none">
          <Icon name={name} size={size} color={activeColor} strokeWidth={strokeWidth} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

/** Icons in a row, each arriving a beat after the last. */
export function IconRow({
  names,
  gap = 12,
  size = 20,
  color,
  step = motion.stagger,
}: {
  names: IconName[];
  gap?: number;
  size?: number;
  color?: string;
  step?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {names.map((n, i) => (
        <AnimatedIcon key={n} name={n} size={size} color={color} delay={i * step} />
      ))}
    </View>
  );
}
