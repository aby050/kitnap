import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { palette, radius } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';

const BENEFITS: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'target', title: 'Set up in minutes', desc: 'Pick a theme and your apps — no complicated rules to learn.' },
  { icon: 'clock', title: 'Get 2+ hours back daily', desc: 'Less scrolling. More time for the things that matter.' },
  { icon: 'trendUp', title: 'Get more done', desc: 'Fewer interruptions, so the work you care about gets your best hours.' },
  { icon: 'moon', title: 'Sleep better', desc: 'Stop late-night scrolling with a bedtime schedule that actually works.' },
];

export default function BenefitsScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
          Here's how this can help you in the next week
        </Animated.Text>

        {/* The whole pitch in one picture: the same two weeks, with the app
            and without it. Drawn rather than claimed — the axis says what is
            being compared, so it reads as a projection, not a promise. */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.chart}>
          <Svg width={320} height={150} viewBox="0 0 320 150">
            <Defs>
              <LinearGradient id="byreFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={palette.accent} stopOpacity={0.22} />
                <Stop offset="1" stopColor={palette.accent} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {[30, 70, 110].map((y) => (
              <Path key={y} d={`M0 ${y} H320`} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            ))}

            {/* Left flat, then a steady decline — what actually happens when
                the reach-for-it moment keeps getting interrupted. */}
            <Path
              d="M0 118 L320 118 L320 150 L0 150 Z"
              fill="none"
            />
            <Path
              d="M4 34 C 60 34, 80 44, 110 58 S 180 92, 230 104 S 290 112, 316 114"
              stroke={palette.accent}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M4 34 C 60 34, 80 44, 110 58 S 180 92, 230 104 S 290 112, 316 114 L316 150 L4 150 Z"
              fill="url(#byreFill)"
            />
            {/* Everyone else: flat. Nothing changes on its own. */}
            <Path
              d="M4 30 C 90 32, 180 30, 316 33"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={2.5}
              fill="none"
              strokeDasharray="7 7"
              strokeLinecap="round"
            />
            <Circle cx={316} cy={114} r={6} fill={palette.accent} />
            <Circle cx={316} cy={114} r={11} fill={palette.accent} opacity={0.22} />
          </Svg>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendKey, styles.legendKeyMuted]} />
              <Text style={styles.legendText}>Without Byre</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendKey} />
              <Text style={styles.legendText}>With Byre</Text>
            </View>
          </View>
          <View style={styles.axis}>
            <Text style={styles.axisText}>Today</Text>
            <Text style={styles.axisText}>Screen time after 2 weeks</Text>
          </View>
        </Animated.View>

        <View style={styles.list}>
          {BENEFITS.map((b, i) => (
            <Animated.View key={b.title} entering={FadeInDown.delay(280 + i * 90).duration(420)} style={styles.row}>
              <View style={styles.iconTile}>
                <Icon name={b.icon} size={22} color={palette.accent} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{b.title}</Text>
                <Text style={styles.desc}>{b.desc}</Text>
              </View>
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
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 40 },
  heading: { color: palette.text, fontSize: 25, fontWeight: '800', textAlign: 'center', lineHeight: 33 },
  chart: { alignItems: 'center', width: '100%' },
  legend: { flexDirection: 'row', gap: 20, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendKey: { width: 16, height: 3, borderRadius: 2, backgroundColor: palette.accent },
  legendKeyMuted: { backgroundColor: 'rgba(255,255,255,0.28)' },
  legendText: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '600' },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 300,
    marginTop: 8,
  },
  axisText: { color: palette.textQuaternary, fontSize: 11.5, fontWeight: '600' },
  wave: { alignItems: 'center', marginTop: 26, marginBottom: 10 },
  list: { marginTop: 20, gap: 22 },
  row: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: palette.text, fontSize: 17, fontWeight: '700' },
  desc: { color: palette.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
