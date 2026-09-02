import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { palette } from '../design/tokens';
import { OnboardingMarkSlot } from './OnboardingMark';

interface Slide {
  key: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    key: 'willpower',
    title: 'You’ve probably\ntried a blocker before.',
    subtitle: 'Most of them let you out the moment you push. One tap, a short delay, a password you set and remember.\n\nA block is only ever as strong as the moment you are weakest.',
  },
  {
    key: 'stoppingPoint',
    title: 'This one\ndoesn’t let you out.',
    subtitle: 'Start a session and it cannot be paused, cancelled, or waited out — not by force-quitting, not by deleting the app.\n\n**The way back in is earned**: a real challenge, or one of your Bailouts.',
  },
  {
    key: 'setupIntro',
    title: 'Let’s set\nyours up.',
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <OnboardingMarkSlot />
      <View style={styles.body}>
        <Animated.Text key={`title-${slideIndex}`} entering={FadeInDown.delay(120).duration(400)} style={styles.title}>
          {currentSlide.title}
        </Animated.Text>

        <Animated.Text key={`desc-${slideIndex}`} entering={FadeInDown.delay(220).duration(400)} style={styles.subtitle}>
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
        <GradientButton variant="ghost" label="NEXT" onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 28, gap: 16 },
  title: {
    color: palette.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 35,
    marginTop: 8,
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  boldText: {
    fontWeight: '700',
    color: palette.text,
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
