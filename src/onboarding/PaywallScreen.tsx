import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop, Circle, Line } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { palette } from '../design/tokens';
import Icon from '../ui/Icon';

const CHART_W = 340;
const CHART_H = 210;

/** Flat-ish grey curve (regular users) and a descending aurora curve (members). */
const REGULAR = 'M -10 44 C 60 40, 110 52, 170 50 C 230 48, 280 46, 350 46';
const MEMBER = 'M -10 62 C 60 58, 100 92, 170 104 C 230 114, 250 146, 300 152 C 320 154, 335 156, 350 157';
const MEMBER_FILL = `${MEMBER} L 350 210 L -10 210 Z`;

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconWrap}>{icon}</View>
      <Text style={styles.featureText}>
        <Text style={styles.featureTitle}>{title} </Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </Text>
    </View>
  );
}

export default function PaywallScreen({
  onContinue,
  onDecline,
  name,
  personalLine,
  hoursBack = 2,
}: {
  onContinue: () => void;
  /** "Not now" — the discount retention offer (DiscountPaywallScreen) is
   *  only ever shown from here, never unconditionally in the funnel. */
  onDecline?: () => void;
  name?: string;
  /** A line built from the user's own onboarding answers — this is what
   *  makes the paywall feel built for them instead of generic. */
  personalLine?: string;
  hoursBack?: number;
}) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {personalLine ? (
          <Animated.Text entering={FadeInDown.duration(400)} style={styles.eyebrow}>
            {personalLine}
          </Animated.Text>
        ) : null}
        <Animated.Text entering={FadeInDown.delay(80).duration(450)} style={styles.heading}>
          {name ? `${name}, start` : 'Start'} Your Free Week And Gain{'\n'}
          <Text style={styles.headingAccent}>{hoursBack}+ Hours</Text> Back
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.chartWrap}>
          <Svg width={CHART_W} height={CHART_H}>
            <Defs>
              <SvgGradient id="line" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#dcf87a" />
                <Stop offset="0.5" stopColor="#9df5c0" />
                <Stop offset="1" stopColor="#7dd8ff" />
              </SvgGradient>
              <SvgGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#c9f57a" stopOpacity="0.45" />
                <Stop offset="1" stopColor="#7dd8ff" stopOpacity="0.02" />
              </SvgGradient>
            </Defs>

            {[36, 100, 164].map((y) => (
              <Line key={y} x1="0" y1={y} x2={CHART_W} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            ))}

            <Path d={MEMBER_FILL} fill="url(#fill)" />
            <Path d={REGULAR} stroke="rgba(255,255,255,0.18)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <Path d={MEMBER} stroke="url(#line)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <Circle cx="300" cy="152" r="13" fill="#0b0b0b" stroke="#b6f5c8" strokeWidth="3" />
          </Svg>

          <View style={styles.regularPill}>
            <Text style={styles.regularPillText}>Regular Users</Text>
          </View>
          <View style={styles.memberPill}>
            <Text style={styles.memberPillText}>Our Members</Text>
          </View>
        </Animated.View>

        <View style={styles.axisRow}>
          <Text style={styles.axisLeft}>Today</Text>
          <Text style={styles.axisRight}>Screen Time After 2 weeks</Text>
        </View>

        <View style={{ height: 26 }} />

        <Feature icon={<Icon name="shield" size={19} color={palette.text} />} title="Focus, uninterrupted." desc="Finally do your best work yet." />
        <Feature icon={<Icon name="calendar" size={19} color={palette.text} />} title="Own your time." desc="And fill your days with more intention." />
        <Feature icon={<Icon name="user" size={19} color={palette.text} />} title="Be fully present." desc="Because life isn't happening on your screen." />

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={onContinue} />
        {onDecline && (
          <Text style={styles.declineLink} onPress={onDecline}>
            Not now
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 10 },
  heading: {
    color: palette.text,
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 33,
  },
  headingAccent: { color: palette.accent },
  eyebrow: {
    color: palette.accent,
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  chartWrap: { marginTop: 24, alignItems: 'center', height: CHART_H },
  regularPill: {
    position: 'absolute',
    top: 22,
    right: 26,
    backgroundColor: 'rgba(60,60,60,0.95)',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  regularPillText: { color: palette.text, fontSize: 14, fontWeight: '700' },
  memberPill: {
    position: 'absolute',
    top: 108,
    right: 10,
    backgroundColor: '#c9f7b8',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  memberPillText: { color: '#0b2a14', fontSize: 14, fontWeight: '800' },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  axisLeft: { color: palette.textSecondary, fontSize: 13 },
  axisRight: { color: palette.accent, fontSize: 13, fontWeight: '600' },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  featureIcon: { fontSize: 19, width: 34 },
  featureIconWrap: { width: 34, alignItems: 'flex-start', justifyContent: 'center' },
  featureText: { flex: 1, fontSize: 15, lineHeight: 22 },
  featureTitle: { color: palette.text, fontWeight: '700' },
  featureDesc: { color: 'rgba(255,255,255,0.8)' },
  stars: { color: '#FFC94A', fontSize: 17, letterSpacing: 3, textAlign: 'center' },
  reviews: { color: palette.text, fontSize: 14.5, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14, paddingTop: 8 },
  declineLink: { color: palette.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 14, fontWeight: '600' },
});
