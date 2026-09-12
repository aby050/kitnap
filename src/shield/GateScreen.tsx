import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { GateQuestion, pickChallenge } from '../data/gateQuestions';
import { KeyboardAvoider } from '../components/KeyboardAware';
import { Intensity } from '../data/themes';
import { Button, Card, Field, IconButton, Screen } from '../design/primitives';
import { palette, radius, space, type } from '../design/tokens';
import BreathingExercise from './BreathingExercise';
import ActivityChallenge from './ActivityChallenge';
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
};

/** Family C — Self-confrontation. The user types a free-text response; the
 *  text is captured via onTextChange so the parent can store it as a
 *  reflection regardless of whether the gate is passed or abandoned. */
function TypeQuestion({
  q,
  onDone,
  onTextChange,
}: {
  q: Extract<GateQuestion, { kind: 'type' }>;
  onDone: () => void;
  onTextChange?: (text: string) => void;
}) {
  const [input, setInput] = useState('');
  const ready = input.trim().length >= q.minChars;

  const handleChange = (text: string) => {
    setInput(text);
    onTextChange?.(text);
  };

  return (
    <View style={styles.qBody}>
      <Animated.View entering={FadeInDown.duration(340)}>
        <Text style={styles.prompt}>{q.prompt}</Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(80).duration(340)} style={{ width: '100%' }}>
        <Field
          value={input}
          onChangeText={handleChange}
          placeholder="Write your answer…"
          multiline
          style={[styles.input, styles.inputMultiline]}
          autoFocus
        />
        <Text style={styles.charHint}>
          {ready ? 'Ready — tap Continue.' : `${Math.max(0, q.minChars - input.trim().length)} more characters`}
        </Text>
      </Animated.View>
      <View style={styles.ctaWrap}>
        <Button label="Continue" variant="primary" disabled={!ready} onPress={onDone} />
      </View>
    </View>
  );
}

function MathQuestion({ q, onDone }: { q: Extract<GateQuestion, { kind: 'math' }>; onDone: () => void }) {
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  const answer = q.op === '+' ? q.a + q.b : q.op === '−' ? q.a - q.b : q.a * q.b;

  // Horizontal shake on wrong answer — tactile feedback without a modal.
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-8, { duration: 55 }),
      withTiming(8, { duration: 55 }),
      withTiming(-4, { duration: 50 }),
      withSpring(0, { damping: 14, stiffness: 300 }),
    );
  };

  const submit = () => {
    if (Number(input.trim()) === answer) onDone();
    else {
      triggerShake();
      setWrong(true);
      setInput('');
      setTimeout(() => setWrong(false), 900);
    }
  };

  return (
    <View style={styles.qBody}>
      <Animated.View entering={FadeInDown.duration(340)}>
        <Text style={styles.prompt}>{q.prompt}</Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(80).duration(340)}>
        <Text style={styles.mathExpr}>
          {q.a} {q.op} {q.b} = ?
        </Text>
      </Animated.View>
      <Animated.View style={shakeStyle}>
        <Field
          value={input}
          onChangeText={setInput}
          keyboardType="number-pad"
          placeholder="Your answer"
          style={[styles.input, wrong && styles.inputWrong]}
          autoFocus
        />
      </Animated.View>
      {wrong && (
        <Animated.Text entering={FadeIn.duration(200)} style={styles.wrongText}>
          Not quite — try again.
        </Animated.Text>
      )}
      <View style={styles.ctaWrap}>
        <Button label="Continue" variant="primary" disabled={input.trim().length === 0} onPress={submit} />
      </View>
    </View>
  );
}

function QuizQuestion({ q, onDone }: { q: Extract<GateQuestion, { kind: 'quiz' }>; onDone: () => void }) {
  const [chosen, setChosen] = useState<number | null>(null);

  return (
    <View style={styles.qBody}>
      <Animated.View entering={FadeInDown.duration(340)}>
        <Text style={styles.prompt}>{q.prompt}</Text>
      </Animated.View>
      <View style={styles.options}>
        {q.options.map((opt, i) => {
          const isChosen = chosen === i;
          const isCorrect = i === q.correctIndex;
          const showState = chosen !== null && (isChosen || isCorrect);
          return (
            // Stagger each option 60ms apart so they cascade in.
            <Animated.View key={opt} entering={FadeInUp.delay(80 + i * 60).duration(320)}>
              <Pressable
                disabled={chosen !== null}
                onPress={() => setChosen(i)}
                style={[
                  styles.option,
                  showState && isCorrect && styles.optionCorrect,
                  showState && isChosen && !isCorrect && styles.optionWrong,
                ]}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
      {chosen !== null && (
        <Animated.View entering={FadeInUp.duration(280)} style={styles.quizFoot}>
          <Text style={styles.hint}>{q.explain}</Text>
          <View style={styles.ctaWrap}>
            <Button label="Continue" variant="primary" onPress={onDone} />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

export default function GateScreen({
  intensity,
  futureSelfMessage,
  healthLimitRaw,
  repsFor,
  activitySessions,
  onActivityComplete,
  onGranted,
  onAbandoned,
  onEmergency,
  tokenBalance,
  lockdown = null,
  emergencyRefusal = null,
  onSkipWithToken,
  onReflectionChange,
}: Props) {
  // One challenge, chosen once per mount. Lazy initial state rather than a
  // useMemo: the adaptive rep target is derived from state that can change
  // while this screen is up (a finished session is recorded before the grant
  // lands), and with that in a dependency list the question would reroll out
  // from under a user who had just finished it.
  const [q] = useState<GateQuestion>(() =>
    pickChallenge(intensity.key, healthLimitRaw, repsFor, activitySessions),
  );
  const [showFutureSelf, setShowFutureSelf] = useState(!!futureSelfMessage);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const grant = () => {
    success();
    onGranted(intensity.grantMinutes);
  };

  // A lockdown window comes before everything else on this screen, including
  // the message from your earlier self — there is no decision to inform, so
  // showing a challenge would be theatre. Passing it would grant nothing.
  if (lockdown) {
    return (
      <Screen edges={['top', 'bottom']} bloom>
        <Animated.View entering={FadeIn.duration(500)} style={styles.qBody}>
          <Text style={[type.overline, styles.eyebrow]}>{lockdown.name}</Text>
          <Text style={styles.futureSelf}>
            You set this window to run until {lockdown.end}. No challenge, no Bailout, no emergency
            access until then.
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

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton name="close" size={18} color={palette.textSecondary} onPress={onAbandoned} accessibilityLabel="Cancel unlock" />
        <Text style={[type.overline, styles.challengeLabel]}>
          {intensity.key === 'strict' && q.kind === 'activity' ? 'Physical unlock' : 'Quick unlock'}
        </Text>
        <Pressable onPress={onEmergency} hitSlop={10}>
          <Text style={styles.emergency}>Emergency</Text>
        </Pressable>
      </View>

      {/* Tapping Emergency past its daily limit used to set a flag no screen
          rendered — the button simply did nothing and never said why. */}
      {emergencyRefusal && (
        <Animated.Text entering={FadeIn.duration(220)} style={styles.refusal}>
          {emergencyRefusal}
        </Animated.Text>
      )}

      <KeyboardAvoider style={styles.flex}>
      <Animated.View entering={FadeInUp.duration(380)} style={styles.flex}>
        {q.kind === 'breathe' && <BreathingExercise q={q} onDone={grant} />}
        {q.kind === 'math' && <MathQuestion q={q} onDone={grant} />}
        {q.kind === 'quiz' && <QuizQuestion q={q} onDone={grant} />}
        {q.kind === 'type' && (
          <TypeQuestion
            q={q}
            onDone={grant}
            onTextChange={(text) => onReflectionChange?.(q.prompt, text)}
          />
        )}
        {q.kind === 'activity' && (
          <ActivityChallenge q={q} repsFor={repsFor} onDone={grant} onComplete={onActivityComplete} />
        )}
      </Animated.View>
      </KeyboardAvoider>

      <View style={styles.skipWrap}>
        <Pressable onPress={() => setShowSkipConfirm(true)} hitSlop={10}>
          <Text style={styles.skipLink}>
            {tokenBalance > 0 ? 'Skip with a Bailout instead' : 'No Bailouts left to skip'}
          </Text>
        </Pressable>
      </View>

      {showSkipConfirm && (
        <View style={styles.confirmOverlay}>
          <Animated.View entering={FadeIn.duration(200)} style={styles.confirmBoxWrap}>
            <Card raised style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>Skip this challenge?</Text>
              <Text style={styles.confirmBody}>
                Use 1 Bailout and unlock instantly, no challenge. You have {tokenBalance}{' '}
                {tokenBalance === 1 ? 'Bailout' : 'Bailouts'}.
              </Text>
              <Button
                label="Use 1 Bailout and skip"
                variant="primary"
                disabled={tokenBalance <= 0}
                onPress={() => {
                  if (tokenBalance <= 0) return;
                  setShowSkipConfirm(false);
                  success();
                  onSkipWithToken();
                }}
                style={styles.confirmSpend}
              />
              <Button label="Never mind, I'll do it" variant="ghost" onPress={() => setShowSkipConfirm(false)} />
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
