import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenTimeLabels, { screenTimeLabelsAvailable } from 'screen-time-labels';
import { SELECTION_ID, getSelectionCounts } from '../data/iosScreenTime';
import { palette, radius } from '../design/tokens';
import Icon from '../ui/Icon';

/**
 * What a running session is holding back, by real name and icon.
 *
 * Shown rather than made editable: changing the list mid-session would be the
 * simplest way around the block, so the sheet says plainly that it's frozen
 * until the timer ends instead of offering controls that refuse to work.
 */
// A SwiftUI Label row is a 40pt icon plus 12pt padding top and bottom.
const ROW_HEIGHT = 64;

export default function BlockedListSheet({
  visible,
  onClose,
  running,
}: {
  visible: boolean;
  onClose: () => void;
  /** Drives the frozen-list notice; a list outside a session is editable. */
  running: boolean;
}) {
  const counts = getSelectionCounts();
  const rows = (counts?.apps ?? 0) + (counts?.categories ?? 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10} accessibilityLabel="Close">
              <Icon name="close" size={16} color={palette.text} />
            </Pressable>
            <Text style={styles.title}>Blocked</Text>
            <View style={{ width: 40 }} />
          </View>

          {running && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                You cannot edit the list of blocked apps and websites while a timer is running.
              </Text>
            </View>
          )}

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {screenTimeLabelsAvailable() && ScreenTimeLabels ? (
              <ScreenTimeLabels
                selectionId={SELECTION_ID}
                layout="list"
                maxCount={40}
                // One row is ~46pt tall. The native view can't tell Yoga how
                // tall it is, so the height is computed from the real count —
                // a fixed height clipped every list longer than the window.
                style={[styles.labels, { height: Math.max(1, rows) * ROW_HEIGHT }]}
              />
            ) : (
              <Text style={styles.empty}>Nothing selected yet.</Text>
            )}
          </ScrollView>
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 26,
    maxHeight: '76%',
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.glass,
  },
  title: { color: palette.text, fontSize: 19, fontWeight: '800' },
  notice: {
    backgroundColor: palette.glass,
    borderRadius: radius.base,
    padding: 15,
    marginTop: 16,
  },
  noticeText: { color: palette.textSecondary, fontSize: 14.5, lineHeight: 21, textAlign: 'center' },
  list: { marginTop: 12 },
  listContent: { paddingBottom: 12 },
  labels: { width: '100%' },
  empty: { color: palette.textTertiary, fontSize: 14.5, textAlign: 'center', paddingVertical: 30 },
});
