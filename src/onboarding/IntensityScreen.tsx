import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { INTENSITIES, IntensityKey } from '../data/themes';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

const ROWS: { label: string; get: (i: (typeof INTENSITIES)[number]) => string }[] = [
  { label: 'Challenge', get: (i) => i.challengeTypes },
  { label: 'An unlock grants', get: (i) => `${i.grantMinutes} min` },
  { label: 'Loosening a rule', get: (i) => i.settingsDelay },
  { label: 'Daily cap', get: (i) => i.dailyCap },
];

// Top Eclipse Orb glow for premium onboarding aesthetics
function HeaderGlow() {
  return (
    <View style={styles.glowContainer}>
      <Svg width={width} height={160} viewBox={`0 0 ${width} 160`}>
        <Defs>
          <RadialGradient id="topGlow" cx="50%" cy="0%" r="50%">
            <Stop offset="0%" stopColor="#7CF5B0" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={width / 2} cy={0} r={140} fill="url(#topGlow)" />
      </Svg>
    </View>
  );
}

export default function IntensityScreen({
  onContinue,
  recommended,
  recommendedReasons,
}: {
  onContinue: (key: IntensityKey) => void;
  recommended?: IntensityKey;
  recommendedReasons?: string[];
}) {
  const [selected, setSelected] = useState<IntensityKey>(recommended ?? 'steady');
  const current = INTENSITIES.find((i) => i.key === selected)!;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <HeaderGlow />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header Title */}
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
          How hard should this push back?
        </Animated.Text>
        <Text style={styles.sub}>
          Every unlock takes the same real challenge — no free early opens. If you'd rather not, an emergency
          token skips it instantly.
        </Text>

        {/* Segmented Row Selector */}
        <View style={styles.segment}>
          {INTENSITIES.map((i) => {
            const active = i.key === selected;
            return (
              <Pressable
                key={i.key}
                onPress={() => setSelected(i.key)}
                style={[
                  styles.segItem,
                  active && styles.segItemActive
                ]}
              >
                <Text style={[styles.segText, active && styles.segTextActive]}>
                  {i.name}{i.key === recommended ? ' ✓' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {recommended && recommendedReasons && recommendedReasons.length > 0 && (
          <Animated.View entering={FadeInDown.duration(420)} style={styles.recommendBox}>
            <Text style={styles.recommendTitle}>
              We recommend {INTENSITIES.find((i) => i.key === recommended)?.name} for you
            </Text>
            {recommendedReasons.map((r) => (
              <Text key={r} style={styles.recommendReason}>
                · {r}
              </Text>
            ))}
          </Animated.View>
        )}

        {/* Spec Table */}
        <Animated.View key={selected} entering={FadeIn.duration(300)} style={styles.table}>
          {ROWS.map((row, i) => (
            <View key={row.label} style={[styles.row, i < ROWS.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.get(current)}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Tip Warning Card */}
        <View style={styles.note}>
          <View style={styles.noteHeader}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#7CF5B0" strokeWidth="2" fill="none" />
              <Path d="M12 8v5M12 16h.01" stroke="#7CF5B0" strokeWidth="2" strokeLinecap="round" />
            </Svg>
            <Text style={styles.noteTitle}>Real Protection</Text>
          </View>
          <Text style={styles.noteText}>
            The delay on loosening your own rules is the real protection. Nobody at 11pm with an impulse waits
            until tomorrow.
          </Text>
        </View>
      </ScrollView>

      {/* Continue CTA Button */}
      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={() => onContinue(selected)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000000',
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    pointerEvents: 'none',
  },
  scroll: { 
    paddingHorizontal: 22, 
    paddingTop: 32, 
    paddingBottom: 20,
    zIndex: 2,
  },
  heading: { 
    color: '#ffffff', 
    fontSize: 27, 
    fontWeight: '800', 
    textAlign: 'center', 
    lineHeight: 35,
    letterSpacing: -0.5,
  },
  sub: { 
    color: 'rgba(255,255,255,0.5)', 
    fontSize: 15, 
    textAlign: 'center', 
    marginTop: 12, 
    lineHeight: 22,
    fontWeight: '500',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28,
    padding: 6,
    marginTop: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  segItem: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 22, 
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  segItemActive: { 
    backgroundColor: 'rgba(124, 245, 176, 0.08)',
    borderColor: '#7CF5B0', // clean glowing green active border
  },
  segText: { 
    color: 'rgba(255,255,255,0.4)', 
    fontSize: 15, 
    fontWeight: '600',
  },
  segTextActive: { 
    color: '#7CF5B0', 
    fontWeight: '800',
  },
  table: { 
    marginTop: 26, 
    backgroundColor: '#141517', // premium card container background
    borderRadius: 24, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rowLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '500',
  },
  rowValue: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '700',
    textAlign: 'right',
  },
  recommendBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 245, 176, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(124, 245, 176, 0.16)',
  },
  recommendTitle: {
    color: '#7CF5B0',
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  recommendReason: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
  },
  note: {
    marginTop: 26, 
    padding: 18, 
    borderRadius: 20, 
    backgroundColor: 'rgba(124, 245, 176, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(124, 245, 176, 0.12)',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteTitle: {
    color: '#7CF5B0',
    fontSize: 14.5,
    fontWeight: '700',
  },
  noteText: { 
    color: 'rgba(255,255,255,0.65)', 
    fontSize: 14, 
    lineHeight: 21,
    fontWeight: '500',
  },
  ctaWrap: { 
    paddingHorizontal: 22, 
    paddingBottom: 14, 
    paddingTop: 8,
  },
});
