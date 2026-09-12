import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Rendered once at the app root and never unmounted while onboarding runs,
 * so every step (splash, questions, permissions, stats, paywall) sits on
 * the exact same environment instead of each screen re-painting its own bg.
 *
 * Two independent drifts at different speeds give the background a subtle
 * parallax feel — the primary bloom breathes slowly, a secondary side-glow
 * wanders on a longer cycle so the two never sync up and the bg never looks
 * like it's looping.
 */
export default function PersistentBackground() {
  const drift = useSharedValue(0);
  const drift2 = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // Offset start so the two glows are never in phase.
    drift2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 17000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 17000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + drift.value * 0.2,
    transform: [
      { translateY: -20 + drift.value * 28 },
      { translateX: -10 + drift.value * 10 },
      { scale: 1 + drift.value * 0.08 },
    ],
  }));

  const glow2Style = useAnimatedStyle(() => ({
    opacity: 0.12 + drift2.value * 0.14,
    transform: [
      { translateX: -60 + drift2.value * 120 },
      { translateY: 40 + drift2.value * -30 },
      { scale: 0.9 + drift2.value * 0.2 },
    ],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#000000', '#000000']} style={StyleSheet.absoluteFill} />

      {/* Primary top bloom — breathes up and down */}
      <Animated.View style={[styles.topGlow, glowStyle]}>
        <LinearGradient
          colors={['rgba(20,60,44,0.95)', 'rgba(10,30,22,0.3)', 'rgba(0,0,0,0)']}
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Secondary wandering side-glow — adds depth without symmetry */}
      <Animated.View style={[styles.sideGlow, glow2Style]}>
        <LinearGradient
          colors={['rgba(76,158,255,0.07)', 'rgba(0,0,0,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Bottom vignette — keeps text readable as content scrolls under it */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topGlow: {
    position: 'absolute',
    top: -160,
    left: -100,
    right: -100,
    height: 480,
  },
  sideGlow: {
    position: 'absolute',
    top: '20%',
    left: -120,
    right: -120,
    height: 300,
  },
});
