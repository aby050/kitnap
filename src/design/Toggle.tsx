import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from './tokens';

// 68 not 62: "OFF" is a third wider than "ON" and has to clear the knob
// without touching the pill edge.
const W = 68;
const H = 34;
const PAD = 3.5;
const KNOB = H - PAD * 2;

/**
 * The app's only toggle. Replaces the platform `Switch`, which rendered
 * differently on each OS and gave no room for a state label.
 *
 * Reads its state twice — colour *and* the word ON/OFF — so it doesn't rely on
 * hue alone, which is the usual accessibility failure of a bare switch and
 * matters here because several of these decide whether an app is blocked.
 *
 * The label sits opposite the knob, so the knob never covers it.
 */
export default function Toggle({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const t = useDerivedValue(
    () => withTiming(value ? 1 : 0, { duration: 180, easing: Easing.out(Easing.cubic) }),
    [value],
  );

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: PAD + t.value * (W - KNOB - PAD * 2) }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: t.value > 0.5 ? palette.accent : 'rgba(46,49,54,0.16)',
  }));

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={disabled && styles.disabled}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        {/* Padded to the side the knob is not on. */}
        <View style={[styles.labelWrap, value ? styles.labelOn : styles.labelOff]}>
          <Text style={[styles.label, value ? styles.labelTextOn : styles.labelTextOff]}>
            {value ? 'ON' : 'OFF'}
          </Text>
        </View>
        <Animated.View style={[styles.knob, knobStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: W,
    height: H,
    borderRadius: H / 2,
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: '#FFFFFF',
    // Lifts the knob off both track colours without a hard border.
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  labelWrap: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  labelOn: { left: 11 },
  labelOff: { right: 10 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  // Azure is a light surface, so ON reads in near-black; OFF sits on the dark track.
  labelTextOn: { color: 'rgba(255,255,255,0.55)' },
  labelTextOff: { color: 'rgba(46,49,54,0.6)' },
  disabled: { opacity: 0.4 },
});
