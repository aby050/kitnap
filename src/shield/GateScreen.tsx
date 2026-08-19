import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { buildGate, GateQuestion } from '../data/gateQuestions';
import { Intensity } from '../data/themes';
import { colors } from '../theme';

type Props = {
  unlockNumber: number;
  intensity: Intensity;
  futureSelfMessage: string;
  goalLine?: string;
  onGranted: (minutes: number) => void;
  onAbandoned: () => void;
  onEmergency: () => void;
};

function DwellQuestion({ q, onDone }: { q: Extract<GateQuestion, { kind: 'dwell' }>; onDone: () => void }) {
  const progress = useSharedValue(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    progress.value = withTiming(1, { duration: q.seconds * 1000, easing: Easing.linear });
    const t = setTimeout(() => setReady(true), q.seconds * 1000);
    return () => clearTimeout(t);
  }, []);

  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.qBody}>
      <Text style={styles.prompt}>{q.prompt}</Text>
      <View style={styles.dwellTrack}>
        <Animated.View style={[styles.dwellBar, bar]} />
      </View>
      <Pressable disabled={!ready} onPress={onDone} style={[styles.cta, !ready && styles.ctaDisabled]}>
        <Text style={styles.ctaText}>{ready ? 'Continue' : 'Read it'}</Text>
      </Pressable>
    </View>
  );
}

function HoldQuestion({ q, onDone }: { q: Extract<GateQuestion, { kind: 'hold' }>; onDone: () => void }) {
  const progress = useSharedValue(0);
  const timer = useRef<any>(null);
  const [held, setHeld] = useState(0);

  const start = () => {
    progress.value = withTiming(1, { duration: q.seconds * 1000, easing: Easing.linear });
    const startedAt = Date.now();
    timer.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setHeld(elapsed);
      if (elapsed >= q.seconds) {
        clearInterval(timer.current);
        onDone();
      }
    }, 100);
  };

  const stop = () => {
    clearInterval(timer.current);
    progress.value = withTiming(0, { duration: 300 });
    setHeld(0);
  };

  useEffect(() => () => clearInterval(timer.current), []);

  const ring = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.qBody}>
      <Text style={styles.prompt}>{q.prompt}</Text>
      <Text style={styles.holdCount}>{Math.max(0, q.seconds - Math.floor(held))}s</Text>
      <Pressable onPressIn={start} onPressOut={stop} style={styles.holdPad}>
        <Animated.View style={[styles.holdFill, ring]} />
        <Text style={styles.holdLabel}>Hold</Text>
      </Pressable>
      <Text style={styles.hint}>Let go and it resets.</Text>
    </View>
  );
}

export default function GateScreen({
  unlockNumber,
  intensity,
  futureSelfMessage,
  goalLine = '',
  onGranted,
  onAbandoned,
  onEmergency,
}: Props) {
  const questions = useMemo(
    () => buildGate(unlockNumber, intensity.ladderStartsAt, intensity.maxQuestions, goalLine),
    [unlockNumber],
  );
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');

  // At unlock #4 and above their own recorded message plays first, unskippable.
  const showsFutureSelf = unlockNumber >= 4 && !!futureSelfMessage;
  const [futureSelfSeen, setFutureSelfSeen] = useState(!showsFutureSelf);

  const next = () => {
    setText('');
    if (index >= questions.length - 1) onGranted(intensity.grantMinutes);
    else setIndex(index + 1);
  };

  if (!futureSelfSeen) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.qBody}>
          <Text style={styles.eyebrow}>FROM YOU, EARLIER</Text>
          <Text style={styles.futureSelf}>“{futureSelfMessage}”</Text>
          <Pressable onPress={() => setFutureSelfSeen(true)} style={styles.cta}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const q = questions[index];
  if (!q) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onAbandoned} hitSlop={10}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={styles.dots}>
          {questions.map((_, i) => (
            <View key={i} style={[styles.dot, i <= index && styles.dotOn]} />
          ))}
        </View>
        <Pressable onPress={onEmergency} hitSlop={10}>
          <Text style={styles.emergency}>Emergency</Text>
        </Pressable>
      </View>

      <Animated.View
        key={index}
        entering={FadeInUp.duration(380)}
        exiting={FadeOutUp.duration(180)}
        style={{ flex: 1 }}
      >
        {q.kind === 'tap' && (
          <View style={styles.qBody}>
            <Text style={styles.prompt}>{q.prompt}</Text>
            <View style={styles.options}>
              {q.options.map((opt, i) => {
                const isDontKnow = i === q.options.length - 1;
                return (
                  <Pressable
                    key={opt}
                    onPress={isDontKnow ? onAbandoned : next}
                    style={[styles.option, isDontKnow && styles.optionDontKnow]}
                  >
                    <Text style={[styles.optionText, isDontKnow && styles.optionDontKnowText]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {q.kind === 'type' && (
          <View style={styles.qBody}>
            <Text style={styles.prompt}>{q.prompt}</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              placeholder="Type here…"
              placeholderTextColor={colors.textFaint}
              style={styles.textArea}
              autoFocus
            />
            <Text style={styles.counter}>
              {text.trim().length}/{q.minChars}
            </Text>
            <Pressable
              disabled={text.trim().length < q.minChars}
              onPress={next}
              style={[styles.cta, text.trim().length < q.minChars && styles.ctaDisabled]}
            >
              <Text style={styles.ctaText}>Continue</Text>
            </Pressable>
          </View>
        )}

        {q.kind === 'recall' && (
          <View style={styles.qBody}>
            <Text style={styles.eyebrow}>{q.prompt}</Text>
            <Text style={styles.recallBody}>“{q.body}”</Text>
            <Pressable onPress={next} style={styles.cta}>
              <Text style={styles.ctaText}>Continue</Text>
            </Pressable>
          </View>
        )}

        {q.kind === 'dwell' && <DwellQuestion q={q} onDone={next} />}
        {q.kind === 'hold' && <HoldQuestion q={q} onDone={next} />}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  close: { color: colors.textDim, fontSize: 20 },
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
