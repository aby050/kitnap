import React, { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius } from '../design/tokens';
import Icon from '../ui/Icon';
import { tapLight } from '../ui/haptics';

/**
 * Keypad for the Emergency sheet's Call row.
 *
 * `tel:` with no number opens the dialer on Android but does nothing at all
 * on iOS — Apple exposes no public scheme for the Phone app's keypad, so the
 * row silently failed there. Rather than have one platform's Call button do
 * nothing, both get this: type the number, hit Call, and the OS takes over
 * with `tel:<number>`, which does work everywhere.
 *
 * Deliberately plain. This opens mid-block, when someone needs to make a
 * call, not to be admired.
 */

const KEYS: { digit: string; letters?: string }[] = [
  { digit: '1' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*' },
  { digit: '0', letters: '+' },
  { digit: '#' },
];

export default function EmergencyDialer({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [number, setNumber] = useState('');

  const press = (d: string) => {
    tapLight();
    setNumber((n) => (n.length >= 20 ? n : n + d));
  };

  const back = () => {
    tapLight();
    setNumber((n) => n.slice(0, -1));
  };

  const call = () => {
    const digits = number.trim();
    if (!digits) return;
    // `tel:` only — `telprompt:` is undocumented and iOS refuses it on some
    // builds, which is exactly the kind of silent failure this screen cannot
    // afford. Strip formatting the dialer would choke on.
    const clean = digits.replace(/[^\d+*#]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {});
    setNumber('');
    onClose();
  };

  const close = () => {
    setNumber('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Dismiss" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Call</Text>
          <Text style={styles.sub}>
            Dialling hands over to your Phone app. It is never blocked — you can also open it
            straight from the home screen.
          </Text>

          <View style={styles.readoutRow}>
            <Text style={styles.readout} numberOfLines={1} adjustsFontSizeToFit>
              {number || ' '}
            </Text>
            {number.length > 0 && (
              <Pressable onPress={back} hitSlop={12} style={styles.backBtn} accessibilityLabel="Delete">
                <Icon name="close" size={14} color={palette.textSecondary} />
              </Pressable>
            )}
          </View>

          <View style={styles.pad}>
            {KEYS.map((k) => (
              <Pressable
                key={k.digit}
                onPress={() => press(k.digit)}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                accessibilityLabel={k.digit}
              >
                <Text style={styles.keyDigit}>{k.digit}</Text>
                {k.letters ? <Text style={styles.keyLetters}>{k.letters}</Text> : null}
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={call}
            disabled={number.length === 0}
            style={({ pressed }) => [
              styles.callBtn,
              number.length === 0 && styles.callBtnOff,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityLabel="Call"
          >
            <Icon name="phone" size={20} color="#04120C" />
            <Text style={styles.callLabel}>Call</Text>
          </Pressable>

          <Pressable onPress={close} hitSlop={10} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: palette.scrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.surfaceRaised,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
    alignItems: 'center',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.borderStrong,
    marginBottom: 14,
  },
  title: { color: palette.text, fontSize: 20, fontWeight: '800' },
  sub: { color: palette.textTertiary, fontSize: 13, marginTop: 4 },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    marginTop: 14,
    alignSelf: 'stretch',
  },
  readout: {
    color: palette.text,
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'center',
    flexShrink: 1,
  },
  backBtn: { marginLeft: 12, padding: 8 },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 6,
  },
  key: {
    width: 76,
    height: 62,
    borderRadius: radius.base,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: palette.glassPressed },
  keyDigit: { color: palette.text, fontSize: 24, fontWeight: '600' },
  keyLetters: { color: palette.textTertiary, fontSize: 10, letterSpacing: 1.5, marginTop: 1 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    alignSelf: 'stretch',
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
  callBtnOff: { opacity: 0.35 },
  callLabel: { color: '#04120C', fontSize: 16, fontWeight: '800' },
  cancel: { marginTop: 12, padding: 6 },
  cancelText: { color: palette.textTertiary, fontSize: 14, fontWeight: '600' },
});
