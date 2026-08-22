import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { GateQuestion } from '../data/gateQuestions';
import { colors } from '../theme';

const INHALE_MS = 4000;
const HOLD_MS = 2000;
const EXHALE_MS = 4000;

type Phase = 'inhale' | 'hold' | 'exhale';

/** One real guided breathing cycle — the Medium unlock. No taps, no bypass
 *  by holding a button; the only way through is to wait it out. */
export default function BreathingExercise({
  q,
  onDone,
}: {
  q: Extract<GateQuestion, { kind: 'breathe' }>;
  onDone: () => void;
}) {
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<Phase>('inhale');
  const scale = useSharedValue(0.55);
  const timer = useRef<any>(null);

  useEffect(() => {
    runPhase('inhale');
    return () => clearTimeout(timer.current);
  }, [cycle]);

  const runPhase = (p: Phase) => {
    setPhase(p);
    if (p === 'inhale') {
      scale.value = withTiming(1, { duration: INHALE_MS, easing: Easing.inOut(Easing.ease) });
      timer.current = setTimeout(() => runPhase('hold'), INHALE_MS);
    } else if (p === 'hold') {
      timer.current = setTimeout(() => runPhase('exhale'), HOLD_MS);
    } else {
      scale.value = withTiming(0.55, { duration: EXHALE_MS, easing: Easing.inOut(Easing.ease) });
      timer.current = setTimeout(() => {
        if (cycle + 1 >= q.cycles) onDone();
        else setCycle((c) => c + 1);
      }, EXHALE_MS);
    }
  };

  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const label = phase === 'inhale' ? 'Breathe in' : phase === 'hold' ? 'Hold' : 'Breathe out';

  return (
    <View style={styles.qBody}>
      <Text style={styles.prompt}>{q.prompt}</Text>
      <View style={styles.orbWrap}>
        <Animated.View style={[styles.orb, orbStyle]} />
        <Text style={styles.orbLabel}>{label}</Text>
      </View>
      <Text style={styles.hint}>
        Breath {cycle + 1} of {q.cycles}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  qBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 24 },
  prompt: { color: colors.text, fontSize: 23, fontWeight: '700', textAlign: 'center', lineHeight: 31, maxWidth: 320 },
  orbWrap: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  orb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124,245,176,0.18)',
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  orbLabel: { color: colors.text, fontSize: 17, fontWeight: '700' },
  hint: { color: colors.textFaint, fontSize: 13 },
});
