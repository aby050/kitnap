import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Modal from './Modal';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '../design/primitives';
import BailoutGlyph from './BailoutGlyph';
import { palette, radius, space, type } from '../design/tokens';

/**
 * The last thing said before a lock with no way out.
 *
 * A Bailout is the exit; with none in hand a session genuinely cannot be
 * ended early, and that is a reasonable thing to agree to and an unreasonable
 * thing to find out afterwards. This is deliberately not `CancelConfirm` —
 * that one asks whether to *spend* a Bailout and hardcodes a body saying so.
 *
 * Both doors are offered and neither is hidden: buying is the first button
 * because it is the one someone reaching for an exit later will wish they had
 * taken, but starting anyway is a plain, unpenalised choice next to it, not a
 * greyed-out afterthought.
 */
export default function NoBailoutConfirm({
  visible,
  balance,
  onGet,
  onStartAnyway,
  onDismiss,
}: {
  visible: boolean;
  /** Shown so the zero is stated, not implied. */
  balance: number;
  onGet: () => void;
  onStartAnyway: () => void;
  onDismiss: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.box}>
          <View style={styles.headRow}>
            <Text style={styles.title}>No bailouts</Text>
            <View style={styles.balanceWrap}>
              <BailoutGlyph size={18} color={palette.text} />
              <Text style={styles.balance}>{balance}</Text>
            </View>
          </View>

          <Text style={styles.body}>
            If you start without a bailout you won&rsquo;t be able to leave before the timer
            ends. Emergency access still works.
          </Text>

          <View style={styles.actions}>
            <Button label="Get bailouts" variant="accent" onPress={onGet} />
            <Button label="Start anyway" variant="ghost" onPress={onStartAnyway} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    padding: space.gutter,
  },
  box: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...type.title3, color: palette.text },
  balanceWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balance: { ...type.body, color: palette.textSecondary, fontWeight: '700' },
  body: { ...type.body, color: palette.textSecondary },
  actions: { gap: space.sm, marginTop: space.xs },
});
