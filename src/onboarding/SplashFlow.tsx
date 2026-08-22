import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import OpalOrb from '../components/OpalOrb';
import { colors } from '../theme';

const { height } = Dimensions.get('window');

const SLIDES = [
  {
    text: 'An Opal only reveals its fire\nto those who slow down\nenough to look.',
    awake: false,
  },
  {
    text: 'Dimmed by noise, apps, and\neverything else pulling at\nyou.',
    awake: true,
  },
];

function TapHint() {
  const opacity = useSharedValue(0.4);
  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.Text style={[styles.tapHint, style]}>TAP TO CONTINUE</Animated.Text>;
}

export default function SplashFlow({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);

  const advance = () => {
    if (index < SLIDES.length - 1) {
      setIndex(index + 1);
    } else {
      onDone();
    }
  };

  const slide = SLIDES[index];

  return (
    <Pressable style={styles.container} onPress={advance}>
      <Animated.View key={index} entering={FadeIn.duration(500)} style={styles.slideBody}>
        <Text style={styles.heading}>{slide.text}</Text>
        <View style={styles.orbWrap}>
          <OpalOrb size={160} awake={slide.awake} />
        </View>
      </Animated.View>
      <TapHint />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  slideBody: {
    flex: 1,
    alignItems: 'center',
    paddingTop: height * 0.12,
    paddingHorizontal: 36,
  },
  heading: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 70,
  },
  orbWrap: {
    marginTop: 20,
  },
  tapHint: {
    position: 'absolute',
    bottom: 46,
    color: colors.textDim,
    fontSize: 12,
    letterSpacing: 2,
  },
});
