import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Modal from './Modal';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '../design/primitives';
import { palette, radius, space, type } from '../design/tokens';

/** Two ways out and no third: wait, or spend. Leading with the time left makes
 *  waiting the obvious default rather than burying it under the paid option.
 *
 *  Shared by the locked timer and the focus room so both charge the same
 *  Bailout for the same act — a second, cheaper exit anywhere would make the
 *  price meaningless everywhere. */
export default function CancelConfirm({
  visible,
  title = 'End this session?',
  remainingLabel,
  remainingUnits,
  tokenBalance,
  onClose,
  onSpend,
  onOpenTokenInfo,
}: {
  visible: boolean;
  title?: string;
  remainingLabel?: string;
  remainingUnits?: string;
  tokenBalance: number;
  onClose: () => void;
  onSpend: () => void;
  onOpenTokenInfo?: () => void;
}) {
  const noun = tokenBalance === 1 ? 'Bailout' : 'Bailouts';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.confirmOverlay}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>{title}</Text>
          {!!remainingLabel && (
            <View style={styles.confirmWaitWrap}>
              <Text style={styles.confirmWaitValue}>{remainingLabel}</Text>
              <Text style={styles.confirmWaitUnits}>{remainingUnits} left</Text>
            </View>
          )}
          <Text style={styles.confirmBody}>
            You can wait it out, or end it now for{' '}
            <Text style={styles.confirmAccent}>1 Bailout</Text>.{'\n'}You have {tokenBalance} {noun}.
          </Text>
          <Button label="Wait it out" variant="accent" onPress={onClose} />
          <Button
            label={tokenBalance <= 0 ? 'No Bailouts left' : 'End now · 1 Bailout'}
            variant="ghost"
            disabled={tokenBalance <= 0}
            onPress={onSpend}
          />
          {onOpenTokenInfo && (
            <Pressable onPress={onOpenTokenInfo} hitSlop={8}>
              <Text style={styles.confirmInfoLink}>What is a Bailout?</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  confirmWaitWrap: { alignItems: 'center', marginTop: space.sm, marginBottom: space.xs },
  confirmWaitValue: { ...type.title1, color: palette.text },
  confirmWaitUnits: { ...type.caption, color: palette.textTertiary },
  confirmOverlay: {
    flex: 1,
    backgroundColor: palette.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 344,
    backgroundColor: palette.surfaceRaised,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.xxl,
    padding: space.xl,
    gap: space.md,
  },
  confirmTitle: { ...type.title3, textAlign: 'center' },
  confirmBody: { ...type.callout, textAlign: 'center', lineHeight: 21, marginBottom: space.xs },
  confirmAccent: { color: palette.accent, fontWeight: '700' },
  confirmInfoLink: { ...type.sub, textAlign: 'center', textDecorationLine: 'underline', marginTop: space.xs },
});
