import React, { useEffect } from 'react';
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
 */
export default function PersistentBackground() {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + drift.value * 0.15,
    transform: [{ translateY: -30 + drift.value * 20 }, { scale: 1 + drift.value * 0.06 }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#000000', '#000000']} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.topGlow, glowStyle]}>
        <LinearGradient
          colors={['rgba(20,50,40,0.9)', 'rgba(0,0,0,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(10,10,10,0.6)']}
        start={{ x: 0.5, y: 0.4 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topGlow: {
    position: 'absolute',
    top: -140,
    left: -80,
    right: -80,
    height: 420,
  },
});
