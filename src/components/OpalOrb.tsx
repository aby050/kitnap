import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { opalGradient, rockGradient } from '../theme';

type Props = {
  size?: number;
  awake: boolean; // false = dull rock, true = glowing opal
  style?: any;
};

export default function OpalOrb({ size = 160, awake, style }: Props) {
  const progress = useSharedValue(0);
  const pulse = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(awake ? 1 : 0, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [awake]);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    rotate.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false);
  }, []);

  const orbStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [1, 1.06]) + pulse.value * 0.02 * progress.value;
    return {
      opacity: interpolate(progress.value, [0, 1], [0.9, 1]),
      transform: [{ scale }, { rotate: `${rotate.value * 360 * progress.value}deg` }],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.55]) + pulse.value * 0.15 * progress.value,
    transform: [{ scale: 1.3 + pulse.value * 0.15 }],
  }));

  const grayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0]),
  }));

  const colorStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size,
            backgroundColor: '#7dd8ff',
            shadowColor: '#7dd8ff',
          },
          glowStyle,
        ]}
      />
      <Animated.View style={[{ width: size, height: size, borderRadius: size, overflow: 'hidden' }, orbStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, grayStyle]}>
          <LinearGradient
            colors={rockGradient}
            start={{ x: 0.3, y: 0.2 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, colorStyle]}>
          <LinearGradient
            colors={opalGradient}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}
