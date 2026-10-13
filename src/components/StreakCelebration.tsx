import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '../design/primitives';
import { palette, radius, space, type } from '../design/tokens';

/** One line per milestone. Plain, no confetti voice: the number does the work. */
function lineFor(days: number): string {
  if (days < 7) return 'Three days in a row. The habit has started to notice.';
  if (days < 14) return 'A full week. Most people never get this far.';
  if (days < 30) return 'Two weeks. This is what it feels like when it sticks.';
  if (days < 90) return 'A month and more. This is just how you live now.';
  return 'Months of choosing it. That is not a streak any more, it is you.';
}

/**
 * Shown once when the streak lands on a milestone (STREAK_MILESTONES).
 *
 * The streak was always counted and never celebrated — it sat as a number on
 * the Profile screen. A milestone that passes silently teaches nothing; one
 * that is marked gives the next day a reason.
 */
export default function StreakCelebration({
  days,
  onDismiss,
}: {
  days: number | null;
  onDismiss: () => void;
}) {
  return (
    <Modal visible={days != null} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(220)} style={styles.box}>
          <Text style={styles.number}>{days}</Text>
          <Text style={styles.unit}>day streak</Text>
          <Text style={styles.body}>{days != null ? lineFor(days) : ''}</Text>
          <View style={styles.actions}>
            <Button label="Keep going" variant="accent" onPress={onDismiss} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.gutter,
  },
  box: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    padding: space.lg,
    alignItems: 'center',
  },
  number: { fontSize: 88, fontWeight: '800', color: palette.accent, letterSpacing: -2, lineHeight: 96 },
  unit: { ...type.title3, color: palette.text, marginTop: 2 },
  body: { ...type.body, color: palette.textSecondary, textAlign: 'center', marginTop: space.sm },
  actions: { alignSelf: 'stretch', marginTop: space.lg },
});
