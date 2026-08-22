import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { GateQuestion, pickChallenge } from '../data/gateQuestions';
import { Intensity } from '../data/themes';
import { colors } from '../theme';
import Icon from '../ui/Icon';
import BreathingExercise from './BreathingExercise';
import ActivityChallenge from './ActivityChallenge';
import { success } from '../ui/haptics';

type Props = {
  intensity: Intensity;
  futureSelfMessage: string;
  healthLimited?: boolean;
  onGranted: (minutes: number) => void;
  onAbandoned: () => void;
  onEmergency: () => void;
  /** Tokens the user currently holds — "Skip with a token" is only offered
   *  when this is > 0. */
  tokenBalance: number;
  /** Spends one token and grants the unlock immediately, no challenge. */
  onSkipWithToken: () => void;
};

function MathQuestion({ q, onDone }: { q: Extract<GateQuestion, { kind: 'math' }>; onDone: () => void }) {
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  const answer = q.op === '+' ? q.a + q.b : q.op === '−' ? q.a - q.b : q.a * q.b;

  const submit = () => {
    if (Number(input.trim()) === answer) onDone();
    else {
      setWrong(true);
      setInput('');
      setTimeout(() => setWrong(false), 900);
    }
  };

  return (
    <View style={styles.qBody}>
      <Text style={styles.prompt}>{q.prompt}</Text>
      <Text style={styles.mathExpr}>
        {q.a} {q.op} {q.b} = ?
      </Text>
      <TextInput
        value={input}
        onChangeText={setInput}
        keyboardType="number-pad"
        placeholder="Your answer"
        placeholderTextColor={colors.textFaint}
        style={[styles.input, wrong && styles.inputWrong]}
        autoFocus
      />
      {wrong && <Text style={styles.wrongText}>Not quite — try again.</Text>}
      <Pressable disabled={input.trim().length === 0} onPress={submit} style={[styles.cta, input.trim().length === 0 && styles.ctaDisabled]}>
        <Text style={styles.ctaText}>Continue</Text>
      </Pressable>
    </View>
  );
}

function QuizQuestion({ q, onDone }: { q: Extract<GateQuestion, { kind: 'quiz' }>; onDone: () => void }) {
  const [chosen, setChosen] = useState<number | null>(null);

  return (
    <View style={styles.qBody}>
      <Text style={styles.prompt}>{q.prompt}</Text>
      <View style={styles.options}>
        {q.options.map((opt, i) => {
          const isChosen = chosen === i;
          const isCorrect = i === q.correctIndex;
          const showState = chosen !== null && (isChosen || isCorrect);
          return (
            <Pressable
              key={opt}
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
          );
        })}
      </View>
      {chosen !== null && (
        <Animated.View entering={FadeIn.duration(250)} style={{ alignItems: 'center', gap: 14 }}>
          <Text style={styles.hint}>{q.explain}</Text>
          <Pressable onPress={onDone} style={styles.cta}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

export default function GateScreen({
  intensity,
  futureSelfMessage,
  healthLimited = false,
  onGranted,
  onAbandoned,
  onEmergency,
  tokenBalance,
  onSkipWithToken,
}: Props) {
  // One challenge, chosen fresh each time this screen mounts — not
  // recomputed on every render, so retrying doesn't reroll the question.
  const q = useMemo(() => pickChallenge(intensity.key, healthLimited), [intensity.key, healthLimited]);
  const [showFutureSelf, setShowFutureSelf] = useState(!!futureSelfMessage);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const grant = () => {
    success();
    onGranted(intensity.grantMinutes);
  };

  if (showFutureSelf) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.qBody}>
          <Text style={styles.eyebrow}>FROM YOU, EARLIER</Text>
          <Text style={styles.futureSelf}>“{futureSelfMessage}”</Text>
          <Pressable onPress={() => setShowFutureSelf(false)} style={styles.cta}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onAbandoned} hitSlop={10}>
          <Icon name="close" size={16} color={colors.textDim} />
        </Pressable>
        <Text style={styles.challengeLabel}>
          {intensity.key === 'strict' && q.kind === 'activity' ? 'Physical unlock' : 'Quick unlock'}
        </Text>
        <Pressable onPress={onEmergency} hitSlop={10}>
          <Text style={styles.emergency}>Emergency</Text>
        </Pressable>
      </View>

      <Animated.View entering={FadeInUp.duration(380)} style={{ flex: 1 }}>
        {q.kind === 'breathe' && <BreathingExercise q={q} onDone={grant} />}
        {q.kind === 'math' && <MathQuestion q={q} onDone={grant} />}
        {q.kind === 'quiz' && <QuizQuestion q={q} onDone={grant} />}
        {q.kind === 'activity' && <ActivityChallenge q={q} onDone={grant} />}
      </Animated.View>

      <View style={styles.skipWrap}>
        <Pressable onPress={() => setShowSkipConfirm(true)} hitSlop={10}>
          <Text style={styles.skipLink}>
            {tokenBalance > 0 ? 'Skip with a token instead' : 'No tokens left to skip'}
          </Text>
        </Pressable>
      </View>

      {showSkipConfirm && (
        <View style={styles.confirmOverlay}>
          <Animated.View entering={FadeIn.duration(200)} style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Skip this challenge?</Text>
            <Text style={styles.confirmBody}>
              Spend 1 emergency token and unlock instantly, no challenge. You have {tokenBalance} token
              {tokenBalance === 1 ? '' : 's'}.
            </Text>
            <Pressable
              disabled={tokenBalance <= 0}
              onPress={() => {
                setShowSkipConfirm(false);
                success();
                onSkipWithToken();
              }}
              style={[styles.confirmSpendBtn, tokenBalance <= 0 && styles.ctaDisabled]}
            >
              <Text style={styles.ctaText}>Spend 1 token and skip</Text>
            </Pressable>
            <Pressable onPress={() => setShowSkipConfirm(false)} style={styles.confirmKeepBtn}>
              <Text style={styles.confirmKeepText}>Never mind, I'll do it</Text>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  close: { color: colors.textDim, fontSize: 20 },
  challengeLabel: { color: colors.textDim, fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  skipWrap: { alignItems: 'center', paddingBottom: 22 },
  skipLink: { color: 'rgba(255,255,255,0.4)', fontSize: 13.5, fontWeight: '600', textDecorationLine: 'underline' },
  confirmOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#141517',
    borderRadius: 26,
    padding: 24,
    gap: 14,
  },
  confirmTitle: { color: '#ffffff', fontSize: 19, fontWeight: '800', textAlign: 'center' },
  confirmBody: { color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  confirmSpendBtn: {
    paddingVertical: 15,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    marginTop: 4,
  },
  confirmKeepBtn: { paddingVertical: 13, alignItems: 'center' },
  confirmKeepText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
  emergency: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotOn: { backgroundColor: colors.accent },
  qBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 20 },
  eyebrow: { color: colors.textDim, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  prompt: { color: colors.text, fontSize: 23, fontWeight: '700', textAlign: 'center', lineHeight: 31, maxWidth: 320 },
  futureSelf: { color: colors.accent, fontSize: 22, fontWeight: '600', textAlign: 'center', lineHeight: 32, maxWidth: 320 },
  recallBody: { color: colors.accent, fontSize: 21, fontWeight: '600', textAlign: 'center', lineHeight: 30, maxWidth: 320 },
  options: { width: '100%', maxWidth: 320, gap: 10 },
  option: {
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
  },
  optionDontKnow: { paddingVertical: 22, backgroundColor: 'rgba(255,255,255,0.13)', borderColor: 'rgba(255,255,255,0.3)' },
  optionText: { color: colors.text, fontSize: 16, fontWeight: '500' },
  optionDontKnowText: { fontSize: 18, fontWeight: '700' },
  optionCorrect: { backgroundColor: 'rgba(124,245,176,0.15)', borderColor: colors.accent },
  optionWrong: { backgroundColor: 'rgba(255,107,107,0.12)', borderColor: 'rgba(255,107,107,0.5)' },
  mathExpr: { color: colors.accent, fontSize: 30, fontWeight: '800' },
  inputWrong: { borderWidth: 1, borderColor: 'rgba(255,107,107,0.6)' },
  wrongText: { color: 'rgba(255,107,107,0.85)', fontSize: 13, marginTop: -10 },
  textArea: {
    width: '100%',
    maxWidth: 320,
    minHeight: 110,
    borderRadius: 20,
    backgroundColor: colors.pillBg,
    color: colors.text,
    fontSize: 16,
    padding: 18,
    textAlignVertical: 'top',
  },
  counter: { color: colors.textFaint, fontSize: 13, marginTop: -10 },
  input: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: colors.pillBg,
    color: colors.text,
    fontSize: 18,
    textAlign: 'center',
  },
  dwellTrack: { width: '100%', maxWidth: 300, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  dwellBar: { height: '100%', backgroundColor: colors.accent },
  holdCount: { color: colors.accent, fontSize: 40, fontWeight: '800' },
  holdPad: {
    width: '100%',
    maxWidth: 300,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  holdFill: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(124,245,176,0.28)', right: undefined },
  holdLabel: { color: colors.text, fontSize: 17, fontWeight: '700' },
  hint: { color: colors.textFaint, fontSize: 13 },
  cta: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.3 },
  ctaText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
