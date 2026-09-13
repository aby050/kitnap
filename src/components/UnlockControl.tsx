import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { fonts, gradients, palette, radius } from '../design/tokens';
import Icon from '../ui/Icon';

/** Resting diameter — matches IconButton so the control looks untouched. */
const COLLAPSED_W = 44;
const EXPANDED_W = 210;
const MORPH_MS = 260;
/** The app's longest hold. See the note below. */
const HOLD_MS = 3000;
const TICK_START_MS = 150;
const TICK_END_MS = 40;

/**
 * The way out of something that is deliberately hard to leave.
 *
 * At rest it is a bare cross — the smallest possible acknowledgement that a
 * way out exists. Touching it does not act: the circle grows smoothly into a
 * pill that then has to be *held*, charging left to right, before anything
 * happens.
 *
 * It deliberately speaks the same language as `HoldButton` (fill from the
 * left, accelerating haptic ticks, drain rather than snap on release) so this
 * reads as the same commitment gesture used to loosen a block or delete an
 * account, rather than a new one invented per screen. It is not that
 * component because that one is a fixed-width pill: the morph from a 44pt
 * circle is the whole point here, and animating a shared CTA's width would
 * complicate every other caller.
 *
 * HOLD_MS sits at the top of the app's scale (loosening is 2600, delete is
 * 2600): leaving a running block early is the heaviest thing these screens
 * can do, so it asks for the longest hold.
 */
export default function UnlockControl({
  onReveal,
  label = 'keep holding…',
  accessibilityLabel = 'End session',
  accessibilityHint = 'Press and hold for three seconds to see the ways out of this session',
}: {
  onReveal: () => void;
  label?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  // 0 = resting circle, 1 = fully formed pill. Drives width and both
  // cross-fades from one value so they can never disagree.
  const open = useSharedValue(0);
  const progress = useSharedValue(0);
  const [expanded, setExpanded] = useState(false);

  const tickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);

  const stopTicks = useCallback(() => {
    if (tickTimer.current) {
      clearTimeout(tickTimer.current);
      tickTimer.current = null;
    }
  }, []);

  // Same accelerating ramp as HoldButton: a self-rescheduling timeout, so each
  // gap can be shorter than the last. An interval can only tick evenly, which
  // reads as a metronome rather than a charge.
  const scheduleTick = useCallback(() => {
    const t = Math.min(1, (Date.now() - startedAt.current) / HOLD_MS);
    tickTimer.current = setTimeout(
      () => {
        Haptics.impactAsync(
          t > 0.75
            ? Haptics.ImpactFeedbackStyle.Medium
            : t > 0.4
              ? Haptics.ImpactFeedbackStyle.Light
              : Haptics.ImpactFeedbackStyle.Soft,
        ).catch(() => {});
        scheduleTick();
      },
      TICK_START_MS + (TICK_END_MS - TICK_START_MS) * t,
    );
  }, []);

  const finish = useCallback(() => {
    stopTicks();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onReveal();
  }, [onReveal, stopTicks]);

  const onPressIn = () => {
    setExpanded(true);
    startedAt.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    scheduleTick();
    open.value = withTiming(1, { duration: MORPH_MS, easing: Easing.out(Easing.cubic) });
    // Delayed by the morph so the charge starts from a formed pill rather than
    // filling a circle that is still growing underneath it.
    progress.value = withDelay(
      MORPH_MS,
      withTiming(1, { duration: HOLD_MS, easing: Easing.linear }, (done) => {
        if (done) runOnJS(finish)();
      }),
    );
  };

  const onPressOut = () => {
    stopTicks();
    // Drain rather than snap: an instant reset reads as a glitch, a drain
    // reads as the charge you just gave up on.
    progress.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.quad) });
    open.value = withTiming(0, { duration: MORPH_MS, easing: Easing.out(Easing.cubic) }, (done) => {
      if (done) runOnJS(setExpanded)(false);
    });
  };

  useEffect(() => stopTicks, [stopTicks]);

  const shell = useAnimatedStyle(() => ({
    width: COLLAPSED_W + (EXPANDED_W - COLLAPSED_W) * open.value,
  }));
  const crossStyle = useAnimatedStyle(() => ({ opacity: 1 - open.value }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: open.value }));
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: open.value * (0.15 + progress.value * 0.6) }));

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Animated.View style={[styles.shell, shell]}>
        {/* Clipped by the shell's overflow, so the pill itself charges rather
            than carrying a progress bar drawn on top of it. */}
        <Animated.View style={[styles.fillClip, fillStyle]}>
          <LinearGradient
            colors={gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fill}
          />
        </Animated.View>
        <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />

        <Animated.View style={[styles.centered, crossStyle]} pointerEvents="none">
          <Icon name="close" size={20} color={palette.text} />
        </Animated.View>
        <Animated.View style={[styles.centered, labelStyle]} pointerEvents="none">
          {/* Mounted only while expanded: a Text under an opacity-0 layer is
              still read aloud by VoiceOver, which would announce it on a
              resting cross. */}
          {expanded && <Text style={styles.label}>{label}</Text>}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: 44,
    overflow: 'hidden',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Anchored left explicitly: a centred absolute fill would grow from the
  // middle rather than charging across.
  fillClip: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  // Fixed width inside a growing clip, so the gradient stays put instead of
  // squashing as the fill advances.
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, width: EXPANDED_W },
  glow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.accent,
  },
  // Both faces occupy the same box so the cross-fade happens in place rather
  // than sliding; absolute keeps the pill's width driven by the animation
  // alone, not by whichever label is currently mounted.
  centered: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: palette.text,
    fontFamily: fonts.semibold,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
