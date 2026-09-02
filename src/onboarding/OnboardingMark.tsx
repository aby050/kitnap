import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ByreOrb from '../components/ByreOrb';

/** Header mark — small enough to sit above copy and the Screen Time card
 *  without covering them. Kept constant so it never resizes across screens. */
export const ONBOARDING_MARK_SIZE = 52;

/** Breathing room above the mark, inside the safe area. */
const MARK_OFFSET = 12;

/** In-flow spacer matching the overlay so titles and questions don't sit
 *  under it. Overlay + slot share this number so the mark never jumps. */
export const ONBOARDING_MARK_SLOT = MARK_OFFSET + ONBOARDING_MARK_SIZE + 20;

/**
 * The Byre mark, lifted out of individual screens so it can stay mounted
 * from the three education slides through the question flow. Screens render
 * {@link OnboardingMarkSlot} to reserve the same space; this overlay paints
 * the actual mark once. `hidden` only fades it — never unmounts — so a
 * permission card can cover the slot without reloading the mark afterwards.
 */
export default function OnboardingMark({ hidden }: { hidden?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={[styles.overlay, { top: insets.top + MARK_OFFSET, opacity: hidden ? 0 : 1 }]}
    >
      <ByreOrb size={ONBOARDING_MARK_SIZE} awake />
    </View>
  );
}

export function OnboardingMarkSlot() {
  return <View style={styles.slot} />;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 8,
  },
  slot: {
    height: ONBOARDING_MARK_SLOT,
  },
});
