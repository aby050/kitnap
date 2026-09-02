import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '../design/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const R = 62;
const C = 2 * Math.PI * R;
const MINT = palette.accent;

/**
 * The wait before the "you'll spend N years on your phone" reveal.
 *
 * That number lands much harder after a beat of visible work, so this is a
 * real progress ring driven by the flow's own timing rather than a spinner:
 * the arc closes, each line ticks off as it completes, and the last one hands
 * straight over to the reveal. Nothing here fakes a longer wait than the
 * flow actually takes.
 */
export default function AnalyzingLoader({
  lines,
  active,
  duration,
}: {
  lines: string[];
  /** Index of the line currently being worked on. */
  active: number;
  /** How long the whole sequence runs, so the ring finishes with it. */
  duration: number;
}) {
  const progress = useSharedValue(0);
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration, easing: Easing.inOut(Easing.cubic) });
    spin.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [progress, spin, pulse, duration]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: C * (1 - progress.value * 0.995),
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + pulse.value * 0.5,
    transform: [{ scale: 0.9 + pulse.value * 0.14 }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        {/* Track + progress. The ring starts at 12 o'clock, hence the -90°. */}
        <Svg width={150} height={150} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={75} cy={75} r={R} stroke="rgba(255,255,255,0.08)" strokeWidth={3} fill="none" />
          <AnimatedCircle
            cx={75}
            cy={75}
            r={R}
            stroke={MINT}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${C} ${C}`}
            animatedProps={arcProps}
          />
        </Svg>

        {/* A lighter arc chasing the ring so it reads as working, not stalled. */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, spinStyle]}>
          <Svg width={150} height={150}>
            <Circle
              cx={75}
              cy={75}
              r={R - 12}
              stroke="rgba(111,227,169,0.30)"
              strokeWidth={2}
              fill="none"
              strokeDasharray="16 250"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, styles.center, coreStyle]}>
          <View style={styles.core} />
        </Animated.View>
      </View>

      <View style={styles.lines}>
        {lines.map((line, i) => (
          <LineRow key={line} label={line} state={i < active ? 'done' : i === active ? 'live' : 'todo'} index={i} />
        ))}
      </View>
    </View>
  );
}

function LineRow({
  label,
  state,
  index,
}: {
  label: string;
  state: 'done' | 'live' | 'todo';
  index: number;
}) {
  const glow = useSharedValue(0);
  useEffect(() => {
    if (state !== 'live') return;
    glow.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [state, glow]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: state === 'live' ? interpolate(glow.value, [0, 1], [0.35, 1]) : 1,
    transform: [{ scale: state === 'live' ? 0.85 + glow.value * 0.35 : 1 }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(320).delay(index * 90)} exiting={FadeOut} style={styles.row}>
      <Animated.View
        style={[
          styles.dot,
          state === 'done' && styles.dotDone,
          state === 'live' && styles.dotLive,
          dotStyle,
        ]}
      />
      <Text
        style={[
          styles.label,
          state === 'todo' && styles.labelTodo,
          state === 'live' && styles.labelLive,
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  ring: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  core: { width: 22, height: 22, borderRadius: 11, backgroundColor: MINT },
  lines: { marginTop: 34, gap: 12, alignSelf: 'stretch', paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dotDone: { backgroundColor: MINT },
  dotLive: { backgroundColor: MINT },
  label: { color: palette.text, fontSize: 15.5, fontWeight: '600' },
  labelLive: { color: palette.text },
  labelTodo: { color: palette.textQuaternary },
});
