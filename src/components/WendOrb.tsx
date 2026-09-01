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
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { wendGradient, rockGradient } from '../theme';

type Props = {
  size?: number;
  awake: boolean; // false = dull rock, true = glowing wend
  style?: any;
};

export default function WendOrb({ size = 160, awake, style }: Props) {
  const progress = useSharedValue(0);
  const pulse = useSharedValue(0);

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
  }, []);

  const logoStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [1, 1.06]) + pulse.value * 0.02 * progress.value;
    return {
      opacity: interpolate(progress.value, [0, 1], [0.9, 1]),
      transform: [{ scale }],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.45]) + pulse.value * 0.12 * progress.value,
    transform: [{ scale: 1.25 + pulse.value * 0.12 }],
  }));

  const grayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0]),
  }));

  const colorStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Soft Glow behind the logo */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size,
            backgroundColor: '#7dd8ff',
            shadowColor: '#7dd8ff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
          },
          glowStyle,
        ]}
      />

      <Animated.View style={[{ width: size, height: size, position: 'relative' }, logoStyle]}>
        {/* Gray/Dull Logo */}
        <Animated.View style={[StyleSheet.absoluteFill, grayStyle]}>
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="rockGrad" x1="0" y1="0" x2="1" y2="1">
                {rockGradient.map((color, idx) => (
                  <Stop
                    key={idx}
                    offset={`${(idx / (rockGradient.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </LinearGradient>
            </Defs>
            <G fill="none" stroke="url(#rockGrad)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M 26 29 L 41 71 L 56 32 L 71 71" />
            </G>
            <Circle cx="86" cy="32" r="9.5" fill="url(#rockGrad)" />
            <Path
              d="M 88.5 39.5 C 88.5 45.5 85.5 50.5 80.5 53.5 C 78.4 54.7 77.1 52.6 79.1 51.1 C 82.2 48.8 84.2 45.2 84.4 41 Z"
              fill="url(#rockGrad)"
            />
          </Svg>
        </Animated.View>

        {/* Colorful/Glowing Logo */}
        <Animated.View style={[StyleSheet.absoluteFill, colorStyle]}>
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="wendGrad" x1="0" y1="0" x2="1" y2="1">
                {wendGradient.map((color, idx) => (
                  <Stop
                    key={idx}
                    offset={`${(idx / (wendGradient.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </LinearGradient>
            </Defs>
            <G fill="none" stroke="url(#wendGrad)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M 26 29 L 41 71 L 56 32 L 71 71" />
            </G>
            <Circle cx="86" cy="32" r="9.5" fill="url(#wendGrad)" />
            <Path
              d="M 88.5 39.5 C 88.5 45.5 85.5 50.5 80.5 53.5 C 78.4 54.7 77.1 52.6 79.1 51.1 C 82.2 48.8 84.2 45.2 84.4 41 Z"
              fill="url(#wendGrad)"
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
