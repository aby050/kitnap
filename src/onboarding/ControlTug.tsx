import React, { useEffect } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { fonts, palette } from '../design/tokens';
import { HIGHLIGHT, INK, INK_DIM } from './PastelCard';

/**
 * The "how much control" answer as a tug-of-war: the phone on the left, the
 * Kitnap cat on the right, a flag on the rope between them. Each level drags
 * the whole rope toward whoever is winning, so the answer is something you
 * see rather than a number you read. Tapping a numbered stone picks a level.
 */
export default function ControlTug({
  value, min, max, labels, onChange,
}: {
  value: number; min: number; max: number; labels: string[]; onChange: (v: number) => void;
}) {
  const steps = max - min + 1;
  const p = (value - min) / (steps - 1); // 0 = phone wins, 1 = you win
  const width = useSharedValue(0);
  const prog = useSharedValue(p);

  useEffect(() => {
    prog.value = withTiming(p, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [p, prog]);

  const onLayout = (e: LayoutChangeEvent) => { width.value = e.nativeEvent.layout.width; };

  // The whole rope slides toward the winner, up to a quarter of the stage.
  const rope = useAnimatedStyle(() => ({
    transform: [{ translateX: (prog.value - 0.5) * width.value * 0.3 }],
  }));
  // The loser leans in, the winner leans back.
  const phoneLean = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(prog.value - 0.5) * 34}deg` }],
  }));
  const catLean = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(prog.value - 0.5) * 22}deg` }],
  }));
  // Pupils look at the phone when it is winning, up and proud when you are.
  const pupils = useAnimatedStyle(() => ({
    transform: [{ translateX: -3 + prog.value * 2 }, { translateY: 2 - prog.value * 4 }],
  }));
  const screenGlow = useAnimatedStyle(() => ({ opacity: 1 - prog.value * 0.85 }));

  const name = labels[value - min];
  const pick = (v: number) => {
    if (v === value) return;
    Haptics.selectionAsync().catch(() => {});
    onChange(v);
  };

  return (
    <View style={styles.card}>
      <View style={styles.stage} onLayout={onLayout}>
        <View style={styles.centerLine} />
        <Animated.View style={[styles.rig, rope]}>
          <Animated.View style={[styles.phone, phoneLean]}>
            <Animated.View style={[styles.phoneScreen, screenGlow]} />
            <View style={styles.phoneNotch} />
          </Animated.View>
          <View style={styles.rope}>
            <View style={styles.flag}>
              <View style={styles.flagCloth} />
            </View>
          </View>
          <Animated.View style={[styles.cat, catLean]}>
            <View style={styles.eyes}>
              {[0, 1].map((i) => (
                <View key={i} style={styles.eye}>
                  <Animated.View style={[styles.pupil, pupils]} />
                </View>
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      <Text style={styles.name}>{name}</Text>
      <Text style={styles.sub}>
        {p < 0.34 ? 'The phone is winning this one.' : p < 0.67 ? 'Neck and neck.' : 'You’re pulling ahead.'}
      </Text>

      <View style={styles.stones}>
        {Array.from({ length: steps }).map((_, i) => {
          const v = i + min;
          const on = v === value;
          return (
            <Pressable key={v} hitSlop={3} onPress={() => pick(v)} style={[styles.stone, v < value && styles.stonePast, on && styles.stoneOn]}>
              <Text style={[styles.stoneText, on && styles.stoneTextOn]}>{v}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.ends}>
        <Text style={styles.endText}>📱 Phone wins</Text>
        <Text style={styles.endText}>You win 🐾</Text>
      </View>
    </View>
  );
}

const CAT = 62;
const styles = StyleSheet.create({
  card: {
    paddingTop: 14, paddingBottom: 18, paddingHorizontal: 16,
    borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: INK, marginBottom: 14,
  },
  stage: { height: 118, justifyContent: 'center', overflow: 'hidden' },
  centerLine: {
    position: 'absolute', left: '50%', top: 10, bottom: 10, width: 0,
    borderLeftWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(27,27,31,0.18)',
  },
  rig: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', width: '62%' },
  phone: {
    width: 38, height: 64, borderRadius: 9, backgroundColor: INK, padding: 4, alignItems: 'center',
  },
  phoneScreen: { flex: 1, alignSelf: 'stretch', borderRadius: 5, backgroundColor: '#7FB6FF' },
  phoneNotch: { position: 'absolute', top: 6, width: 10, height: 3, borderRadius: 2, backgroundColor: INK },
  rope: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#B98A5A', alignItems: 'center', marginHorizontal: -2 },
  flag: { position: 'absolute', top: -2, width: 3, height: 26, backgroundColor: INK, borderRadius: 2 },
  flagCloth: { position: 'absolute', left: 3, top: 0, width: 16, height: 11, backgroundColor: HIGHLIGHT, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  cat: {
    width: CAT, height: CAT * 0.78, borderRadius: 16, backgroundColor: HIGHLIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  ear: {
    position: 'absolute', top: -8, left: 8, width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 12,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: HIGHLIGHT,
  },
  earR: { left: undefined, right: 8 },
  eyes: { flexDirection: 'row', gap: 8 },
  eye: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  pupil: { width: 7, height: 7, borderRadius: 4, backgroundColor: INK },
  name: { color: INK, fontFamily: fonts.bold, fontWeight: '800', fontSize: 26, textAlign: 'center', marginTop: 6 },
  sub: { color: INK_DIM, fontSize: 14, textAlign: 'center', marginTop: 4 },
  stones: { flexDirection: 'row', gap: 5, marginTop: 18 },
  stone: {
    flex: 1, aspectRatio: 1, maxHeight: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(27,27,31,0.06)',
  },
  stonePast: { backgroundColor: palette.accentSoft },
  stoneOn: { backgroundColor: INK, transform: [{ scale: 1.15 }] },
  stoneText: { color: 'rgba(27,27,31,0.55)', fontFamily: fonts.bold, fontWeight: '700', fontSize: 13 },
  stoneTextOn: { color: '#FFFFFF' },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  endText: { color: 'rgba(27,27,31,0.45)', fontSize: 12, fontWeight: '600' },
});
