import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Intensity } from '../data/themes';
import { Button, Card, IconButton, Screen } from '../design/primitives';
import { palette, radius, space, type } from '../design/tokens';
import { ActivityKind, ActivitySessionResult } from './activity/types';
import { success } from '../ui/haptics';

type Props = {
  intensity: Intensity;
  futureSelfMessage: string;
  /** Free-text onboarding health answer — used to skip unsafe movements. */
  healthLimitRaw?: string | null;
  /** Resolves the adaptive rep target for a given movement. Undefined leaves
   *  Family G's built-in defaults alone. */
  repsFor?: (activity: ActivityKind) => number;
  /** Completed-session history, so a movement finished in the last 24 hours
   *  is rested and the next unlock asks for a different one. */
  activitySessions?: ActivitySessionResult[];
  /** Reports a finished (or abandoned) physical attempt, for the difficulty
   *  model. Never fires for a token skip — that isn't a workout. */
  onActivityComplete?: (session: ActivitySessionResult) => void;
  onGranted: (minutes: number) => void;
  onAbandoned: () => void;
  onEmergency: () => void;
  /** Tokens the user currently holds — "Skip with a token" is only offered
   *  when this is > 0. */
  tokenBalance: number;
  /** The schedule sealing the exits right now. While this is set the gate shows
   *  the window instead of a challenge — there is nothing to attempt, because
   *  passing it would not open anything. */
  lockdown?: { name: string; end: string } | null;
  /** Why emergency access was refused, if it just was. */
  emergencyRefusal?: string | null;
  /** Spends one token and grants the unlock immediately, no challenge. */
  onSkipWithToken: () => void;
  /** Called whenever the user types in a Family C ('type') challenge so the
   *  parent can capture the text before the grant fires. The parent stores it
   *  as pendingReflection and commits it on resolution. */
  onReflectionChange?: (prompt: string, text: string) => void;
  /** Waiting Room: the gate families the user has left switched on. */
  waitingRoomFamilies?: Record<string, boolean>;
};

/**
 * The only way past a block is a Bailout key. There are no push-ups, sums or
 * writing prompts any more: a challenge you can pass is a challenge you will
 * pass, and the key makes the cost of opening the app one the user chose.
 */
export default function GateScreen({
  futureSelfMessage,
  onAbandoned,
  onEmergency,
  tokenBalance,
  lockdown = null,
  emergencyRefusal = null,
  onSkipWithToken,
}: Props) {
  const [showFutureSelf, setShowFutureSelf] = useState(!!futureSelfMessage);
  const [confirm, setConfirm] = useState(false);

  // A lockdown window comes before everything else on this screen: there is
  // nothing to decide, because a Bailout would not open anything either.
  if (lockdown) {
    return (
      <Screen edges={['top', 'bottom']} bloom>
        <Animated.View entering={FadeIn.duration(500)} style={styles.qBody}>
          <Text style={[type.overline, styles.eyebrow]}>{lockdown.name}</Text>
          <Text style={styles.futureSelf}>
            You set this window to run until {lockdown.end}. No Bailout and no emergency access
            until then.
          </Text>
          <View style={styles.ctaWrap}>
            <Button label="Close" variant="primary" onPress={onAbandoned} />
          </View>
        </Animated.View>
      </Screen>
    );
  }

  if (showFutureSelf) {
    return (
      <Screen edges={['top', 'bottom']} bloom>
        <Animated.View entering={FadeIn.duration(500)} style={styles.qBody}>
          <Text style={[type.overline, styles.eyebrow]}>From you, earlier</Text>
          <Text style={styles.futureSelf}>“{futureSelfMessage}”</Text>
          <View style={styles.ctaWrap}>
            <Button label="Continue" variant="primary" onPress={() => setShowFutureSelf(false)} />
          </View>
        </Animated.View>
      </Screen>
    );
  }

  const has = tokenBalance > 0;

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton name="close" size={18} color={palette.textSecondary} onPress={onAbandoned} accessibilityLabel="Stay blocked" />
        <Text style={[type.overline, styles.challengeLabel]}>Blocked</Text>
        <Pressable onPress={onEmergency} hitSlop={10}>
          <Text style={styles.emergency}>Emergency</Text>
        </Pressable>
      </View>

      {emergencyRefusal && (
        <Animated.Text entering={FadeIn.duration(220)} style={styles.refusal}>
          {emergencyRefusal}
        </Animated.Text>
      )}

      <Animated.View entering={FadeInUp.duration(380)} style={styles.qBody}>
        <Text style={styles.prompt}>Still want in?</Text>
        <Text style={styles.confirmBody}>
          {has
            ? `Opening this app costs one Bailout key. You have ${tokenBalance}.`
            : 'You have no Bailout keys left, so this stays closed.'}
        </Text>
        <View style={styles.ctaWrap}>
          <Button label="Stay focused" variant="primary" onPress={onAbandoned} />
          <Button
            label={has ? 'Use a Bailout key' : 'No keys left'}
            variant="ghost"
            disabled={!has}
            onPress={() => setConfirm(true)}
          />
        </View>
      </Animated.View>

      {confirm && (
        <View style={styles.confirmOverlay}>
          <Animated.View entering={FadeIn.duration(200)} style={styles.confirmBoxWrap}>
            <Card raised style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>Use 1 Bailout key?</Text>
              <Text style={styles.confirmBody}>
                The app opens now. You will have {Math.max(0, tokenBalance - 1)} left.
              </Text>
              <Button
                label="Use key and open"
                variant="primary"
                onPress={() => {
                  setConfirm(false);
                  success();
                  onSkipWithToken();
                }}
                style={styles.confirmSpend}
              />
              <Button label="Never mind" variant="ghost" onPress={() => setConfirm(false)} />
            </Card>
          </Animated.View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingTop: space.xs },
  challengeLabel: { color: palette.textTertiary },
  emergency: { ...type.sub, color: palette.textTertiary, fontWeight: '600' },
  refusal: {
    ...type.sub,
    color: palette.textSecondary,
    textAlign: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },

  skipWrap: { alignItems: 'center', paddingBottom: space.xl },
  skipLink: { ...type.sub, color: palette.textTertiary, fontWeight: '600', textDecorationLine: 'underline' },

  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
  },
  confirmBoxWrap: { width: '100%', maxWidth: 360 },
  confirmBox: { gap: space.md },
  confirmTitle: { ...type.title3, textAlign: 'center' },
  confirmBody: { ...type.callout, color: palette.textSecondary, textAlign: 'center', lineHeight: 21 },
  confirmSpend: { marginTop: space.xs },

  qBody: { flex: 1, alignItems: 'stretch', justifyContent: 'center', paddingHorizontal: space.xxl, gap: space.lg },
  eyebrow: { color: palette.textTertiary },
  futureSelf: { ...type.editorial, color: palette.accent, textAlign: 'center', maxWidth: 320, alignSelf: 'center' },
  prompt: { ...type.title2, textAlign: 'center', lineHeight: 31, maxWidth: 320, alignSelf: 'center' },
  mathExpr: { ...type.hero, fontSize: 34, color: palette.accent, letterSpacing: -0.5, textAlign: 'center' },

  options: { width: '100%', gap: space.sm },
  option: {
    paddingVertical: space.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceRaised,
    alignItems: 'center',
  },
  optionText: { ...type.body },
  optionCorrect: { backgroundColor: palette.accentSoft, borderColor: palette.accentBorder },
  optionWrong: { backgroundColor: 'rgba(240,96,74,0.12)', borderColor: palette.danger },
  quizFoot: { width: '100%', alignItems: 'center', gap: space.base },
  hint: { ...type.sub, color: palette.textTertiary, textAlign: 'center', maxWidth: 300 },

  input: {
    width: '100%',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceRaised,
  },
  inputMultiline: {
    textAlign: 'left',
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: space.md,
  },
  charHint: { ...type.sub, color: palette.textTertiary, marginTop: space.xs, textAlign: 'right' },
  inputWrong: { borderColor: palette.danger },
  wrongText: { ...type.sub, color: palette.danger, marginTop: -space.sm },
  ctaWrap: { width: '100%' },
});
