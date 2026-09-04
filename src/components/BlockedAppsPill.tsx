import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenTimeLabels, { screenTimeLabelsAvailable } from 'screen-time-labels';
import BlockedListSheet from './BlockedListSheet';
import { SELECTION_ID, getSelectionCounts } from '../data/iosScreenTime';
import { palette } from '../design/tokens';
import Icon from '../ui/Icon';

const ICON = 22;
const MAX = 3;

/**
 * "Blocked Apps  ▣▣▣  ›" — what this session will hold back, in one line.
 *
 * Sits next to the start control because that's the moment it matters: you
 * should be able to see what you're committing to without leaving the screen.
 * The icons are the real ones, drawn by iOS from the saved selection.
 */
export default function BlockedAppsPill({
  style,
  running = false,
  onUnlock,
}: {
  style?: any;
  /** True while a committed block is counting down — the list freezes then. */
  running?: boolean;
  onUnlock?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const counts = getSelectionCounts();
  const apps = counts?.apps ?? 0;
  const categories = counts?.categories ?? 0;

  if (Platform.OS !== 'ios') return null;

  // Only ever whole icons: the native strip lays out `shown` icons at
  // iconSize with 0.18 spacing, plus its own "+N" tile when there are more.
  // Measuring that exactly is what stops the first and last being sliced off.
  const shown = Math.min(apps, MAX);
  const extra = apps + categories - shown;
  const tiles = shown + (extra > 0 ? 1 : 0);
  const stripWidth = tiles * ICON + (tiles - 1) * ICON * 0.18;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.pill, pressed && styles.pillOn, style]}
        accessibilityLabel="Blocked apps"
      >
        <Icon name="grid" size={15} color={palette.accent} />
        <Text style={styles.label}>Blocked Apps</Text>

        {shown > 0 && ScreenTimeLabels && screenTimeLabelsAvailable() && (
          <ScreenTimeLabels
            selectionId={SELECTION_ID}
            iconSize={ICON}
            maxCount={shown}
            style={{ width: stripWidth, height: ICON + 2 }}
          />
        )}
        {apps + categories === 0 && <Text style={styles.none}>none yet</Text>}

        <Icon name="chevronRight" size={15} color={palette.textTertiary} />
      </Pressable>

      <BlockedListSheet
        visible={open}
        running={running}
        onUnlock={onUnlock}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 999,
    backgroundColor: palette.glass,
    borderWidth: 1,
    borderColor: palette.border,
  },
  pillOn: { backgroundColor: palette.glassPressed },
  label: { color: palette.text, fontSize: 14.5, fontWeight: '700' },
  none: { color: palette.textTertiary, fontSize: 13, fontWeight: '600' },
});
