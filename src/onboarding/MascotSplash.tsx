import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { fonts } from '../design/tokens';

const ORANGE = '#FF7322';
const PAPER = '#F1EFEB';
const INK = '#2E3136';
const TAIL = 124;

/**
 * The launch intro: the orange mascot pops up, stretches its tail out, blinks
 * and glances aside, then the wordmark and line fade in. About 2.4 seconds,
 * then `onDone` hands over to whatever comes next.
 */
export default function MascotSplash({ onDone }: { onDone: () => void }) {
  const pop = useSharedValue(0);
  const tail = useSharedValue(0);
  const blink = useSharedValue(1);
  const look = useSharedValue(0);
  const word = useSharedValue(0);
  const tag = useSharedValue(0);

  useEffect(() => {
    pop.value = withSpring(1, { damping: 9, stiffness: 160 });
    tail.value = withDelay(550, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    blink.value = withDelay(
      1200,
      withRepeat(withSequence(withTiming(0.1, { duration: 90 }), withTiming(1, { duration: 110 }), withTiming(1, { duration: 1400 })), -1),
    );
    look.value = withDelay(
      1000,
      withRepeat(withSequence(withTiming(-5, { duration: 260 }), withTiming(-5, { duration: 600 }), withTiming(0, { duration: 260 }), withTiming(0, { duration: 900 })), -1),
    );
    word.value = withDelay(1200, withTiming(1, { duration: 450 }));
    tag.value = withDelay(1500, withTiming(1, { duration: 450 }));
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - pop.value) * 40 }, { scale: pop.value }],
  }));
  const tailStyle = useAnimatedStyle(() => ({ width: tail.value * TAIL }));
  const shadowStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: 0.4 + tail.value * 0.6 }] }));
  const eyeStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));
  const pupilStyle = useAnimatedStyle(() => ({ transform: [{ translateX: look.value }] }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.value, transform: [{ translateY: (1 - word.value) * 10 }] }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tag.value, transform: [{ translateY: (1 - tag.value) * 10 }] }));

  return (
    <Animated.View exiting={FadeOut.duration(350)} style={styles.root} pointerEvents="none">
      <View style={styles.stage}>
        <Animated.View style={[styles.shadow, shadowStyle]} />
        <Animated.View style={[styles.tail, tailStyle]} />
        <Animated.View style={[styles.body, bodyStyle]}>
          {[18, 56].map((left) => (
            <Animated.View key={left} style={[styles.eye, { left }, eyeStyle]}>
              <Animated.View style={[styles.pupil, pupilStyle]} />
            </Animated.View>
          ))}
        </Animated.View>
      </View>
      <Animated.Text style={[styles.word, wordStyle]}>phonewise</Animated.Text>
      <Animated.Text style={[styles.tag, tagStyle]}>
        Less scrolling. <Text style={{ color: '#E8821A' }}>More living.</Text>
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  stage: { width: 224, height: 100, marginBottom: 40 },
  body: { position: 'absolute', right: 0, bottom: 0, width: 100, height: 100, borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: ORANGE },
  tail: { position: 'absolute', right: 96, bottom: 0, height: 16, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, backgroundColor: ORANGE },
  shadow: { position: 'absolute', left: 0, right: 0, bottom: -8, height: 5, borderRadius: 3, backgroundColor: '#DAD7D0', transformOrigin: 'right' },
  eye: { position: 'absolute', top: 26, width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFF' },
  pupil: { position: 'absolute', top: 10, left: 9, width: 11, height: 11, borderRadius: 6, backgroundColor: '#111111' },
  word: { color: INK, fontFamily: fonts.bold, fontSize: 32 },
  tag: { color: '#5E636B', fontFamily: fonts.regular, fontSize: 15, marginTop: 6 },
});
