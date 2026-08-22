import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import OpalOrb from '../components/OpalOrb';
import { colors } from '../theme';

type SlideKey = 'designed' | 'noIcons' | 'escapeFeeds' | 'willpower' | 'spiral' | 'stoppingPoint' | 'setupIntro';
type ArtKind = 'waves' | 'noIcons' | 'escapeFeeds' | 'tangle' | 'spiral' | 'stoppingPoint' | 'setupIntro';

interface Slide {
  key: SlideKey;
  art: ArtKind;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    key: 'designed',
    art: 'waves',
    title: 'We live in a world\ndesigned to distract you.',
    subtitle: 'Constant pings, endless scrolling, too many tabs. It’s easy to feel scattered and drained.',
  },
  {
    key: 'noIcons',
    art: 'noIcons',
    title: 'No icons, no cravings',
    subtitle: 'No distracting icons, just app names as text. This small change stops mindless use. Stay focused, present, and **use your phone intentionally**.',
  },
  {
    key: 'escapeFeeds',
    art: 'escapeFeeds',
    title: 'Escape endless scroll feeds',
    subtitle: 'Social media curate content based on your interests to keep you in an anxious loop. **We tackled the root cause** and went beyond removing icons.',
  },
  {
    key: 'willpower',
    art: 'tangle',
    title: 'It’s not your\nlack of willpower.',
    subtitle: 'These products are built by thousands of people whose whole job is holding your attention.\n\nYou are not losing to yourself. You are losing to a machine that never sleeps.',
  },
  {
    key: 'spiral',
    art: 'spiral',
    title: 'Hours add up.\nYou already know that.',
    subtitle: 'That’s exactly how the internet is designed — there is no natural stopping point.',
  },
  {
    key: 'stoppingPoint',
    art: 'stoppingPoint',
    title: 'We add the\nstopping point back.',
    subtitle: 'A gentle pause when you open a distracting app, giving you **a moment to make an intentional choice**.',
  },
  {
    key: 'setupIntro',
    art: 'setupIntro',
    title: 'Let’s build\nyour custom setup.',
    subtitle: 'We’ll ask a few questions to customize your focus theme, rules, and boundaries to **reclaim your time**.',
  },
];

// 1. Waves Artwork
function WavesArtwork() {
  return (
    <Svg width={280} height={190} viewBox="0 0 280 190">
      <Defs>
        <SvgGradient id="edu" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#d9f77e" />
          <Stop offset="1" stopColor="#7dd8ff" />
        </SvgGradient>
      </Defs>
      <Path d="M20 60 h90" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeLinecap="round" />
      <Path d="M20 80 h90" stroke="rgba(255,255,255,0.14)" strokeWidth="3" strokeLinecap="round" />
      <Path d="M20 100 h90" stroke="rgba(255,255,255,0.1)" strokeWidth="3" strokeLinecap="round" />
      <Path d="M130 40 q14 -14 28 0 t28 0 t28 0 t28 0" stroke="url(#edu)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <Path d="M130 72 q14 -16 28 0 t28 0 t28 0 t28 0" stroke="url(#edu)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <Path d="M130 104 q14 -16 28 0 t28 0 t28 0 t28 0" stroke="url(#edu)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <Path d="M130 136 q14 -16 28 0 t28 0 t28 0 t28 0" stroke="url(#edu)" strokeWidth="5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// 2. Tangle Artwork
function TangleArtwork() {
  return (
    <Svg width={280} height={190} viewBox="0 0 280 190">
      <Defs>
        <SvgGradient id="edu" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#d9f77e" />
          <Stop offset="1" stopColor="#7dd8ff" />
        </SvgGradient>
      </Defs>
      <Circle cx="105" cy="80" r="52" stroke="url(#edu)" strokeWidth="4" fill="none" strokeDasharray="9 7" />
      <Circle cx="172" cy="112" r="38" stroke="url(#edu)" strokeWidth="4" fill="none" strokeDasharray="9 7" />
      <Circle cx="140" cy="96" r="16" stroke="rgba(255,255,255,0.35)" strokeWidth="3" fill="none" />
    </Svg>
  );
}

// 3. Spiral Artwork
function SpiralArtwork() {
  return (
    <Svg width={280} height={190} viewBox="0 0 280 190">
      <Defs>
        <SvgGradient id="edu" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#d9f77e" />
          <Stop offset="1" stopColor="#7dd8ff" />
        </SvgGradient>
      </Defs>
      <Path
        d="M140 96 m0 -8 a8 8 0 1 1 -8 8 a16 16 0 1 1 16 16 a26 26 0 1 1 -26 -26 a38 38 0 1 1 38 38 a52 52 0 1 1 -52 -52"
        stroke="url(#edu)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="140" cy="88" r="5" fill="#d9f77e" />
    </Svg>
  );
}

// 4. No Icons, No Cravings Phone Artwork
const MOCK_APPS: { name: string; colors: [string, string] }[] = [
  { name: 'Endless feed', colors: ['#ffd1b3', '#ff9980'] },
  { name: 'Rabbit hole', colors: ['#4f46e5', '#312e81'] },
  { name: 'Time thief', colors: ['#be184a', '#881319'] },
  { name: 'Late show off', colors: ['#d9f77e', '#7dd8ff'] },
  { name: 'Buy everything', colors: ['#14b8a6', '#0d9488'] },
  { name: 'Scroll-mania', colors: ['#64748b', '#475569'] },
  { name: 'Exploding triangles', colors: ['#8b5cf6', '#6d28d9'] },
  { name: 'Match nobody', colors: ['#ef4444', '#b91c1c'] },
];

function NoIconsArtwork() {
  return (
    <View style={styles.artworkContainer}>
      <View style={styles.phoneFrame}>
        <View style={styles.cameraIsland} />
        <View style={styles.appGrid}>
          {MOCK_APPS.map((app, idx) => (
            <View key={idx} style={styles.gridAppSquareWrapper}>
              <LinearGradient
                colors={app.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gridAppSquareBlurred}
              />
              <Text style={styles.gridAppName} numberOfLines={2}>
                {app.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// 5. Escape Endless Scroll Feeds Artwork
function EscapeFeedsArtwork() {
  return (
    <View style={styles.artworkContainer}>
      <View style={styles.phoneFrame}>
        <View style={styles.cameraIsland} />
        <View style={styles.feedHeader} />
        <View style={styles.feedLayout}>
          <View style={styles.feedRow}>
            <View style={styles.feedCardLarge}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.01)']}
                style={StyleSheet.absoluteFill}
              />
            </View>
            <View style={styles.feedCardSmall}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.01)']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
          <View style={styles.feedTextBarLong} />
          <View style={styles.feedTextBarShort} />
        </View>
      </View>
    </View>
  );
}

// 6. Stopping Point Phone Artwork
function StoppingPointArtwork() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.22, { duration: 1100 }),
        withTiming(1.0, { duration: 1100 }),
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 1.55 - scale.value,
  }));

  return (
    <View style={styles.artworkContainer}>
      <View style={styles.phoneFrame}>
        <View style={styles.cameraIsland} />
        <View style={styles.stoppingPointCenter}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <View style={styles.pauseCircle}>
            <Text style={styles.pauseText}>||</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// 7. Setup Intro Artwork
function SetupIntroArtwork({ lifting }: { lifting: boolean }) {
  const lift = useSharedValue(0);
  useEffect(() => {
    if (lifting) {
      lift.value = withTiming(-140, { duration: 380 });
    }
  }, [lifting]);
  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
  }));
  return (
    <View style={styles.artworkContainer}>
      <Animated.View style={[styles.setupIntroWrap, liftStyle]}>
        <OpalOrb size={100} awake />
        <View style={styles.pedestal} />
      </Animated.View>
    </View>
  );
}

function Artwork({ kind, lifting }: { kind: ArtKind; lifting: boolean }) {
  switch (kind) {
    case 'waves':
      return <WavesArtwork />;
    case 'noIcons':
      return <NoIconsArtwork />;
    case 'escapeFeeds':
      return <EscapeFeedsArtwork />;
    case 'tangle':
      return <TangleArtwork />;
    case 'spiral':
      return <SpiralArtwork />;
    case 'stoppingPoint':
      return <StoppingPointArtwork />;
    case 'setupIntro':
      return <SetupIntroArtwork lifting={lifting} />;
    default:
      return null;
  }
}

function renderTextWithBold(text: string) {
  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <Text key={index} style={styles.boldText}>
          {part}
        </Text>
      );
    }
    return part;
  });
}

export default function EducationScreen({
  onContinue,
}: {
  onContinue: () => void;
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [lifting, setLifting] = useState(false);
  const scale = useSharedValue(1);

  const currentSlide = SLIDES[slideIndex];
  const isLastSlide = slideIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (!isLastSlide) {
      setSlideIndex(slideIndex + 1);
      return;
    }
    // Last slide's orb lifts off the pedestal before handing off to
    // OnboardingFlow, whose own mascot slides up into view on mount — the
    // two together read as one continuous motion across the screen change.
    setLifting(true);
    setTimeout(onContinue, 380);
  };

  const btnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        {/* We key by slideIndex to trigger animations on slide change */}
        <Animated.View key={`art-${slideIndex}`} entering={FadeIn.duration(500)}>
          <Artwork kind={currentSlide.art} lifting={lifting} />
        </Animated.View>

        <Animated.Text key={`title-${slideIndex}`} entering={FadeInDown.delay(120).duration(400)} style={styles.title}>
          {currentSlide.title}
        </Animated.Text>

        <Animated.Text key={`desc-${slideIndex}`} entering={FadeInDown.delay(220).duration(400)} style={styles.subtitle}>
          {renderTextWithBold(currentSlide.subtitle)}
        </Animated.Text>
      </View>

      {/* Progress Dots / Segment Indicator */}
      <View style={styles.indicatorContainer}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicatorDot,
              {
                backgroundColor: index === slideIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.24)',
              },
            ]}
          />
        ))}
      </View>

      {/* Outlined Next Button */}
      <View style={styles.ctaWrap}>
        <Animated.View style={[btnAnimatedStyle, { width: '100%', alignItems: 'center' }]}>
          <Pressable
            onPressIn={() => (scale.value = withTiming(0.97, { duration: 90 }))}
            onPressOut={() => (scale.value = withSpring(1, { damping: 13, stiffness: 220 }))}
            onPress={handleNext}
            style={styles.nextBtn}
          >
            <Text style={styles.nextBtnText}>NEXT</Text>
          </Pressable>
        </Animated.View>
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
  subtitle: {
    color: colors.textDim,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text,
  },
  
  // Custom Progress indicator
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  indicatorDot: {
    width: 28,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 3.5,
  },

  // Outlined NEXT button
  ctaWrap: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  nextBtn: {
    width: '100%',
    maxWidth: 340,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Mockup elements
  artworkContainer: {
    width: 280,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneFrame: {
    width: 136,
    height: 176,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: '#0a0a0c',
    paddingHorizontal: 10,
    paddingTop: 12,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cameraIsland: {
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    position: 'absolute',
    top: 3,
    alignSelf: 'center',
  },

  // App grid for noIcons
  appGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
    gap: 4,
  },
  gridAppSquareWrapper: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridAppSquareBlurred: {
    width: 22,
    height: 22,
    borderRadius: 6,
    opacity: 0.26,
  },
  gridAppName: {
    color: 'rgba(255, 255, 255, 0.28)',
    fontSize: 5.5,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 7,
  },

  // Feed layout for escapeFeeds
  feedHeader: {
    width: '90%',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 4,
  },
  feedLayout: {
    width: '100%',
    marginTop: 6,
  },
  feedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
    alignSelf: 'center',
    gap: 4,
  },
  feedCardLarge: {
    width: '68%',
    height: 64,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  feedCardSmall: {
    width: '28%',
    height: 64,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  feedTextBarLong: {
    width: '55%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginTop: 8,
    marginLeft: 4,
  },
  feedTextBarShort: {
    width: '32%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginTop: 4,
    marginLeft: 4,
  },

  // Stopping point animation elements
  stoppingPointCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: colors.accent,
    position: 'absolute',
  },
  pauseCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.8,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 245, 176, 0.04)',
  },
  pauseText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },

  // Setup intro elements
  setupIntroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedestal: {
    width: 54,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111113',
    marginTop: -4,
  },
});
