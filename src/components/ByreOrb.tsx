import React, { useEffect } from 'react';
import { Image, StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  size?: number;
  /** Dull when false, lit when true — the splash uses it to wake the mark. */
  awake: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * The Byre mark.
 *
 * The real artwork rather than a redraw: the mark's whole character is in the
 * rounded tube and its gloss, and a hand-built SVG of it read as a flat blob.
 * The source is transparent PNG, so it sits on the app's near-black without a
 * plate, and nothing is drawn behind it.
 */
export default function ByreOrb({ size = 160, awake, style }: Props) {
  const lit = useSharedValue(0);
  const breath = useSharedValue(0);

  useEffect(() => {
    lit.value = withTiming(awake ? 1 : 0, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [awake, lit]);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breath]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + lit.value * 0.7,
    transform: [{ scale: 0.97 + lit.value * 0.03 + breath.value * 0.012 }],
  }));

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View style={markStyle}>
        <Image
          source={require('../../assets/byre-logo.png')}
          style={{ width: size, height: size }}
          resizeMode="contain"
          accessibilityLabel="Byre"
        />
      </Animated.View>
    </View>
  );
}
