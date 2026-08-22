import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AppTheme } from '../data/themes';
import { daysUntil, GoalData } from '../data/goal';
import { colors } from '../theme';
import { success, tapLight, warning } from '../ui/haptics';

type Props = {
  theme: AppTheme;
  goal: GoalData;
  unlockNumber: number;
  isBedtime?: boolean;
  onNotNow: () => void;
  onNeedIt: () => void;
  onEmergency: () => void;
};

/** Personal content is the primary content — generic theme lines are only the
 *  fallback for a goal the user hasn't written yet. */
export default function ShieldScreen({
  theme,
  goal,
  unlockNumber,
  isBedtime = false,
  onNotNow,
  onNeedIt,
  onEmergency,
}: Props) {
  const remaining = daysUntil(goal.deadlineDate);
  const hasDeadline = goal.deadlineName && remaining !== null && remaining >= 0;

  let line = theme.lines[unlockNumber % theme.lines.length];
  if (hasDeadline) {
    line = `${goal.deadlineName} in ${remaining} day${remaining === 1 ? '' : 's'}.`;
  } else if (goal.line) {
    line = `You said you wanted ${goal.line}.`;
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={theme.palette} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Break-glass: every shield, every intensity. One tap, zero questions, never charged. */}
        <Pressable onPress={() => { warning(); onEmergency(); }} style={styles.emergencyBtn} hitSlop={10}>
          <Text style={styles.emergencyText}>Emergency</Text>
        </Pressable>

        <View style={styles.body}>
          <Animated.View entering={FadeIn.duration(500)} style={styles.iconWrap}>
            {goal.photoUri ? (
              <Image source={{ uri: goal.photoUri }} style={styles.photo} />
            ) : (
              <Text style={styles.glyph}>{theme.glyph}</Text>
            )}
          </Animated.View>

          {isBedtime && (
            <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.bedtimePill}>
              <Text style={styles.bedtimeText}>🌙 It's past your bedtime</Text>
            </Animated.View>
          )}

          <Animated.Text entering={FadeInDown.delay(150).duration(500)} style={styles.line}>
            {line}
          </Animated.Text>

          <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.ladderPill}>
            <Text style={styles.ladderText}>Unlock #{unlockNumber} today</Text>
          </Animated.View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => { success(); onNotNow(); }} style={styles.primaryBtn}>
            <Text style={styles.primaryText}>Not now</Text>
          </Pressable>
          <Pressable onPress={() => { tapLight(); onNeedIt(); }} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>I need it</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, zIndex: 100 },
  safe: { flex: 1 },
  emergencyBtn: { position: 'absolute', top: 54, right: 20, zIndex: 5 },
  emergencyText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, gap: 26 },
  iconWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 54 },
  photo: { width: 76, height: 76, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  line: { color: '#fff', fontSize: 26, fontWeight: '700', textAlign: 'center', lineHeight: 35 },
  ladderPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 15,
  },
  ladderText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  bedtimePill: {
    backgroundColor: 'rgba(255,184,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.4)',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 15,
  },
  bedtimeText: { color: '#FFD27A', fontSize: 13, fontWeight: '700' },
  actions: { paddingHorizontal: 24, paddingBottom: 20, gap: 12 },
  primaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 17,
    alignItems: 'center',
  },
  primaryText: { color: '#000', fontSize: 17, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 15, alignItems: 'center' },
  secondaryText: { color: 'rgba(255,255,255,0.65)', fontSize: 16, fontWeight: '600' },
});
