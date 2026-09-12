import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { fonts, palette } from '../design/tokens';
import { OnboardingMarkSlot } from './OnboardingMark';

interface Slide {
  key: string;
  /** One entry per rendered line. Line breaks are a typographic decision on
   *  this screen — the headline is set as a stack of short lines on tight
   *  leading — so they are authored rather than left to word-wrap. */
  lines: string[];
  /** Index of the line that carries the accent colour. The reference sets one
   *  line of each headline in colour so the stack reads as one object with a
   *  stressed syllable, rather than three flat lines. */
  accentLine: number;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    key: 'willpower',
    lines: ['you’ve probably', 'tried a blocker', 'before.'],
    accentLine: 1,
    subtitle: 'Most of them let you out the moment you push. One tap, a short delay, a password you set and remember.\n\nA block is only ever as strong as the moment you are weakest.',
  },
  {
    key: 'stoppingPoint',
    lines: ['this one', 'doesn’t let', 'you out.'],
    accentLine: 1,
    subtitle: 'Start a session and it cannot be paused, cancelled, or waited out — not by force-quitting, not by deleting the app.\n\n**The way back in is earned**: a real challenge, or one of your Bailouts.',
  },
  {
    key: 'setupIntro',
    lines: ['let’s set', 'yours up.'],
    accentLine: 0,
    subtitle: 'A few questions, then you choose what to block and **how hard it should be** to get back in.',
  },
];

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

  const currentSlide = SLIDES[slideIndex];
  const isLastSlide = slideIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (!isLastSlide) {
      setSlideIndex(slideIndex + 1);
      return;
    }
    onContinue();
  };

  return (
    // The whole screen advances, so the carousel is driven by tapping
    // anywhere rather than by hunting for a button. `Pressable` wraps the
    // SafeAreaView rather than sitting inside it so the tap target genuinely
    // covers the full screen, insets included.
    <Pressable style={styles.container} onPress={handleNext} accessibilityRole="button"
      accessibilityLabel={isLastSlide ? 'Continue' : 'Next'}
      accessibilityHint="Advances to the next slide"
    >
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <OnboardingMarkSlot large />
      {/* Content is bottom-anchored and left-aligned rather than centred in
          the middle of the screen: the headline sits in the lower third where
          the ground has saturated, which is what gives the reference layout
          its weight. `flex-end` does the anchoring so the stack still moves
          with the mark above it on shorter devices. */}
      <View style={styles.body}>
        <View>
          {currentSlide.lines.map((line, i) => (
            <Animated.Text
              key={`${currentSlide.key}-${i}`}
              entering={FadeInDown.delay(120 + i * 70).duration(420)}
              style={[styles.title, i === currentSlide.accentLine && styles.titleAccent]}
            >
              {line}
            </Animated.Text>
          ))}
        </View>

        <Animated.Text
          key={`desc-${slideIndex}`}
          entering={FadeInDown.delay(120 + currentSlide.lines.length * 70).duration(420)}
          style={styles.subtitle}
        >
          {renderTextWithBold(currentSlide.subtitle)}
        </Animated.Text>
      </View>

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

      <View style={styles.ctaWrap}>
        <TapHint last={isLastSlide} />
      </View>
    </SafeAreaView>
    </Pressable>
  );
}

/**
 * The button was the only thing on the slide that could be pressed, which is
 * the opposite of the instruction — the whole screen advances. This states
 * that instead, and breathes so it reads as an invitation rather than a
 * disabled label.
 */
function TapHint({ last }: { last: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse]);

  const style = useAnimatedStyle(() => ({ opacity: 0.5 + pulse.value * 0.42 }));

  return (
    <Animated.Text style={[styles.tapHint, style]}>
      {last ? 'Tap to begin' : 'Tap to continue'}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  tapHint: {
    color: palette.textTertiary,
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.6,
    textAlign: 'center',
    fontFamily: fonts.medium,
  },
  body: {
    flex: 1,
    alignItems: 'flex-start',
    // Sits high, directly under the mark, rather than being pushed to the
    // bottom edge. The headline is the first thing read after the logo, so
    // it belongs in the eye's path down from it — and at this size it needs
    // the room above the fold rather than competing with the tap hint.
    justifyContent: 'flex-start',
    paddingHorizontal: 28,
    paddingTop: 8,
    gap: 18,
  },
  title: {
    color: palette.text,
    fontFamily: fonts.extrabold,
    fontSize: 44,
    fontWeight: '800',
    textAlign: 'left',
    // Leading below the font size. The headline is a stack of short lines and
    // only reads as a single block when they nearly touch — the default ~1.3
    // ratio used elsewhere breaks it into separate sentences.
    lineHeight: 46,
    letterSpacing: -1.6,
    // Authored sentence-case in the data stays readable; the all-lowercase
    // setting is presentation, and reverting it is one line.
    textTransform: 'lowercase',
  },
  titleAccent: { color: palette.accent },
  subtitle: {
    color: palette.textTertiary,
    fontFamily: fonts.regular,
    // Deliberately small and dim against a 34pt headline. The reference sets
    // its body copy at roughly a third the headline size — the contrast is
    // what makes the headline read as the subject and the copy as a footnote.
    fontSize: 15.5,
    textAlign: 'left',
    lineHeight: 23,
    maxWidth: 330,
  },
  boldText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: palette.textSecondary,
  },
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
  ctaWrap: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    width: '100%',
  },
});
