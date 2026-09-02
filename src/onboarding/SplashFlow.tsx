import React, { useEffect } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

/** The splash's own palette — deliberately deeper than the app's ground so the
 *  bloom has somewhere to come up from. */
const NEAR_BLACK = '#050807';
const EMERALD = '#06261D';
const MINT = '#6DE8B0';

/** Beats, in ms. The whole thing is under two and a half seconds. */
const BLOOM_IN = { at: 500, dur: 700 };
const LOGO_IN = { at: 1200, dur: 600 };
const HOLD_UNTIL = 2200;

/**
 * Brand splash.
 *
 * Replaces the two tap-through slides: dark, then light, then the mark — it
 * plays itself and hands over, so launching costs no taps. Tapping anywhere
 * skips straight to the end for anyone who has seen it before.
 */
export default function SplashFlow({ onDone }: { onDone: () => void }) {
  const bloom = useSharedValue(0);
  const logo = useSharedValue(0);
  const done = useSharedValue(0);

  useEffect(() => {
    bloom.value = withDelay(
      BLOOM_IN.at,
      withTiming(1, { duration: BLOOM_IN.dur, easing: Easing.out(Easing.cubic) }),
    );
    logo.value = withDelay(
      LOGO_IN.at,
      withTiming(1, { duration: LOGO_IN.dur, easing: Easing.out(Easing.cubic) }),
    );
    // The settle beat is the wait itself — nothing animates, the mark just sits.
    done.value = withDelay(
      HOLD_UNTIL,
      withTiming(1, { duration: 1 }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
  }, [bloom, logo, done, onDone]);

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: bloom.value * 0.55,
    transform: [{ scale: 0.8 + bloom.value * 0.2 }],
  }));

  // Scales *down* into place rather than up — it reads as settling rather than
  // popping, which is the difference between calm and cheerful.
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [{ scale: 1.06 - logo.value * 0.06 }],
  }));

  return (
    <Pressable style={styles.root} onPress={onDone} accessibilityLabel="Skip">
      <LinearGradient
        colors={[EMERALD, NEAR_BLACK, NEAR_BLACK]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Soft mint light coming up from behind the centre. Three stacked
          circles at low opacity read as a blur without a blur filter, which
          react-native-svg cannot do cheaply on Android. */}
      <Animated.View style={[styles.bloomWrap, bloomStyle]} pointerEvents="none">
        <View style={[styles.bloom, { width: width * 1.5, height: width * 1.5, opacity: 0.1 }]} />
        <View style={[styles.bloom, { width: width * 1.0, height: width * 1.0, opacity: 0.14 }]} />
        <View style={[styles.bloom, { width: width * 0.62, height: width * 0.62, opacity: 0.18 }]} />
      </Animated.View>

      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <Image
            source={require('../../assets/byre-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Byre"
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const LOGO = 104;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NEAR_BLACK, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  bloomWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  bloom: { position: 'absolute', borderRadius: 999, backgroundColor: MINT },
  logo: { width: LOGO, height: LOGO },
});
