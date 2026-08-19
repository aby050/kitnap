import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

export type EducationKey = 'designed' | 'willpower' | 'spiral';

type Art = 'waves' | 'tangle' | 'spiral';

const SLIDES: Record<EducationKey, { art: Art; title: string; accent: string; body: string[] }> = {
  designed: {
    art: 'waves',
    title: 'We live in a world\ndesigned to distract you.',
    accent: 'designed to distract',
    body: ['Constant pings, endless scrolling, too many tabs. It’s easy to feel scattered and drained.'],
  },
  willpower: {
    art: 'tangle',
    title: 'It’s not your\nlack of willpower.',
    accent: 'lack of willpower',
    body: [
      'These products are built by thousands of people whose whole job is holding your attention.',
      'You are not losing to yourself. You are losing to a machine that never sleeps.',
    ],
  },
  spiral: {
    art: 'spiral',
    title: 'Hours add up.\nYou already know that.',
    accent: 'Hours add up.',
    body: [
      'That’s exactly how the internet is designed — there is no natural stopping point.',
      'We add the stopping point back.',
    ],
  },
};

function Artwork({ kind }: { kind: Art }) {
  return (
    <Svg width={280} height={190} viewBox="0 0 280 190">
      <Defs>
        <SvgGradient id="edu" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#d9f77e" />
          <Stop offset="1" stopColor="#7dd8ff" />
        </SvgGradient>
      </Defs>

      {kind === 'waves' && (
        <>
          <Path d="M20 60 h90" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeLinecap="round" />
          <Path d="M20 80 h90" stroke="rgba(255,255,255,0.14)" strokeWidth="3" strokeLinecap="round" />
          <Path d="M20 100 h90" stroke="rgba(255,255,255,0.1)" strokeWidth="3" strokeLinecap="round" />
          <Path
            d="M130 40 q14 -14 28 0 t28 0 t28 0 t28 0"
            stroke="url(#edu)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M130 72 q14 -16 28 0 t28 0 t28 0 t28 0"
            stroke="url(#edu)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M130 104 q14 -16 28 0 t28 0 t28 0 t28 0"
            stroke="url(#edu)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M130 136 q14 -16 28 0 t28 0 t28 0 t28 0"
            stroke="url(#edu)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      {kind === 'tangle' && (
        <>
          <Circle cx="105" cy="80" r="52" stroke="url(#edu)" strokeWidth="4" fill="none" strokeDasharray="9 7" />
          <Circle cx="172" cy="112" r="38" stroke="url(#edu)" strokeWidth="4" fill="none" strokeDasharray="9 7" />
          <Circle cx="140" cy="96" r="16" stroke="rgba(255,255,255,0.35)" strokeWidth="3" fill="none" />
        </>
      )}

      {kind === 'spiral' && (
        <>
          <Path
            d="M140 96 m0 -8 a8 8 0 1 1 -8 8 a16 16 0 1 1 16 16 a26 26 0 1 1 -26 -26 a38 38 0 1 1 38 38 a52 52 0 1 1 -52 -52"
            stroke="url(#edu)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <Circle cx="140" cy="88" r="5" fill="#d9f77e" />
        </>
      )}
    </Svg>
  );
}

/** Reframe interstitials. The point is to move blame off the user — shame
 *  produces uninstalls, not behaviour change. */
export default function EducationScreen({
  slide,
  onContinue,
}: {
  slide: EducationKey;
  onContinue: () => void;
}) {
  const s = SLIDES[slide];
  const [before, after] = s.title.split(s.accent);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.View entering={FadeIn.duration(600)}>
          <Artwork kind={s.art} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(180).duration(450)} style={styles.title}>
          {before}
          <Text style={styles.titleAccent}>{s.accent}</Text>
          {after}
        </Animated.Text>

        {s.body.map((line, i) => (
          <Animated.Text
            key={line}
            entering={FadeInDown.delay(300 + i * 110).duration(450)}
            style={styles.body_}
          >
            {line}
          </Animated.Text>
        ))}
      </View>

      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 35,
    marginTop: 14,
  },
  titleAccent: { color: colors.accent },
  body_: { color: colors.textDim, fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 320 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
