import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import HoldButton from '../components/HoldButton';
import { INTENSITIES, IntensityKey } from '../data/themes';
import { isLoosening } from '../data/intensityChange';
import { palette, fonts } from '../design/tokens';
import Icon from '../ui/Icon';

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
            <Stop offset="0%" stopColor={palette.accent} stopOpacity="0.15" />
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
  current: currentKey,
  daysOnLevel,
  pending,
}: {
  onContinue: (key: IntensityKey) => void;
  recommended?: IntensityKey;
  recommendedReasons?: string[];
  /** The level actually in force. Absent during onboarding, when there
   *  isn't one yet and nothing below applies. */
  current?: IntensityKey;
  daysOnLevel?: number | null;
  /** A step down already requested and waiting out its day. */
  pending?: { key: IntensityKey; at: number } | null;
}) {
  const [selected, setSelected] = useState<IntensityKey>(recommended ?? 'steady');
  const current = INTENSITIES.find((i) => i.key === selected)!;
  // Loosening waits a day. Say so before the tap, not after — a delay you
  // discover only once it's running feels like the app misfired.
  const willWait =
    !!currentKey && isLoosening(currentKey, selected) && selected !== currentKey;
  const currentName = INTENSITIES.find((i) => i.key === currentKey)?.name ?? '';
  const pendingName = INTENSITIES.find((i) => i.key === pending?.key)?.name ?? '';
  const hoursLeft = pending ? Math.max(1, Math.ceil((pending.at - Date.now()) / 3600000)) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <HeaderGlow />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header Title */}
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
          how hard should this {<Text style={{ color: palette.accent }}>push back?</Text>}
        </Animated.Text>
        <Text style={styles.sub}>
          Both levels give you the same thing: three unlocks a day, three minutes each. What changes is
          what it takes to earn one — answer something, or do something. Easing off later takes a day.
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
                <View style={styles.segInner}>
                  <Text style={[styles.segText, active && styles.segTextActive]}>{i.name}</Text>
                  {i.key === recommended && (
                    <Icon name="check" size={13} color={active ? palette.accent : 'rgba(255,255,255,0.45)'} strokeWidth={2.6} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {recommended && recommendedReasons && recommendedReasons.length > 0 && (
          <Animated.View
            layout={LinearTransition.duration(260)}
            entering={FadeInDown.duration(420)}
            style={styles.recommendBox}
          >
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
        {/* The table stays mounted and only the values cross-fade. Remounting
            the whole card on every switch made the spec pop out and back in,
            which read as a load rather than a change. */}
        <Animated.View layout={LinearTransition.duration(260)} style={styles.table}>
          {ROWS.map((row, i) => (
            <View key={row.label} style={[styles.row, i < ROWS.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Animated.Text
                key={row.get(current)}
                entering={FadeIn.duration(240)}
                style={styles.rowValue}
              >
                {row.get(current)}
              </Animated.Text>
            </View>
          ))}
        </Animated.View>

        {/* Tip Warning Card */}
        <View style={styles.note}>
          <View style={styles.noteHeader}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={palette.accent} strokeWidth="2" fill="none" />
              <Path d="M12 8v5M12 16h.01" stroke={palette.accent} strokeWidth="2" strokeLinecap="round" />
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
        {pending && (
          <Text style={styles.notice}>
            {pendingName} is already scheduled — it takes over in about {hoursLeft}h.
          </Text>
        )}
        {!pending && willWait && (
          <Text style={styles.notice}>
            Easing off takes a day. You'll stay on {currentName} until this time tomorrow — that
            wait is the point of having picked it.
          </Text>
        )}
        {!pending && !willWait && currentKey && daysOnLevel !== null && daysOnLevel !== undefined && (
          <Text style={styles.notice}>
            {currentName} for {daysOnLevel === 0 ? 'less than a day' : `${daysOnLevel} day${daysOnLevel === 1 ? '' : 's'}`}.
          </Text>
        )}
        {/* Held, not tapped. Picking how hard the app should push back is the
            one choice the whole product hangs off — the charge under the
            thumb is the screen asking whether you mean it. */}
        <HoldButton
          label={willWait ? 'Yes, schedule it' : 'Yes, I understand'}
          holdLabel="Hold to continue"
          holdMs={2000}
          onComplete={() => onContinue(selected)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  notice: {
    color: palette.textTertiary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
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
  heading: { color: palette.text, fontFamily: fonts.extrabold, fontSize: 34, fontWeight: '800', textAlign: 'left', lineHeight: 36, letterSpacing: -1.2, textTransform: 'lowercase', alignSelf: 'stretch' },
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
    backgroundColor: 'rgba(111, 227, 169, 0.08)',
    borderColor: palette.accent, // clean glowing accent border
  },
  segInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  segText: {
    color: 'rgba(255,255,255,0.4)', 
    fontSize: 15, 
    fontWeight: '600',
  },
  segTextActive: { 
    color: palette.accent, 
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
    backgroundColor: 'rgba(111, 227, 169, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(111, 227, 169, 0.16)',
  },
  recommendTitle: {
    color: palette.accent,
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
    backgroundColor: 'rgba(111, 227, 169, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(111, 227, 169, 0.12)',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteTitle: {
    color: palette.accent,
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
