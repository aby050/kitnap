import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { INTENSITIES, IntensityKey } from '../data/themes';
import { colors } from '../theme';

const ROWS: { label: string; get: (i: (typeof INTENSITIES)[number]) => string }[] = [
  { label: 'Friction starts at', get: (i) => `Unlock #${i.ladderStartsAt}` },
  { label: 'Most questions', get: (i) => `${i.maxQuestions}` },
  { label: 'An unlock grants', get: (i) => `${i.grantMinutes} min` },
  { label: 'Loosening a rule', get: (i) => i.settingsDelay },
  { label: 'Daily cap', get: (i) => i.dailyCap },
];

export default function IntensityScreen({ onContinue }: { onContinue: (key: IntensityKey) => void }) {
  const [selected, setSelected] = useState<IntensityKey>('steady');
  const current = INTENSITIES.find((i) => i.key === selected)!;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
          How hard should this push back?
        </Animated.Text>
        <Text style={styles.sub}>
          Friction grows with how much you've already used today — never with the clock. Your first unlock is
          always cheap.
        </Text>

        <View style={styles.segment}>
          {INTENSITIES.map((i) => {
            const active = i.key === selected;
            return (
              <Pressable key={i.key} onPress={() => setSelected(i.key)} style={[styles.segItem, active && styles.segItemActive]}>
                <Text style={[styles.segText, active && styles.segTextActive]}>{i.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <Animated.View key={selected} entering={FadeIn.duration(300)} style={styles.table}>
          {ROWS.map((row, i) => (
            <View key={row.label} style={[styles.row, i < ROWS.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.get(current)}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            The delay on loosening your own rules is the real protection. Nobody at 11pm with an impulse waits
            until tomorrow.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={() => onContinue(selected)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 10 },
  heading: { color: colors.text, fontSize: 25, fontWeight: '800', textAlign: 'center', lineHeight: 33 },
  sub: { color: colors.textDim, fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 26,
    padding: 5,
    marginTop: 26,
  },
  segItem: { flex: 1, paddingVertical: 12, borderRadius: 22, alignItems: 'center' },
  segItemActive: { backgroundColor: 'rgba(124,245,176,0.18)' },
  segText: { color: colors.textDim, fontSize: 15.5, fontWeight: '600' },
  segTextActive: { color: colors.accent, fontWeight: '800' },
  table: { marginTop: 22, backgroundColor: 'rgba(255,255,255,0.045)', borderRadius: 22, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  rowLabel: { color: colors.textDim, fontSize: 15 },
  rowValue: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  note: { marginTop: 22, padding: 16, borderRadius: 18, backgroundColor: 'rgba(124,245,176,0.08)' },
  noteText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 21 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14, paddingTop: 8 },
});
