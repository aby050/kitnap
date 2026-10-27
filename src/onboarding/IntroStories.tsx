import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Asset } from 'expo-asset';
import { getVideoLayer } from '../components/videoLayer';
import { fonts, palette } from '../design/tokens';

type Slide = {
  video: number;
  eyebrow: string;
  title: string;
  body: string;
  /** The first slide carries the brand name as its headline. */
  brand?: boolean;
  tint: string;
};

const SLIDES: Slide[] = [
  {
    video: require('../../assets/intro/meadow.mp4'),
    eyebrow: 'LIVE BEYOND\nTHE SCREEN',
    title: 'Phonewise',
    brand: true,
    body: 'You get one life, and it is happening right now, out past the glass.',
    tint: 'rgba(40,90,20,0.22)',
  },
  {
    video: require('../../assets/intro/canopy.mp4'),
    eyebrow: '',
    title: 'THE WORLD IS\nBEAUTIFUL',
    body: 'Rivers, forests, faces, sunsets. None of it is on your feed. Go and see it.',
    tint: 'rgba(20,90,80,0.18)',
  },
  {
    video: require('../../assets/intro/slide3.mp4'),
    eyebrow: '',
    title: 'YOU GET THIS\nLIFE ONCE',
    body: 'Every hour you take back is an hour for the people and places that matter.',
    tint: 'rgba(30,60,60,0.18)',
  },
  {
    video: require('../../assets/intro/dusk.mp4'),
    eyebrow: '',
    title: 'PUT THE PHONE\nDOWN. GO LIVE.',
    body: 'Phonewise locks the apps that pull you in, with no way around it, so you can walk out into the rest of your life.',
    tint: 'rgba(50,40,20,0.15)',
  },
];

const SLIDE_MS = 5200;

/**
 * First-run story: one full-bleed clip per beat, segmented progress along the
 * top, a headline and a single call to action. Tap the right side to go on,
 * the left to go back; it also advances on its own.
 */
export default function IntroStories({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const fill = useSharedValue(0);
  const Video = getVideoLayer();
  const slide = SLIDES[index];

  const next = () => setIndex((i) => (i < SLIDES.length - 1 ? i + 1 : i));
  const prev = () => setIndex((i) => Math.max(0, i - 1));

  useEffect(() => {
    fill.value = 0;
    fill.value = withTiming(1, { duration: SLIDE_MS, easing: Easing.linear }, (done) => {
      if (done) runOnJS(next)();
    });
  }, [index]);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.value }] }));

  return (
    <View style={styles.root}>
      {/* Keyed on the slide so each clip starts from its first frame. */}
      <Animated.View key={index} entering={FadeIn.duration(450)} style={StyleSheet.absoluteFill}>
        {Video ? <Video source={{ uri: Asset.fromModule(slide.video).uri }} contentFit="fill" /> : <View style={styles.fallback} />}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: slide.tint }]} />
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.62)']}
          locations={[0, 0.22, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Tap zones, under the controls. */}
      <View style={styles.zones} pointerEvents="box-none">
        <Pressable style={styles.zoneLeft} onPress={prev} accessibilityLabel="Previous" />
        <Pressable style={styles.zoneRight} onPress={next} accessibilityLabel="Next" />
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.bars} pointerEvents="none">
          {SLIDES.map((_, i) => (
            <View key={i} style={styles.track}>
              {i === index ? (
                <Animated.View style={[styles.barFill, fillStyle]} />
              ) : (
                <View style={[styles.barFill, { transform: [{ scaleX: i < index ? 1 : 0 }] }]} />
              )}
            </View>
          ))}
        </View>

        {slide.brand ? (
          <Animated.Text key={`e${index}`} entering={FadeIn.duration(500)} style={styles.eyebrow}>
            {slide.eyebrow}
          </Animated.Text>
        ) : (
          <Animated.Text key={`l${index}`} entering={FadeIn.duration(500)} style={styles.smallLogo}>
            Phonewise
          </Animated.Text>
        )}

        <View style={styles.spacer} pointerEvents="none" />

        <Animated.View key={`t${index}`} entering={FadeInDown.duration(520)} pointerEvents="none">
          {slide.brand ? (
            <Text style={styles.brand} numberOfLines={1} adjustsFontSizeToFit>
              {slide.title}
            </Text>
          ) : (
            <Text style={styles.title}>{slide.title}</Text>
          )}
          <Text style={slide.brand ? styles.body : styles.bodyDim}>{slide.body}</Text>
        </Animated.View>

        <Pressable style={styles.cta} onPress={onDone} accessibilityLabel="Get started">
          <Text style={styles.ctaText}>Get Started</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A1712' },
  fallback: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#12301F' },
  zones: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  zoneLeft: { flex: 1 },
  zoneRight: { flex: 2 },
  safe: { flex: 1, paddingHorizontal: 20 },
  bars: { flexDirection: 'row', gap: 6, marginTop: 6 },
  track: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  barFill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', transformOrigin: 'left' },
  eyebrow: {
    marginTop: 22,
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.2,
    lineHeight: 16,
  },
  spacer: { flex: 1 },
  smallLogo: {
    marginTop: 18,
    color: '#fff',
    fontFamily: 'KaushanScript_400Regular',
    fontSize: 28,
    lineHeight: 36,
    transform: [{ rotate: '-4deg' }],
    alignSelf: 'flex-start',
  },
  brand: {
    color: '#fff',
    fontFamily: 'KaushanScript_400Regular',
    fontSize: 64,
    lineHeight: 80,
    textAlign: 'center',
    transform: [{ rotate: '-6deg' }],
    marginBottom: 34,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 14,
  },
  title: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  body: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 26,
  },
  bodyDim: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 26,
  },
  cta: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  ctaText: { color: '#0E2A1C', fontFamily: fonts.semibold, fontSize: 15 },
});
