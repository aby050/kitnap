import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import ByreOrb from '../components/ByreOrb';

/** Header mark — small enough to sit above copy and the Screen Time card
 *  without covering them. Constant across every screen that shares a layout
 *  with body copy, so it never resizes underneath the reader.
 *
 *  NOTE: this is the box, not the drawn width. The mark's artwork is taller
 *  than it is wide (aspect 0.908) and is rendered `contain` into a square, so
 *  the visible width is ~0.91 of this number — at the old value of 52 the
 *  mark drew only 47pt across and read as an afterthought once it shrank out
 *  of the education slides. The slot height derives from this constant, so
 *  raising it moves the layout with it and nothing needs adjusting by hand. */
export const ONBOARDING_MARK_SIZE = 76;

/** The education slides carry three short lines and nothing else, so the
 *  mark is the only thing with room to grow into — it reads as the brand
 *  moment there rather than as a header. */
export const ONBOARDING_MARK_SIZE_LARGE = Math.round(
  Math.min(240, Math.max(150, Dimensions.get('window').height * 0.27)),
);

/** How far the large mark drops below the safe area. The education slides
 *  carry three short lines and then a lot of nothing; the mark moves down
 *  into that gap rather than hugging the status bar with a hole beneath it. */
const LARGE_DROP = Dimensions.get('window').height < 760 ? 24 : 48;

/** Breathing room above the mark, inside the safe area. */
const MARK_OFFSET = 12;

/** In-flow spacer matching the overlay so titles and questions don't sit
 *  under it. Overlay + slot share this number so the mark never jumps. */
export const markSlotHeight = (large?: boolean) =>
  MARK_OFFSET +
  (large ? LARGE_DROP + ONBOARDING_MARK_SIZE_LARGE : ONBOARDING_MARK_SIZE) +
  20;

export const ONBOARDING_MARK_SLOT = markSlotHeight(false);

/**
 * The Phonewise mark, lifted out of individual screens so it can stay mounted
 * from the three education slides through the question flow. Screens render
 * {@link OnboardingMarkSlot} to reserve the same space; this overlay paints
 * the actual mark once. `hidden` only fades it — never unmounts — so a
 * permission card can cover the slot without reloading the mark afterwards.
 */
export default function OnboardingMark({ hidden, large }: { hidden?: boolean; large?: boolean }) {
  const insets = useSafeAreaInsets();
  // The orb is always drawn at its largest and scaled down, so growing and
  // shrinking never remounts it — the whole point of hoisting it out of the
  // screens was that it survives the education → questions handoff. Scaling
  // from the top edge keeps it pinned under the safe area while the slot
  // below it changes height.
  const scaleStyle = useAnimatedStyle(() => ({
    // translateY before scale: the drop is in real points, and scaling after
    // it keeps the small state pinned where it has always been.
    transform: [
      { translateY: withTiming(large ? LARGE_DROP : 0, { duration: 420 }) },
      { scale: withTiming(large ? 1 : ONBOARDING_MARK_SIZE / ONBOARDING_MARK_SIZE_LARGE, { duration: 420 }) },
    ],
  }));
  return (
    <View
      pointerEvents="none"
      style={[styles.overlay, { top: insets.top + MARK_OFFSET, opacity: hidden ? 0 : 1 }]}
    >
      <Animated.View style={[styles.orbBox, scaleStyle]}>
        <ByreOrb size={ONBOARDING_MARK_SIZE_LARGE} awake />
      </Animated.View>
    </View>
  );
}

export function OnboardingMarkSlot({ large }: { large?: boolean }) {
  return <View style={{ height: markSlotHeight(large) }} />;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 8,
  },
  orbBox: {
    width: ONBOARDING_MARK_SIZE_LARGE,
    height: ONBOARDING_MARK_SIZE_LARGE,
    alignItems: 'center',
    justifyContent: 'center',
    transformOrigin: 'top center',
  },
});
