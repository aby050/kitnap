import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { control, gradients, palette, radius, type } from '../design/tokens';

/**
 * A CTA you have to *hold*, not tap.
 *
 * The screens this sits on ask for a commitment — the whole product is about
 * a decision surviving the moment after it's made — so the button asks for a
 * second of deliberate intent instead of a reflex tap. Energy fills the pill
 * left to right while held; the haptic ticks accelerate with the fill, so the
 * hand feels the charge building and knows when it is about to land. Letting
 * go early drains it back to empty and nothing happens.
 */

/** Long enough to be a decision, short enough not to be a chore. */
const DEFAULT_HOLD_MS = 950;

/** Tick spacing at the start and at the brink — the ramp between them is what
 *  makes the charge *feel* like it's accelerating rather than just repeating. */
const TICK_START_MS = 150;
const TICK_END_MS = 40;

/** Embers rising through the charge. Drawn on a fixed-width layer inside the
 *  fill clip, so they are revealed as the pill fills rather than floating on
 *  top of it — the charge looks lit from within instead of painted on. */
const PARTICLE_COUNT = 16;
/** Matches `fill`: a fixed width means positions don't slide as the clip grows. */
const PARTICLE_FIELD_W = 400;

/** Deterministic per-particle jitter — a real RNG would reshuffle on every
 *  render and make the field twitch. */
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function Ember({ index, holding }: { index: number; holding: SharedValue<number> }) {
  const t = useSharedValue(0);
  const left = rand(index, 1) * PARTICLE_FIELD_W;
  const size = 2 + rand(index, 2) * 3;
  const rise = 16 + rand(index, 3) * 18;
  const drift = (rand(index, 4) - 0.5) * 10;
  const duration = 900 + rand(index, 5) * 900;
  const delay = rand(index, 6) * 900;

  useEffect(() => {
    // Free-running: gating the loop on press would restart every ember in
    // lockstep and read as a pulse. Opacity does the gating instead.
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    // Fade in off the floor, out at the top — never a hard pop at either end.
    const life = t.value < 0.2 ? t.value / 0.2 : 1 - (t.value - 0.2) / 0.8;
    return {
      opacity: holding.value * life * 0.85,
      transform: [
        { translateY: -t.value * rise },
        { translateX: drift * t.value },
        { scale: 0.5 + life * 0.6 },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ember, { left, width: size, height: size, borderRadius: size / 2 }, style]}
    />
  );
}

export default function HoldButton({
  label,
  holdLabel = 'Keep holding…',
  onComplete,
  disabled = false,
  holdMs = DEFAULT_HOLD_MS,
  style,
  accessibilityLabel,
}: {
  label: string;
  /** Shown while the charge is building. */
  holdLabel?: string;
  onComplete: () => void;
  disabled?: boolean;
  /** How long the hold takes. Longer where the decision is heavier. */
  holdMs?: number;
  style?: ViewStyle;
  /** Defaults to `label`, which is usually right — pass one only where the
   *  visible copy is shorter than what a screen reader needs. */
  accessibilityLabel?: string;
}) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const holding = useSharedValue(0);

  // Haptics are a JS-thread concern: the ramp is driven by a self-rescheduling
  // timeout rather than an interval so each gap can be shorter than the last.
  const tickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);

  const stopTicks = useCallback(() => {
    if (tickTimer.current) {
      clearTimeout(tickTimer.current);
      tickTimer.current = null;
    }
  }, []);

  const scheduleTick = useCallback(() => {
    const elapsed = Date.now() - startedAt.current;
    const t = Math.min(1, elapsed / holdMs);
    const delay = TICK_START_MS + (TICK_END_MS - TICK_START_MS) * t;
    tickTimer.current = setTimeout(() => {
      // The pulses get heavier as well as faster — a light tap early, a solid
      // knock right before it releases.
      const style =
        t > 0.75
          ? Haptics.ImpactFeedbackStyle.Medium
          : t > 0.4
            ? Haptics.ImpactFeedbackStyle.Light
            : Haptics.ImpactFeedbackStyle.Soft;
      Haptics.impactAsync(style).catch(() => {});
      scheduleTick();
    }, delay);
  }, [holdMs]);

  const finish = useCallback(() => {
    stopTicks();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onComplete();
  }, [onComplete, stopTicks]);

  const onPressIn = () => {
    if (disabled) return;
    startedAt.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    scheduleTick();
    holding.value = withTiming(1, { duration: 140 });
    scale.value = withSpring(0.98, { damping: 18, stiffness: 260 });
    progress.value = withTiming(
      1,
      { duration: holdMs, easing: Easing.linear },
      (finished) => {
        if (finished) runOnJS(finish)();
      },
    );
  };

  const onPressOut = () => {
    stopTicks();
    holding.value = withTiming(0, { duration: 180 });
    scale.value = withSpring(1, { damping: 18, stiffness: 260 });
    // Drain rather than snap: an instant reset reads as a glitch, a drain
    // reads as the charge you just gave up on.
    progress.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.quad) });
  };

  const shellStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.15 + progress.value * 0.55 }));
  const idleLabelStyle = useAnimatedStyle(() => ({ opacity: 1 - holding.value }));
  const holdLabelStyle = useAnimatedStyle(() => ({ opacity: holding.value }));

  return (
    <Animated.View style={[shellStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint="Press and hold to continue"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.shell, disabled && styles.disabled]}
      >
        {/* The energy. Clipped by the shell's overflow so it reads as the pill
            itself charging up rather than a bar drawn on top of it. */}
        <Animated.View style={[styles.fillClip, fillStyle]}>
          <LinearGradient
            colors={gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fill}
          />
          <View style={styles.emberField} pointerEvents="none">
            {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
              <Ember key={i} index={i} holding={holding} />
            ))}
          </View>
        </Animated.View>
        <Animated.View style={[styles.edgeGlow, glowStyle]} pointerEvents="none" />

        <View style={styles.labelWrap} pointerEvents="none">
          <Animated.Text style={[styles.label, idleLabelStyle]} numberOfLines={1}>
            {label}
          </Animated.Text>
          <Animated.Text style={[styles.label, styles.labelOverlay, holdLabelStyle]} numberOfLines={1}>
            {holdLabel}
          </Animated.Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: control.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    backgroundColor: palette.accentSoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.45 },
  // The fill is width-animated from the left edge, so it has to be anchored
  // there explicitly — a centred absolute fill would grow from the middle.
  fillClip: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  // Fixed-width gradient inside a growing clip: the colours stay put while the
  // pill fills, instead of the gradient squashing as the width changes.
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 400 },
  // Fixed-width layer, same reasoning as `fill`: the embers keep their places
  // while the clip grows over them.
  emberField: { position: 'absolute', left: 0, top: 0, bottom: 0, width: PARTICLE_FIELD_W },
  ember: { position: 'absolute', bottom: 6, backgroundColor: '#FFFFFF' },
  edgeGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.accent,
  },
  // Fills the pill so both labels can sit stacked in the same centred box —
  // shrink-wrapping to the idle label would clip the longer holding one.
  labelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...type.bodyStrong,
    color: palette.text,
    letterSpacing: -0.2,
    textAlign: 'center',
    width: '100%',
  },
  // Both labels occupy the same spot so the cross-fade doesn't reflow the pill.
  labelOverlay: { position: 'absolute' },
});
