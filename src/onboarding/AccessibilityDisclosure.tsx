import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../design/primitives';
import { palette, radius } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';

/**
 * Prominent disclosure for the Accessibility Service, shown before the user
 * is sent to Settings to enable it.
 *
 * Google requires this of any app using accessibility services that isn't an
 * accessibility tool: say what the API is used for, what it reads, and get an
 * affirmative action before enabling — not a Grant button next to a sentence.
 * Kitnap is not an accessibility tool (it isn't built for users with
 * disabilities), so `isAccessibilityTool` stays false and this screen is the
 * honest route rather than the loophole.
 *
 * Everything claimed here is enforced in code, not just promised:
 * ByreAccessibilityService reads `event.packageName` and nothing else, and the
 * service config sets canRetrieveWindowContent="false", so the OS never hands
 * it screen content in the first place.
 */

const POINTS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'eye',
    title: 'What it reads',
    body: 'Only the name of the app that just came to the front — for example "com.instagram.android". Nothing else.',
  },
  {
    icon: 'shield',
    title: 'What it is used for',
    body: 'To notice the moment a blocked app opens, so Kitnap can show the block screen. That is its only job.',
  },
  {
    icon: 'lock',
    title: 'What it cannot see',
    body: 'Not what is on your screen, not what you type, not your messages, passwords or photos. Android is told not to send them.',
  },
  {
    icon: 'lock',
    title: 'Where it goes',
    body: 'Nowhere. The check happens on your phone and the app name is discarded straight after. Kitnap has no server to send it to.',
  },
];

export default function AccessibilityDisclosure({
  visible,
  onAccept,
  onCancel,
}: {
  visible: boolean;
  /** Only after this does the app open the system Settings screen. */
  onAccept: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.eyebrow}>BEFORE YOU TURN THIS ON</Text>
          <Text style={styles.title}>Kitnap uses Android's Accessibility Service API</Text>
          <Text style={styles.lede}>
            It is the only way an app can tell that another app has opened. Here is exactly what that
            means, in full.
          </Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {POINTS.map((p) => (
              <View key={p.title} style={styles.row}>
                <View style={styles.iconTile}>
                  <Icon name={p.icon} size={17} color={palette.accent} strokeWidth={1.9} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{p.title}</Text>
                  <Text style={styles.rowBody}>{p.body}</Text>
                </View>
              </View>
            ))}

            <Text style={styles.footnote}>
              Kitnap is not an accessibility tool for people with disabilities, and does not claim to be.
              It uses this API for app blocking only. You can turn it off at any time in Android
              Settings, and Kitnap will stop blocking.
            </Text>
          </ScrollView>

          <View style={styles.cta}>
            <Button label="Agree and open Settings" variant="primary" onPress={onAccept} />
            <Button label="Decline" variant="outline" onPress={onCancel} />
          </View>
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
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '88%',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.borderStrong,
    alignSelf: 'center',
    marginBottom: 16,
  },
  eyebrow: {
    color: palette.accent,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: { color: palette.text, fontSize: 22, fontWeight: '800', marginTop: 8, lineHeight: 29 },
  lede: { color: palette.textSecondary, fontSize: 14.5, lineHeight: 21, marginTop: 8 },
  list: { marginTop: 18 },
  row: { flexDirection: 'row', gap: 13, marginBottom: 18 },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rowText: { flex: 1 },
  rowTitle: { color: palette.text, fontSize: 15, fontWeight: '700' },
  rowBody: { color: palette.textSecondary, fontSize: 13.5, lineHeight: 20, marginTop: 3 },
  footnote: {
    color: palette.textTertiary,
    fontSize: 12.5,
    lineHeight: 19,
    marginBottom: 10,
  },
  cta: { gap: 12, marginTop: 6 },
});
