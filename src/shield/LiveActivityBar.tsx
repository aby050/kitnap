import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '../design/tokens';

/** iOS can't stop the user leaving our app during a grant window, but a real
 *  build would keep this on-screen via ActivityKit — visible in the Dynamic
 *  Island without reopening us. This is the in-app stand-in: a persistent
 *  pill over every screen while a grant is running, with one gentle haptic
 *  moment (the pulse) at 30 seconds left. */
export default function LiveActivityBar({
  expiresAt,
  emergency,
  onExpire,
  onPress,
}: {
  expiresAt: number;
  emergency?: boolean;
  onExpire: () => void;
  onPress: () => void;
}) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
  const pulse = useSharedValue(1);

  useEffect(() => {
    const id = setInterval(() => {
      const r = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) onExpire();
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    if (remaining === 30) {
      pulse.value = withSequence(
        withTiming(1.12, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 220, easing: Easing.in(Easing.quad) }),
      );
    }
  }, [remaining]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  if (remaining <= 0) return null;

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <Animated.View entering={FadeIn.duration(280)} exiting={FadeOut.duration(200)} style={styles.wrap} pointerEvents="box-none">
      <Animated.View style={style}>
        <Pressable onPress={onPress} style={styles.pill}>
          <View style={[styles.dot, emergency && styles.dotEmergency]} />
          <Text style={styles.label}>{emergency ? 'Emergency access' : 'Unlocked'}</Text>
          <Text style={styles.time}>
            {mm}:{ss}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center', zIndex: 200 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20,20,20,0.96)',
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent },
  dotEmergency: { backgroundColor: palette.danger },
  label: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, fontWeight: '600' },
  time: { color: '#fff', fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
