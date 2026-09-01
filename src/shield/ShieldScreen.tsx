import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AppTheme } from '../data/themes';
import { daysUntil, GoalData } from '../data/goal';
import { Button, Editorial, GlowField, Pill } from '../design/primitives';
import { palette, space, radius, type } from '../design/tokens';
import Icon from '../ui/Icon';
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

/**
 * The Shield — the only screen most users will see most days, and the one
 * moment the whole product turns on.
 *
 * Design intent: it has to interrupt without scolding. So it is quiet — one
 * mark, one sentence, two choices — and the sentence is set in serif rather
 * than the UI sans, because this is the app speaking rather than reporting.
 * Personal content outranks the generic theme line; a theme line is only the
 * fallback for a goal the user hasn't written yet.
 */
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

  /* The line is split into a setup and an emphasis so the serif pair can land
   * on the part that actually costs something — the deadline, or the thing
   * they said they wanted. Generic theme lines are whole sentences, so they
   * run as one piece with no emphasis. */
  let lead: string;
  let emphasis: string | undefined;
  if (hasDeadline) {
    lead = `${goal.deadlineName} in`;
    emphasis = `${remaining} day${remaining === 1 ? '' : 's'}.`;
  } else if (goal.line) {
    lead = 'You said you wanted';
    emphasis = `${goal.line}.`;
  } else {
    lead = theme.lines[unlockNumber % theme.lines.length];
    emphasis = undefined;
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={theme.palette} locations={[0, 0.85]} style={StyleSheet.absoluteFill} />
      {/* Gives the screen a light source, so it reads as designed dark rather
       *  than as an unstyled black overlay. */}
      <GlowField size={560} intensity={0.13} style={styles.bloom} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Break-glass: every shield, every intensity. One tap, zero questions,
         *  never charged. Kept visually quiet but never hidden — the promise is
         *  that it is always there, not that it is easy to reach for. */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Emergency access"
            onPress={() => {
              warning();
              onEmergency();
            }}
            hitSlop={12}
            style={styles.emergency}
          >
            <Icon name="key" size={15} color={palette.textTertiary} />
            <Text style={styles.emergencyText}>Emergency</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Animated.View entering={FadeIn.duration(600)}>
            {goal.photoUri ? (
              <Image source={{ uri: goal.photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.mark}>
                <Icon name={theme.mark} size={26} color={palette.text} strokeWidth={1.5} />
              </View>
            )}
          </Animated.View>

          {isBedtime && (
            <Animated.View entering={FadeIn.delay(120).duration(400)}>
              <Pill label="Past your bedtime" icon="moon" tone="warn" />
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(180).duration(560)}>
            <Editorial lead={lead} emphasis={emphasis} align="center" style={styles.line} />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(460).duration(400)}>
            <Text style={styles.ladder}>Unlock {unlockNumber} today</Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(320).duration(480)} style={styles.actions}>
          <Button
            label="Not now"
            variant="primary"
            onPress={() => {
              success();
              onNotNow();
            }}
            haptic={false}
          />
          <Button
            label="I need it"
            variant="ghost"
            onPress={() => {
              tapLight();
              onNeedIt();
            }}
            haptic={false}
          />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, zIndex: 100, backgroundColor: palette.base },
  bloom: { position: 'absolute', alignSelf: 'center', top: '12%' },
  safe: { flex: 1 },

  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.lg, paddingTop: space.sm },
  emergency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
  },
  emergencyText: { ...type.caption, color: palette.textTertiary },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
    gap: space.xl,
  },
  mark: {
    width: 62,
    height: 62,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: 62,
    height: 62,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderStrong,
  },
  /* Wider measure than the default so a long deadline name doesn't break into
   * four ragged lines. */
  line: { maxWidth: 330 },
  ladder: { ...type.sub, color: palette.textQuaternary },

  actions: { paddingHorizontal: space.xl, paddingBottom: space.base, gap: space.sm },
});
