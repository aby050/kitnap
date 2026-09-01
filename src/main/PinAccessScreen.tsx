import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { palette } from '../design/tokens';
import Icon from '../ui/Icon';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

/** A PIN on Settings itself — not on unlocking apps. This guards the rules,
 *  the same job Guardian does for people, for anyone who shares this device.
 *  Two modes: 'verify' checks against an existing PIN before Settings opens;
 *  otherwise it's the set → confirm flow that creates one. */
export default function PinAccessScreen({
  existingPin,
  onBack,
  onSet,
  onVerified,
}: {
  existingPin?: string | null;
  onBack: () => void;
  onSet?: (pin: string) => void;
  onVerified?: () => void;
}) {
  const verifyMode = !!existingPin;
  const [stage, setStage] = useState<'verify' | 'set' | 'confirm' | 'done'>(verifyMode ? 'verify' : 'set');
  const [first, setFirst] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const shake = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const fail = () => {
    setError(true);
    shake.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-10, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
    setTimeout(() => {
      setPin('');
      setError(false);
    }, 400);
  };

  const press = (d: string) => {
    if (d === '') return;
    if (d === '⌫') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);

    if (next.length === 4) {
      if (stage === 'verify') {
        if (next === existingPin) {
          setTimeout(() => onVerified?.(), 150);
        } else {
          fail();
        }
      } else if (stage === 'set') {
        setTimeout(() => {
          setFirst(next);
          setPin('');
          setStage('confirm');
        }, 150);
      } else if (stage === 'confirm') {
        if (next === first) {
          onSet?.(next);
          setTimeout(() => setStage('done'), 150);
        } else {
          fail();
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>PIN code access</Text>
        <View style={{ width: 40 }} />
      </View>

      {stage === 'done' ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.doneBody}>
          <Icon name="lock" size={40} color={palette.accent} strokeWidth={1.6} />
          <Text style={styles.doneTitle}>PIN set</Text>
          <Text style={styles.doneSub}>
            Opening Settings will now ask for this PIN. This never applies to Emergency access.
          </Text>
        </Animated.View>
      ) : (
        <View style={styles.body}>
          <Animated.Text entering={FadeInDown.duration(380)} style={styles.prompt}>
            {stage === 'verify' ? 'Enter your PIN' : stage === 'set' ? 'Choose a 4-digit PIN' : 'Confirm your PIN'}
          </Animated.Text>

          <Animated.View style={[styles.dots, shakeStyle]}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled, error && styles.dotError]} />
            ))}
          </Animated.View>

          <View style={styles.pad}>
            {DIGITS.map((d, i) => (
              <Pressable
                key={i}
                disabled={d === ''}
                onPress={() => press(d)}
                style={[styles.key, d === '' && styles.keyGhost]}
              >
                {d === '⌫' ? (
                  <Icon name="backspace" size={24} color={palette.text} strokeWidth={1.7} />
                ) : (
                  <Text style={styles.keyText}>{d}</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8 },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: palette.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  body: { flex: 1, alignItems: 'center', paddingTop: 50 },
  prompt: { color: palette.text, fontSize: 19, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 16, marginTop: 30, marginBottom: 50 },
  dot: { width: 15, height: 15, borderRadius: 8, borderWidth: 1.5, borderColor: palette.borderStrong },
  dotFilled: { backgroundColor: palette.text, borderColor: palette.text },
  dotError: { backgroundColor: palette.danger, borderColor: palette.danger },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 260, justifyContent: 'center' },
  key: { width: 80, height: 68, alignItems: 'center', justifyContent: 'center' },
  keyGhost: {},
  keyText: { color: palette.text, fontSize: 24, fontWeight: '600' },
  doneBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 14 },
  doneGlyph: { fontSize: 44 },
  doneTitle: { color: palette.text, fontSize: 22, fontWeight: '800' },
  doneSub: { color: palette.textSecondary, fontSize: 14.5, textAlign: 'center', lineHeight: 21 },
});
