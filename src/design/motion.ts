import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import React from 'react';
import { motion } from './tokens';

/**
 * Byre's shared motion. Durations, springs and press scales live in
 * `tokens.ts`; the *behaviours* built from them live here, so a screen never
 * hand-rolls an entrance and two adjacent screens can't drift apart.
 *
 * ## Why these are hooks and not Reanimated layout animations
 *
 * The app previously shipped `entering`/`exiting` layout animations and they
 * caused the recurring onboarding text-overlap bug: on React Native Web an
 * `exiting` element keeps its box while the next one lays out, so two blocks
 * of copy paint on top of each other. Every helper below drives a shared value
 * instead and animates `opacity`/`transform` only — no layout is involved, so
 * the same code behaves identically on web and on device.
 *
 * Nothing here animates a layout property (`width`, `height`, `margin`,
 * `flex`). Those run on the JS thread and are the usual cause of a stutter
 * mid-gesture. `Meter` is the one deliberate exception — see the note there.
 */

/* ─────────────────────────────────────────────────────────────
 * CURVES
 * Three, with one job each. Anything that needs a fourth probably wants a
 * spring instead.
 * ───────────────────────────────────────────────────────────── */

export const curves = {
  /** The default. Leaves fast, arrives soft — reads as "placed". */
  standard: Easing.out(Easing.cubic),
  /** A longer tail for hero moments (the splash mark, a session completing).
   *  Overshoots nothing but decelerates for noticeably longer.
   *
   *  A hand-written bezier rather than `Easing.out(Easing.poly(5))`: `poly`
   *  returns a fresh closure that is not itself a worklet, so an animation
   *  handed that easing never advances past its first frame. `bezier(...)`
   *  exposes `.factory()` precisely so the curve can cross to the UI thread. */
  emphasized: Easing.bezier(0.16, 1, 0.3, 1).factory(),
  /** Symmetrical, for anything that loops — breathing, shimmer, glow. */
  cycle: Easing.inOut(Easing.sin),
} as const;

/* ─────────────────────────────────────────────────────────────
 * ENTRANCES
 * ───────────────────────────────────────────────────────────── */

/**
 * Fade up into place. The standard way anything arrives in Byre.
 *
 * `rise` is deliberately small (8–16pt). A long travel makes a calm app feel
 * busy; the point is that content *settles* rather than slides in from off
 * screen.
 *
 * @param delay  Stagger offset in ms. Use {@link stagger} for lists.
 * @param rise   Points travelled upward into place.
 */
export function useEntrance({
  delay = 0,
  rise = 12,
  duration = motion.transition,
}: { delay?: number; rise?: number; duration?: number } = {}) {
  const t = useSharedValue(0);

  React.useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration, easing: curves.standard }));
  }, [delay, duration, t]);

  return useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * rise }],
  }));
}

/** Per-item delay for a list or a grid. Capped so a long list's last item
 *  doesn't arrive after the user has already started scrolling. */
export function stagger(index: number, step = motion.stagger, max = 6) {
  return Math.min(index, max) * step;
}

/**
 * Cross-fade a conditional element without unmounting it mid-animation.
 *
 * Use this in place of `entering`/`exiting` when something toggles: the node
 * stays mounted and un-hittable at rest, so nothing reflows and the web
 * overlap bug can't happen. Scale is optional — leave it at 1 for text, where
 * scaling reads as a wobble rather than a fade.
 */
export function useAppear(visible: boolean, { scaleFrom = 1 }: { scaleFrom?: number } = {}) {
  const t = useSharedValue(visible ? 1 : 0);

  React.useEffect(() => {
    t.value = withTiming(visible ? 1 : 0, { duration: motion.enter, easing: curves.standard });
  }, [visible, t]);

  return useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ scale: scaleFrom + (1 - scaleFrom) * t.value }],
  }));
}

/* ─────────────────────────────────────────────────────────────
 * REACTIONS
 * ───────────────────────────────────────────────────────────── */

/**
 * A single scale pop, fired whenever `trigger` changes.
 *
 * This is the app's "something just happened here" gesture — a tab becoming
 * active, a token balance changing, a rep landing. It springs past 1 and back
 * so the eye is drawn without anything moving position.
 *
 * The first run is skipped: on mount everything would pop at once, which reads
 * as the screen twitching rather than as feedback.
 */
export function usePop(trigger: unknown, { amount = 0.14 }: { amount?: number } = {}) {
  const s = useSharedValue(1);
  const mounted = React.useRef(false);

  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    s.value = withSequence(
      withTiming(1 + amount, { duration: motion.instant, easing: curves.standard }),
      withSpring(1, motion.snap),
    );
  }, [trigger, amount, s]);

  return useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
}

/**
 * A slow symmetrical loop, 0 → 1 → 0, for ambient life: a glow breathing
 * behind the mark, a shimmer crossing a surface.
 *
 * Returns the raw shared value rather than a style so one loop can drive
 * several properties without running the clock more than once.
 */
export function useLoop(duration = 2600, delay = 0) {
  const t = useSharedValue(0);

  React.useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: curves.cycle }), -1, true),
    );
  }, [duration, delay, t]);

  return t;
}
