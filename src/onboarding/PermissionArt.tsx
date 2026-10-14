import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../design/tokens';

/**
 * Per-permission artwork for the boarding-pass ask.
 *
 * Built from Ionicons (open source) rather than hand-drawn SVG scenes: a large
 * glyph on a rounded plate, a small badge glyph that says what the permission
 * does, and two rings that breathe outward so the screen is never dead still.
 */

const SIZE = 200;
type G = keyof typeof Ionicons.glyphMap;

const ART: Record<string, { main: G; badge: G }> = {
  screenTime: { main: 'bar-chart', badge: 'time' },
  usage: { main: 'bar-chart', badge: 'time' },
  notification: { main: 'notifications', badge: 'checkmark' },
  camera: { main: 'camera', badge: 'body' },
  overlay: { main: 'layers', badge: 'shield-checkmark' },
  accessibility: { main: 'accessibility', badge: 'eye' },
  battery: { main: 'battery-charging', badge: 'flash' },
};

type Props = { permission: string; size?: number };

function Ring({ delay, size }: { delay: number; size: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2800, easing: Easing.out(Easing.quad) }), -1, false));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: (1 - t.value) * 0.5,
    transform: [{ scale: 0.62 + t.value * 0.38 }],
  }));
  return <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, style]} />;
}

export default function PermissionArt({ permission, size = SIZE }: Props) {
  const art = ART[permission] ?? { main: 'shield-checkmark' as G, badge: 'checkmark' as G };
  const plate = size * 0.5;
  return (
    <View style={[styles.stage, { width: size, height: size }]}>
      <Ring size={size} delay={0} />
      <Ring size={size} delay={1400} />
      <View style={[styles.plate, { width: plate, height: plate, borderRadius: plate * 0.3 }]}>
        <Ionicons name={art.main} size={plate * 0.56} color={palette.accent} />
        <View style={[styles.badge, { width: plate * 0.34, height: plate * 0.34, borderRadius: plate * 0.17 }]}>
          <Ionicons name={art.badge} size={plate * 0.2} color="#06232B" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: palette.accentBorder, backgroundColor: palette.accentSoft },
  plate: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceRaised,
    borderWidth: 1,
    borderColor: palette.accentBorder,
  },
  badge: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
