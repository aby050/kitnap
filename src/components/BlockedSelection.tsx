import React, { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenTimeLabels, { screenTimeLabelsAvailable } from 'screen-time-labels';
import {
  SELECTION_ID,
  blockSelectedApps,
  getSelectionCounts,
  isCurrentlyShielded,
} from '../data/iosScreenTime';
import { palette, radius } from '../design/tokens';
import Icon from '../ui/Icon';

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
/** A SwiftUI Label row: 40pt icon plus padding. */
const ROW = 64;

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

  const handleSelection = () => {
    // The persisted picker writes the selection itself; keep the shield in
    // step with the edit so a change mid-session takes effect now.
    if (isCurrentlyShielded()) blockSelectedApps();
    setPickerOpen(false);
    refresh();
  };

  const apps = counts?.apps ?? 0;
  const categories = counts?.categories ?? 0;
  const sites = counts?.sites ?? 0;
  const empty = apps + categories + sites === 0;
  const rows = apps + categories;

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
          style={{ width: '100%', height: rows * ROW }}
        />
      )}

      <Text style={[styles.summary, empty && styles.summaryEmpty]}>{summary}</Text>

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
});
