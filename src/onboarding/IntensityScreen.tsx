import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import HoldButton from '../components/HoldButton';
import { INTENSITIES, IntensityKey } from '../data/themes';
import { isLoosening } from '../data/intensityChange';
import { palette, fonts } from '../design/tokens';
import Icon from '../ui/Icon';

const { width } = Dimensions.get('window');

type Glyph = keyof typeof Ionicons.glyphMap;

const CARD: Record<IntensityKey, { icon: Glyph; line: string; level: number; step: Glyph; stepLabel: string }> = {
  steady: { icon: 'leaf-outline', line: 'A quick brain challenge to get in', level: 2, step: 'bulb-outline', stepLabel: 'Quick quiz' },
  strict: { icon: 'barbell-outline', line: 'Real movement to get in', level: 4, step: 'body-outline', stepLabel: 'Move' },
};

function Meter({ level, active }: { level: number; active: boolean }) {
  return (
    <View style={styles.meter}>
      {[1, 2, 3, 4, 5].map((n) => (
        <View key={n} style={[styles.meterPip, n <= level && { backgroundColor: active ? palette.accent : 'rgba(255,255,255,0.55)' }]} />
      ))}
    </View>
  );
}

function Flow({ selected, minutes }: { selected: IntensityKey; minutes: number }) {
  const c = CARD[selected];
  const steps: { icon: Glyph; label: string }[] = [
    { icon: 'lock-closed-outline', label: 'App blocked' },
    { icon: c.step, label: c.stepLabel },
    { icon: 'lock-open-outline', label: `${minutes} min open` },
  ];
  return (
    <View style={styles.flow}>
      {steps.map((st, i) => (
        <React.Fragment key={st.label}>
          <View style={styles.flowStep}>
            <View style={styles.flowIcon}>
              <Ionicons name={st.icon} size={22} color={palette.accent} />
            </View>
            <Text style={styles.flowLabel}>{st.label}</Text>
          </View>
          {i < steps.length - 1 && <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" style={{ marginTop: 14 }} />}
        </React.Fragment>
      ))}
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
          how hard should it {<Text style={{ color: palette.accent }}>push back?</Text>}
        </Animated.Text>
        <Text style={styles.sub}>Pick what it takes to open a blocked app.</Text>

        <View style={styles.cards}>
          {INTENSITIES.map((i, idx) => {
            const active = i.key === selected;
            const c = CARD[i.key];
            return (
              <Animated.View key={i.key} entering={FadeInDown.delay(120 + idx * 90).duration(380)}>
                <Pressable
                  onPress={() => setSelected(i.key)}
                  style={[styles.card, active && styles.cardActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <View style={[styles.cardIcon, active && styles.cardIconActive]}>
                    <Ionicons name={c.icon} size={28} color={active ? '#06232B' : palette.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{i.name}</Text>
                      {i.key === recommended && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>BEST FOR YOU</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardLine}>{c.line}</Text>
                    <Meter level={c.level} active={active} />
                  </View>
                  <View style={[styles.radio, active && styles.radioOn]}>
                    {active && <Ionicons name="checkmark" size={14} color="#06232B" />}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <Text style={styles.flowHeading}>HOW AN UNLOCK WORKS</Text>
        <Animated.View layout={LinearTransition.duration(260)}>
          <Flow selected={selected} minutes={current.grantMinutes} />
        </Animated.View>

        <View style={styles.footnote}>
          <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.footnoteText}>Easing off later takes a day. That wait is the protection.</Text>
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
  sub: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginTop: 8 },
  cards: { gap: 12, marginTop: 22 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardActive: { borderColor: palette.accent, backgroundColor: palette.accentSoft },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconActive: { backgroundColor: palette.accent },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: palette.text, fontSize: 20, fontFamily: fonts.bold, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: palette.accent },
  badgeText: { color: '#06232B', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8 },
  cardLine: { color: 'rgba(255,255,255,0.72)', fontSize: 14, marginTop: 3 },
  meter: { flexDirection: 'row', gap: 4, marginTop: 10 },
  meterPip: { width: 22, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.14)' },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  flowHeading: { color: 'rgba(255,255,255,0.55)', fontSize: 11.5, fontWeight: '800', letterSpacing: 1.6, marginTop: 28, marginBottom: 14 },
  flow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  flowStep: { alignItems: 'center', gap: 8, flex: 1 },
  flowIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, fontWeight: '600', textAlign: 'center' },
  footnote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 26 },
  footnoteText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, flex: 1 },
});
