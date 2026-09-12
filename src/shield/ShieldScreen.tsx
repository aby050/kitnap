import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AppTheme } from '../data/themes';
import { pickShieldMessage, shieldMessageSeed } from '../data/shieldMessages';
import { daysUntil, GoalData } from '../data/goal';
import { Button, Editorial, GlowField, Pill } from '../design/primitives';
import { palette, space, radius, type } from '../design/tokens';
import Icon from '../ui/Icon';
import { success, tapLight, warning } from '../ui/haptics';

type Props = {
  theme: AppTheme;
  goal: GoalData;
  unlockNumber: number;
  /** Days since first open. Rotates the shield line across days as well as
   *  within one, since `unlockNumber` resets at midnight. */
  dayNumber?: number;
  /** Earned unlocks still available today. At zero the challenge is no
   *  longer offered — the only way through is spending a Bailout, which is
   *  finite and costs real money, so the day still has a ceiling. */
  unlocksLeftToday?: number;
  bailoutBalance?: number;
  isBedtime?: boolean;
  /** The schedule sealing the exits right now. While this is set there is no
   *  challenge, no Bailout and no emergency access — a schedule is a lockdown
   *  window, not a second blocklist. Named so the screen can say which one. */
  lockdown?: { name: string; end: string } | null;
  onNotNow: () => void;
  onNeedIt: () => void;
  /** Spends one Bailout and unlocks without a challenge. Only offered once
   *  the day's four earned unlocks are gone. */
  onUseBailout?: () => void;
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
  dayNumber = 1,
  unlocksLeftToday = Infinity,
  bailoutBalance = 0,
  isBedtime = false,
  lockdown = null,
  onNotNow,
  onNeedIt,
  onUseBailout,
  onEmergency,
}: Props) {
  // Mark entrance: springs in from slightly below, then breathes gently.
  const markScale = useSharedValue(0.7);
  const markOpacity = useSharedValue(0);
  const breathe = useSharedValue(1);

  useEffect(() => {
    markOpacity.value = withTiming(1, { duration: 400 });
    markScale.value = withSpring(1, { damping: 14, stiffness: 180, mass: 0.8 });
    // Slow breathing pulse after entrance settles.
    setTimeout(() => {
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }, 800);
  }, []);

  const markAnimStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value * breathe.value }],
  }));
  const remaining = daysUntil(goal.deadlineDate);
  const hasDeadline = goal.deadlineName && remaining !== null && remaining >= 0;

  /* The line is split into a setup and an emphasis so the serif pair can land
   * on the part that actually costs something.
   *
   * This rotates every time the shield raises. It used to be fixed for anyone
   * who had set a goal — the same sentence, several times a day, forever —
   * which is how an interrupt turns into a button you tap through without
   * reading. The personal line isn't lost: it moves below as a quieter
   * reminder, so the screen still knows who you are without saying the same
   * thing twice. */
  const message = pickShieldMessage(theme.key, shieldMessageSeed(dayNumber, unlockNumber));
  const lead = message.lead;
  const emphasis = message.emphasis;

  /* What they actually told us, kept underneath. A deadline outranks a goal
   * line: it is the one that changes on its own. */
  let personal: string | undefined;
  if (hasDeadline) {
    personal = `${goal.deadlineName} in ${remaining} day${remaining === 1 ? '' : 's'}`;
  } else if (goal.line) {
    personal = `You said you wanted ${goal.line}`;
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
          {lockdown ? (
            /* A button that refuses is worse than no button. Inside a lockdown
             * window emergency access is genuinely gone, so the affordance is
             * replaced by the reason it's gone. */
            <View style={styles.emergency}>
              <Icon name="moon" size={15} color={palette.textTertiary} />
              <Text style={styles.emergencyText}>
                {lockdown.name} · until {lockdown.end}
              </Text>
            </View>
          ) : (
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
          )}
        </View>

        <View style={styles.body}>
          {/* Mark / photo — springs in then breathes */}
          <Animated.View style={markAnimStyle}>
            {goal.photoUri ? (
              <Image source={{ uri: goal.photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.mark}>
                <Icon name={theme.mark} size={26} color={palette.text} strokeWidth={1.5} />
              </View>
            )}
          </Animated.View>

          {isBedtime && !lockdown && (
            <Animated.View entering={FadeIn.delay(100).duration(380)}>
              <Pill label="Past your bedtime" icon="moon" tone="warn" />
            </Animated.View>
          )}
          {lockdown && (
            <Animated.View entering={FadeIn.delay(100).duration(380)}>
              <Pill label={`${lockdown.name} · until ${lockdown.end}`} icon="moon" tone="warn" />
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(160).duration(520)}>
            <Editorial lead={lead} emphasis={emphasis} align="center" style={styles.line} />
          </Animated.View>

          {personal && (
            <Animated.View entering={FadeIn.delay(320).duration(420)}>
              <Text style={styles.personal}>{personal}</Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeIn.delay(420).duration(380)}>
            <Text style={styles.ladder}>
              {lockdown
                ? `No unlocks while ${lockdown.name} is on`
                : unlocksLeftToday <= 0
                  ? "That's all three unlocks for today"
                  : `Unlock ${unlockNumber} today · ${unlocksLeftToday} left`}
            </Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(280).duration(460)} style={styles.actions}>
          <Button
            label="Not now"
            variant="primary"
            onPress={() => {
              success();
              onNotNow();
            }}
            haptic={false}
          />
          {lockdown ? (
            // The whole point of a lockdown window: there is no second button.
            // No challenge to attempt, no Bailout to spend, nothing to buy.
            <Text style={styles.spent}>
              You set {lockdown.name} to run until {lockdown.end}. Nothing gets through until then.
            </Text>
          ) : unlocksLeftToday > 0 ? (
            <Button
              label="I need it"
              variant="ghost"
              onPress={() => {
                tapLight();
                onNeedIt();
              }}
              haptic={false}
            />
          ) : bailoutBalance > 0 ? (
            // Past the daily four the challenge is off the table — a Bailout
            // is the only way through, and it is spent rather than earned.
            <Button
              label={`Use 1 Bailout · ${bailoutBalance} left`}
              variant="ghost"
              onPress={() => {
                tapLight();
                onUseBailout?.();
              }}
              haptic={false}
            />
          ) : (
            // No unlocks left and no Bailouts left. This is the ceiling
            // working, so it reads as an ending rather than a locked door
            // with a shop behind it — especially while Bailout purchases
            // aren't live and "get more" would lead nowhere.
            <Text style={styles.spent}>That's the day. Emergency access is still there if you need it.</Text>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  spent: {
    color: palette.textTertiary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
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
  personal: {
    ...type.sub,
    color: palette.textTertiary,
    textAlign: 'center',
    maxWidth: 300,
    paddingHorizontal: space.md,
  },
  ladder: { ...type.sub, color: palette.textQuaternary },

  actions: { paddingHorizontal: space.xl, paddingBottom: space.base, gap: space.sm },
});
