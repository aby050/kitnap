import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '../design/primitives';
import Icon, { IconName } from '../ui/Icon';
import { palette, radius, space, type } from '../design/tokens';

/**
 * "That one is on the paid plan."
 *
 * Every Pro gate used to be `Alert.alert`, which draws the platform's own
 * dialog: Roboto, system grey, ALL-CAPS buttons on Android. It is the one
 * surface in the app that looked like it belonged to something else, and it
 * appeared at the exact moment the app is asking to be paid — the worst
 * possible time to look like a system error.
 *
 * Kept deliberately small. It is an interruption, not a pitch: the name of the
 * thing, one sentence on why it exists, and two ways out. The argument for
 * paying lives on the plans screen, which is one tap away.
 */
export default function ProGateDialog({
  visible,
  title,
  body,
  icon = 'shield',
  onSeePlans,
  onDismiss,
}: {
  visible: boolean;
  title: string;
  body: string;
  icon?: IconName;
  onSeePlans: () => void;
  onDismiss: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(180)} style={styles.box}>
          <View style={styles.mark}>
            <Icon name={icon} size={20} color={palette.accent} strokeWidth={1.8} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

          <View style={styles.actions}>
            <Button label="See plans" variant="accent" onPress={onSeePlans} />
            <Button label="Not now" variant="ghost" onPress={onDismiss} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.66)',
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
    gap: space.sm,
  },
  mark: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  title: { ...type.title3, color: palette.text },
  body: { ...type.body, color: palette.textSecondary },
  actions: { gap: space.sm, marginTop: space.sm },
});
