import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenTimeLabels, { screenTimeLabelsAvailable } from 'screen-time-labels';
import {
  SELECTION_ID,
  blockSelectedApps,
  clearBlockedSelection,
  getSelectionCounts,
  isCurrentlyShielded,
  resetAllBlocks,
} from '../data/iosScreenTime';
import { palette, radius } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';

let DeviceActivitySelectionSheetViewPersisted: any = null;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    DeviceActivitySelectionSheetViewPersisted =
      require('react-native-device-activity').DeviceActivitySelectionSheetViewPersisted;
  } catch {
    DeviceActivitySelectionSheetViewPersisted = null;
  }
}

/**
 * What is actually blocked on iOS, everywhere it needs to be shown.
 *
 * Every screen that listed blocked apps was rendering the same seven
 * hardcoded Android package names, which on iOS are not installed, not
 * blocked, and not editable — the list looked like data and was decoration.
 * This is the real thing: icons drawn natively from the saved Family Controls
 * selection, counts read from that same selection, and an edit button that
 * opens Apple's picker, the only way the selection can be changed.
 */
const ICON = 40;
const ICON_MAX = 6;
/** Doubled from the default 38pt — icons in the full list read too small
 *  next to the name text at the old size. */
const LIST_ICON = 61;
/** A SwiftUI Label row: LIST_ICON plus padding. */
const ROW = LIST_ICON + 24;

export default function BlockedSelection({
  compact,
  onChanged,
}: {
  /** Icons only, for a card that already has its own heading. */
  compact?: boolean;
  onChanged?: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [counts, setCounts] = useState(() => getSelectionCounts());
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(() => {
    setCounts(getSelectionCounts());
    setRevision((r) => r + 1);
    onChanged?.();
  }, [onChanged]);

  // The native side publishes the saved selection ~100ms after the picker
  // mounts, and again on every tap inside it. Closing the sheet here (as this
  // used to) unmounted the picker the instant it opened — which is why
  // "choose apps" appeared to do nothing at all. Selection changes only
  // refresh; dismissal is the sole thing that closes.
  const handleSelection = () => {
    // The persisted picker writes the selection itself; keep the shield in
    // step with the edit so a change takes effect now.
    blockSelectedApps();
    refresh();
  };

  const apps = counts?.apps ?? 0;
  const categories = counts?.categories ?? 0;
  const sites = counts?.sites ?? 0;
  const empty = apps + categories + sites === 0;
  const rows = apps + categories;
  // A shield can outlive the selection that created it — reinstalling Byre
  // wipes the App Group where the selection is recorded, but Apple enforces
  // the shield at the OS level independently of that, by design. When that
  // happens the list looks empty yet apps are still genuinely blocked, with
  // no selection left to point an ordinary unblock call at.
  const orphanedShield = empty && isCurrentlyShielded();

  const summary = empty
    ? 'Nothing selected yet'
    : [
        apps ? `${apps} ${apps === 1 ? 'app' : 'apps'}` : null,
        categories ? `${categories} ${categories === 1 ? 'category' : 'categories'}` : null,
        sites ? `${sites} ${sites === 1 ? 'site' : 'sites'}` : null,
      ]
        .filter(Boolean)
        .join(' · ');

  return (
    <View style={compact ? undefined : styles.card}>
      {compact && apps > 0 && ScreenTimeLabels && screenTimeLabelsAvailable() && (
        <ScreenTimeLabels
          selectionId={SELECTION_ID}
          iconSize={ICON}
          maxCount={ICON_MAX}
          revision={revision}
          // Explicit width: the strip is a native view, and Yoga gives it no
          // intrinsic size — left to itself it measured zero and vanished.
          style={[
            styles.icons,
            { width: Math.min(apps, ICON_MAX) * ICON * 1.18 + (apps > ICON_MAX ? ICON * 1.18 : 0) },
          ]}
        />
      )}

      {/* Rows, not just a strip: seeing "Instagram" next to its icon is the
          point — a row of unlabelled icons reads as decoration. */}
      {!compact && rows > 0 && ScreenTimeLabels && screenTimeLabelsAvailable() && (
        <ScreenTimeLabels
          selectionId={SELECTION_ID}
          layout="list"
          maxCount={40}
          revision={revision}
          iconSize={LIST_ICON}
          // The card around this has alignItems: 'center', which shrinks a
          // percentage width down to nothing before Yoga hands the native
          // view a size — the native list was measuring near-zero and
          // rendering as unlabelled icon fragments. alignSelf: 'stretch'
          // overrides the parent's cross-axis centering for this child only.
          style={{ alignSelf: 'stretch', width: '100%', height: rows * ROW }}
        />
      )}

      {/* A blank card reading "Nothing selected yet" looked like an error
          state, not an invitation — this is the first thing new users see
          on My Apps, before they've picked anything. */}
      {!compact && empty && !orphanedShield && (
        <View style={styles.emptyArt}>
          <View style={styles.emptySlots}>
            {(['message', 'play', 'camera', 'globe'] as const).map((glyph, i) => (
              <View key={glyph} style={[styles.emptySlot, { transform: [{ rotate: `${(i - 1.5) * 4}deg` }] }]}>
                <Icon name={glyph} size={20} color={palette.textQuaternary} />
              </View>
            ))}
          </View>
          <Text style={styles.emptyTitle}>Nothing's holding you back. Yet.</Text>
          <Text style={styles.emptyBody}>
            Pick the apps that eat your evenings — Byre will do the holding back for you.
          </Text>
        </View>
      )}

      {!empty && (
        <Text style={[styles.summary, empty && styles.summaryEmpty]}>{summary}</Text>
      )}

      {orphanedShield && (
        <Text style={styles.orphanNote}>
          Some apps are still blocked from before — likely left over from reinstalling Byre.
          Nothing shows above because that record is gone, but the block itself is still real.
        </Text>
      )}

      {!compact && (
        <>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => [styles.edit, pressed && styles.editOn]}
          >
            <Icon name="shield" size={16} color={palette.accent} />
            <Text style={styles.editText}>{empty ? 'Choose apps to block' : 'Change selection'}</Text>
          </Pressable>
          <Text style={styles.note}>
            Apple's picker is the only way to choose apps, and it never tells Byre which ones you
            picked — the icons above are drawn by iOS itself.
          </Text>
          {!empty && (
            <Pressable onPress={() => { clearBlockedSelection(); refresh(); }} hitSlop={8}>
              <Text style={styles.clearText}>Clear all</Text>
            </Pressable>
          )}
          {orphanedShield && (
            <Pressable onPress={() => { resetAllBlocks(); refresh(); }} hitSlop={8}>
              <Text style={styles.clearText}>Reset stuck blocks</Text>
            </Pressable>
          )}
        </>
      )}

      {pickerOpen && DeviceActivitySelectionSheetViewPersisted && (
        <DeviceActivitySelectionSheetViewPersisted
          style={{ width: 1, height: 1, position: 'absolute' }}
          familyActivitySelectionId={SELECTION_ID}
          includeEntireCategory
          onDismissRequest={() => {
            setPickerOpen(false);
            refresh();
          }}
          onSelectionChange={handleSelection}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surfaceRaised,
    borderRadius: radius.xl,
    padding: 18,
    alignItems: 'center',
    gap: 12,
  },
  icons: { height: ICON + 4, alignSelf: 'center' },
  summary: { color: palette.text, fontSize: 15, fontWeight: '700' },
  summaryEmpty: { color: palette.textTertiary, fontWeight: '600' },
  edit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    backgroundColor: palette.accentSoft,
  },
  editOn: { backgroundColor: palette.glassPressed },
  editText: { color: palette.accent, fontSize: 14.5, fontWeight: '700' },
  note: {
    color: palette.textTertiary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
  },
  clearText: {
    color: palette.textTertiary,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  orphanNote: {
    color: palette.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyArt: { alignItems: 'center', gap: 12, paddingVertical: 4 },
  emptySlots: { flexDirection: 'row', gap: 10 },
  emptySlot: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: palette.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyBody: {
    color: palette.textTertiary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 260,
  },
});
