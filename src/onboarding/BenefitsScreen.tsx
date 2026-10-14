import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '../components/ui';
import { palette, fonts } from '../design/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const WAKING_HOURS = 16;
const SIZE = 236;
const STROKE = 22;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/** Share of a 16-hour waking day, drawn as a ring. Two arcs: the day now, and
 *  the slice that would remain at the goal, so the gap reads at a glance. */
function DayRing({ now, goal }: { now: number; goal: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(350, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, []);
  const nowFrac = Math.min(1, now / WAKING_HOURS);
  const goalFrac = Math.min(1, goal / WAKING_HOURS);
  const nowProps = useAnimatedProps(() => ({ strokeDashoffset: C * (1 - nowFrac * t.value) }));
  const goalProps = useAnimatedProps(() => ({ strokeDashoffset: C * (1 - goalFrac * t.value) }));
  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="rgba(255,255,255,0.1)" strokeWidth={STROKE} fill="none" />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${C} ${C}`}
          animatedProps={nowProps}
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={palette.accent}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${C} ${C}`}
          animatedProps={goalProps}
        />
      </Svg>
      <View style={styles.ringCenter} pointerEvents="none">
        <Text style={styles.ringBig}>{now.toFixed(1)}</Text>
        <Text style={styles.ringUnit}>hours a day</Text>
        <Text style={styles.ringSub}>on your phone</Text>
      </View>
    </View>
  );
}

function Stat({ icon, value, label, delay }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.stat}>
      <Ionicons name={icon} size={22} color={palette.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function BenefitsScreen({
  onContinue,
  hours = 3,
  fromUsage = false,
}: {
  onContinue: () => void;
  /** Daily hours: measured from usage when granted, otherwise estimated from answers. */
  hours?: number;
  fromUsage?: boolean;
}) {
  const now = Math.max(0.5, Math.round(hours * 10) / 10);
  // A goal is a target the person is setting, not a promised result: halve it,
  // never below an hour, and never above where they already are.
  const goal = Math.min(now, Math.max(1, Math.round(now * 0.5 * 10) / 10));
  const daysNow = Math.round((now * 365) / 24);
  const daysGoal = Math.round((goal * 365) / 24);
  const saved = Math.max(0, daysNow - daysGoal);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.Text entering={FadeInDown.duration(400)} style={styles.eyebrow}>
          WHERE YOUR DAY GOES
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.ringWrap}>
          <DayRing now={now} goal={goal} />
        </Animated.View>

        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
          <Text style={styles.legendText}>Now</Text>
          <View style={[styles.dot, { backgroundColor: palette.accent, marginLeft: 18 }]} />
          <Text style={styles.legendText}>Goal, {goal.toFixed(1)} h</Text>
        </View>
        <Text style={styles.source}>
          {fromUsage ? 'Measured from your phone’s usage.' : 'Estimated from your answers.'} Ring = your 16 waking hours.
        </Text>

        <View style={styles.stats}>
          <Stat icon="calendar-outline" value={`${daysNow} days`} label="a year, at this pace" delay={700} />
          <Stat icon="flag-outline" value={`${saved} days`} label="a year, back at your goal" delay={800} />
        </View>
      </View>

      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 28, alignItems: 'center' },
  eyebrow: { color: palette.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.8, alignSelf: 'flex-start' },
  ringWrap: { marginTop: 22 },
  ringCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringBig: { color: palette.text, fontFamily: fonts.extrabold, fontSize: 58, fontWeight: '800', letterSpacing: -2, lineHeight: 62 },
  ringUnit: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontFamily: fonts.semibold, fontWeight: '600', marginTop: 2 },
  ringSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12.5, marginTop: 1 },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 7 },
  legendText: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '600' },
  source: { color: 'rgba(255,255,255,0.6)', fontSize: 12.5, marginTop: 8, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 12, marginTop: 24, alignSelf: 'stretch' },
  stat: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: palette.onColor,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.onColorBorder,
    gap: 4,
  },
  statValue: { color: palette.text, fontSize: 24, fontFamily: fonts.bold, fontWeight: '700', letterSpacing: -0.5, marginTop: 6 },
  statLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 12.5, lineHeight: 17 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
