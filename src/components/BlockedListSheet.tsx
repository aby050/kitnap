import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Modal from './Modal';
import ScreenTimeLabels, { screenTimeLabelsAvailable } from 'screen-time-labels';
import { SELECTION_ID, getBlockState, getSelectionCounts } from '../data/iosScreenTime';
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
/** Doubled from the default 38pt icon — matches BlockedSelection's list. */
const LIST_ICON = 61;
const ROW_HEIGHT = LIST_ICON + 24;

export default function BlockedListSheet({
  visible,
  onClose,
  running,
  onUnlock,
}: {
  visible: boolean;
  onClose: () => void;
  /** Drives the frozen-list notice; a list outside a session is editable. */
  running: boolean;
  /** Routes to the Gate. Absent means unlocking isn't offered from here. */
  onUnlock?: () => void;
}) {
  const counts = getSelectionCounts();
  const rows = (counts?.apps ?? 0) + (counts?.categories ?? 0);
  // Read on every open rather than held in state: a grant can end while this
  // sheet is closed, and a stale "unlocked" line is worse than no line.
  const state = visible ? getBlockState() : { kind: 'none' as const };
  const minsLeft =
    state.kind === 'granted' ? Math.max(1, Math.round((state.until - Date.now()) / 60000)) : 0;

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

          {/* The sheet used to say "Blocked" over a list that was sometimes
              not blocked at all. It now states which of the three states the
              app is actually in, every time it opens. */}
          {rows > 0 && (
            <View style={[styles.status, state.kind === 'granted' && styles.statusOpen]}>
              <View style={[styles.statusDot, state.kind === 'granted' && styles.statusDotOpen]} />
              <Text style={styles.statusText}>
                {state.kind === 'granted'
                  ? `Unlocked — ${minsLeft} min left, then these lock again`
                  : running
                    ? 'Blocked, and locked down for this session'
                    : 'Blocked right now'}
              </Text>
            </View>
          )}

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
                iconSize={LIST_ICON}
                // The native view can't tell Yoga how tall it is, so the
                // height is computed from the real count — a fixed height
                // clipped every list longer than the window.
                style={[styles.labels, { height: Math.max(1, rows) * ROW_HEIGHT }]}
              />
            ) : (
              <Text style={styles.empty}>Nothing selected yet.</Text>
            )}
          </ScrollView>

          {/* Whether these can be opened, and how, was previously something
              the user had to infer. Say it plainly. */}
          {rows > 0 &&
            (state.kind === 'granted' ? (
              <Text style={styles.foot}>These are open until the timer above runs out.</Text>
            ) : running ? (
              <Text style={styles.foot}>
                Nothing unlocks until the session ends — that's what committing a block means.
              </Text>
            ) : onUnlock ? (
              <Pressable
                onPress={() => {
                  onClose();
                  onUnlock();
                }}
                style={({ pressed }) => [styles.unlock, pressed && styles.unlockOn]}
              >
                <Icon name="shield" size={16} color={palette.accent} />
                <Text style={styles.unlockText}>Earn a few minutes</Text>
              </Pressable>
            ) : null)}
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
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: palette.glass,
  },
  statusOpen: { backgroundColor: palette.accentSoft },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.textTertiary },
  statusDotOpen: { backgroundColor: palette.accent },
  statusText: { color: palette.text, fontSize: 13.5, fontWeight: '700' },
  foot: {
    color: palette.textTertiary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 12,
  },
  unlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    backgroundColor: palette.accentSoft,
  },
  unlockOn: { backgroundColor: palette.glassPressed },
  unlockText: { color: palette.accent, fontSize: 14.5, fontWeight: '700' },
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
