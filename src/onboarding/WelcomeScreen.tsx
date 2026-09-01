import React, { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import WendOrb from '../components/WendOrb';
import { palette } from '../design/tokens';
import Icon from '../ui/Icon';

const { width, height } = Dimensions.get('window');
const CONFETTI_COLORS = ['#f5c542', '#e07a5f', '#8fb8ff', '#6FE3A9', '#ff7ab8', '#7dd8ff', '#d9f77e'];

function ConfettiPiece({ index }: { index: number }) {
  const fall = useSharedValue(0);
  const startX = (index * 37) % width;
  const delay = (index % 8) * 180;
  const size = 8 + (index % 3) * 4;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];

  useEffect(() => {
    fall.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 3200 + (index % 5) * 400, easing: Easing.linear }), -1, false),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -40 + fall.value * (height + 80) },
      { translateX: Math.sin(fall.value * Math.PI * 3) * 26 },
      { rotate: `${fall.value * 620}deg` },
    ],
    opacity: fall.value < 0.85 ? 1 : (1 - fall.value) / 0.15,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: startX,
          top: 0,
          width: size,
          height: size * 1.4,
          backgroundColor: color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

export default function WelcomeScreen({ onDone }: { onDone: () => void }) {
  return (
    <Pressable style={{ flex: 1 }} onPress={onDone}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.body}>
          <Animated.View entering={FadeIn.duration(800)} style={styles.orbWrap}>
            <WendOrb size={200} awake />
            <View style={styles.pedestal} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.checkCircle}>
            <Icon name="check" size={28} color="#062a14" strokeWidth={2.8} />
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(550).duration(500)} style={styles.heading}>
            You're all set up.{'\n'}Welcome!
          </Animated.Text>

          <Animated.Text entering={FadeIn.delay(1400).duration(600)} style={styles.tapHint}>
            TAP TO CONTINUE
          </Animated.Text>
        </View>

        {Array.from({ length: 24 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 },
  orbWrap: { alignItems: 'center' },
  pedestal: {
    width: 90,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#111',
    marginTop: -8,
  },
  checkCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#b6f5c8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  checkGlyph: { color: '#062a14', fontSize: 30, fontWeight: '900' },
  heading: { color: palette.text, fontSize: 24, fontWeight: '800', textAlign: 'center', lineHeight: 32 },
  tapHint: { color: palette.textSecondary, fontSize: 12, letterSpacing: 2, marginTop: 20 },
});
