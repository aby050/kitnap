import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { palette, fonts } from '../design/tokens';
import { Ionicons } from '@expo/vector-icons';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CHART_H = 150;

/** Bars grow from the floor, staggered, so the chart reads as a week filling in. */
function Bar({ i, hours, max, ghost }: { i: number; hours: number; max: number; ghost: number }) {
  const v = useSharedValue(0);
  React.useEffect(() => {
    v.value = withDelay(500 + i * 90, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
  }, []);
  const now = useAnimatedStyle(() => ({ height: Math.max(6, (hours / max) * CHART_H * v.value) }));
  const goal = useAnimatedStyle(() => ({ height: Math.max(6, (ghost / max) * CHART_H * v.value) }));
  return (
    <View style={styles.barCol}>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.bar, styles.barNow, now]} />
        <Animated.View style={[styles.bar, styles.barGoal, goal]} />
      </View>
      <Text style={styles.day}>{DAYS[i]}</Text>
    </View>
  );
}

const STATS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'time-outline', label: 'Time back' },
  { icon: 'moon-outline', label: 'Calmer nights' },
  { icon: 'locate-outline', label: 'Better focus' },
];

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
  const goal = Math.round(now * 0.55 * 10) / 10;
  const back = Math.round((now - goal) * 7 * 10) / 10;
  const max = now * 1.15;
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.eyebrow}>
          YOUR WEEK, AT A GLANCE
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(80).duration(420)} style={styles.big}>
          {back}
          <Text style={styles.bigUnit}> hours back</Text>
        </Animated.Text>
        <Text style={styles.sub}>
          {fromUsage ? 'Measured from your usage.' : 'Estimated from your answers.'} The grey is your day now; the green is what's left of it if you hold your plan.
        </Text>

        <View style={styles.chart}>
          {DAYS.map((_, i) => (
            <Bar key={i} i={i} hours={now} ghost={goal} max={max} />
          ))}
        </View>
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.28)' }]} />
          <Text style={styles.legendText}>Now, {now} h a day</Text>
          <View style={[styles.dot, { backgroundColor: palette.accent, marginLeft: 16 }]} />
          <Text style={styles.legendText}>With a plan, {goal} h</Text>
        </View>

        <View style={styles.stats}>
          {STATS.map((s, i) => (
            <Animated.View key={s.label} entering={FadeInDown.delay(900 + i * 90).duration(380)} style={styles.stat}>
              <Ionicons name={s.icon} size={24} color={palette.accent} />
              <Text style={styles.statText}>{s.label}</Text>
            </Animated.View>
          ))}
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
  body: { flex: 1, paddingHorizontal: 26, paddingTop: 30 },
  eyebrow: { color: palette.accent, fontSize: 11.5, fontWeight: '800', letterSpacing: 1.6 },
  big: { color: palette.text, fontFamily: fonts.extrabold, fontSize: 64, fontWeight: '800', letterSpacing: -2, marginTop: 6 },
  bigUnit: { fontSize: 24, fontFamily: fonts.semibold, fontWeight: '600', letterSpacing: -0.3, color: 'rgba(255,255,255,0.8)' },
  sub: { color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 20, marginTop: 4, maxWidth: 330 },
  chart: {
    marginTop: 26,
    height: CHART_H + 26,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  barCol: { alignItems: 'center', width: 34 },
  barTrack: { height: CHART_H, width: 34, justifyContent: 'flex-end' },
  bar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 9 },
  barNow: { backgroundColor: 'rgba(255,255,255,0.22)' },
  barGoal: { backgroundColor: palette.accent },
  day: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', marginTop: 8 },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { color: 'rgba(255,255,255,0.78)', fontSize: 12.5 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 24 },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: palette.onColor,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.onColorBorder,
  },
  statText: { color: palette.text, fontSize: 12.5, fontWeight: '700' },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
