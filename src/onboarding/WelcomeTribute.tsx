import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { fonts } from '../design/tokens';
import { HIGHLIGHT, INK, INK_DIM, InkButton, PAPER } from './PastelCard';

/** The cat Kitnap is named for. */
export const CAT_NAME = 'Biscuit';

/**
 * The welcome: the mascot, the name, and the story of why the app exists.
 * Shown once after the first-launch splash, and again from Settings → Why Kitnap.
 */
export default function WelcomeTribute({ onContinue, cta = "Let's begin" }: { onContinue: () => void; cta?: string }) {
  const pop = useSharedValue(0);
  const nap = useSharedValue(0);
  useEffect(() => {
    pop.value = withSpring(1, { damping: 9, stiffness: 120 });
    // A slow, sleepy sway, like a cat settling in for a nap.
    nap.value = withDelay(
      900,
      withRepeat(withSequence(withTiming(1, { duration: 1800 }), withTiming(0, { duration: 1800 })), -1),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const logoStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.6 + pop.value * 0.4 }, { translateY: nap.value * -4 }, { rotate: `${(nap.value - 0.5) * 2}deg` }],
  }));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <KitnapLogo width={230} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(350).duration(500)} style={styles.name}>
          kitnap
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(500).duration(500)} style={styles.tag}>
          Less scrolling. <Text style={{ color: HIGHLIGHT }}>More living.</Text>
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.card}>
          <Text style={styles.over}>IN LOVING MEMORY OF {CAT_NAME.toUpperCase()}</Text>
          <Text style={styles.body}>
            {CAT_NAME} never once asked for a screen. He asked for a warm spot in the sun, a slow stretch, a long nap
            and someone to sit with him.
          </Text>
          <Text style={styles.body}>
            Too many evenings, I was looking at my phone instead of at him. I don't get those evenings back.
          </Text>
          <Text style={styles.body}>
            Kitnap is made in his memory, to help you{' '}
            <Text style={styles.em}>rest your eyes, quiet your mind and sleep a little better</Text>, and to look up
            for the ones who are right beside you, while they are still there.
          </Text>
          <View style={styles.sigRow}>
            <Text style={styles.paw}>🐾</Text>
            <Text style={styles.sig}>Take a nap from your phone. {CAT_NAME} would approve.</Text>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInDown.delay(1200).duration(500)} style={styles.cta}>
        <InkButton label={cta} onPress={onContinue} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAPER },
  scroll: { paddingHorizontal: 22, paddingTop: 36, paddingBottom: 24, alignItems: 'stretch' },
  logoWrap: { alignItems: 'center' },
  name: { color: INK, fontFamily: fonts.extrabold, fontSize: 46, letterSpacing: -1, textAlign: 'center', marginTop: 8 },
  tag: { color: INK_DIM, fontFamily: fonts.regular, fontSize: 15, textAlign: 'center', marginTop: 2 },
  card: {
    marginTop: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: INK,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 10,
  },
  over: { color: HIGHLIGHT, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.4 },
  body: { color: INK, fontFamily: fonts.regular, fontSize: 15.5, lineHeight: 23 },
  em: { color: HIGHLIGHT, fontFamily: fonts.semibold },
  sigRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  paw: { fontSize: 16 },
  sig: { flex: 1, color: INK_DIM, fontFamily: fonts.medium, fontSize: 14, fontStyle: 'italic' },
  cta: { paddingHorizontal: 22, paddingBottom: 14, paddingTop: 6, backgroundColor: PAPER },
});

/** The Kitnap mascot as vector shapes, so it sits cleanly on any background. */
export function KitnapLogo({ width }: { width: number }) {
  return (
    <Svg width={width} height={(width * 680) / 1290} viewBox="180 150 1290 680">
      <Path d="M762 280 Q762 163 879 163 L1335 163 Q1452 163 1452 280 L1452 755 Q1452 815 1392 815 L250 815 Q188 815 188 750 Q188 685 250 685 L745 685 Q762 685 762 668 Z" fill="#FF6512" />
      <Path d="M188 760 Q200 780 250 780 L1330 780 Q1440 780 1452 690 L1452 755 Q1452 815 1392 815 L250 815 Q192 815 188 760Z" fill="#F04E12" opacity={0.8} />
      <Circle cx={949} cy={438} r={105} fill="#FFFFFF" />
      <Circle cx={1273} cy={438} r={105} fill="#FFFFFF" />
      <Circle cx={947} cy={440} r={46} fill="#0B0B0B" />
      <Circle cx={1275} cy={440} r={46} fill="#0B0B0B" />
      <Circle cx={928} cy={422} r={10} fill="#FFFFFF" />
      <Circle cx={1256} cy={422} r={10} fill="#FFFFFF" />
    </Svg>
  );
}
