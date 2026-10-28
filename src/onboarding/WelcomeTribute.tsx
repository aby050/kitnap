import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { fonts } from '../design/tokens';
import { HIGHLIGHT, INK, INK_DIM, InkButton, PAPER } from './PastelCard';

/** The cat Kitnap is named for. */
export const CAT_NAME = 'Biscuit';

/**
 * The welcome: the mascot, the name, and the story of why the app exists.
 * Shown once after the first-launch splash, and again from Settings → Why Kitnap.
 */
export default function WelcomeTribute({ onContinue, cta = "Let's begin" }: { onContinue: () => void; cta?: string }) {
  // Three calm beats: the logo and name fade in alone in the middle of the
  // screen; after a moment they glide up and the story fades in slowly;
  // then the button. No bounce anywhere.
  const logoIn = useSharedValue(0);
  const rise = useSharedValue(0);
  const story = useSharedValue(0);
  const button = useSharedValue(0);
  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    logoIn.value = withTiming(1, { duration: 900, easing: ease });
    rise.value = withDelay(2000, withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }));
    story.value = withDelay(2500, withTiming(1, { duration: 1400, easing: ease }));
    button.value = withDelay(4200, withTiming(1, { duration: 700, easing: ease }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const headStyle = useAnimatedStyle(() => ({
    opacity: logoIn.value,
    transform: [{ translateY: (1 - rise.value) * 170 }],
  }));
  const storyStyle = useAnimatedStyle(() => ({ opacity: story.value, transform: [{ translateY: (1 - story.value) * 10 }] }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: button.value }));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={headStyle}>
          <View style={styles.logoWrap}>
            <KitnapLogo width={230} />
          </View>
          <Text style={styles.name}>kitnap</Text>
          <Text style={styles.tag}>
            Less scrolling. <Text style={{ color: HIGHLIGHT }}>More living.</Text>
          </Text>
        </Animated.View>

        <Animated.View style={[styles.card, storyStyle]}>
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

      <Animated.View style={[styles.cta, buttonStyle]} pointerEvents="box-none">
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
