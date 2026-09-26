import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SELECTION_ID,
  blockSelectedApps,
  getScreenTimeAuthorizationStatus,
  getSelectionCounts,
  hasBlockedSelection,
  isCurrentlyShielded,
  requestScreenTimeAuthorization,
  screenTimeAvailable,
  unblockSelectedApps,
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
 * Ground truth for the Screen Time pipeline, read straight from the OS.
 *
 * Blocking spans four processes (the app plus three extensions) and fails
 * silently at every step: an unapproved entitlement, an empty selection and a
 * shield that never applied all look identical from the outside — the app
 * simply doesn't block. This screen shows each step separately and lets you
 * drive them by hand, so a bug report can say which one is false.
 */
export default function ScreenTimeDiagnostics({
  onBack,
  onAddBailouts,
}: {
  onBack: () => void;
  /** Testing aid: a locked session can't be left without one. */
  onAddBailouts?: (count: number) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const available = screenTimeAvailable();
  const auth = getScreenTimeAuthorizationStatus();
  const hasSelection = hasBlockedSelection();
  const counts = getSelectionCounts();
  const shielded = isCurrentlyShielded();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Screen Time diagnostics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.note}>
          Each line is read live from iOS. Every one must be green for an app to actually be blocked.
        </Text>

        <Line label="Native module linked" ok={available} value={available ? 'yes' : 'no'} />
        <Line
          label="Family Controls authorization"
          ok={auth === 'approved'}
          value={auth}
        />
        <Line label="Apps chosen in Apple's picker" ok={hasSelection} value={hasSelection ? 'saved' : 'none'} />
        <Line
          label="Selection contents"
          ok={!!counts && counts.apps + counts.categories > 0}
          value={
            counts
              ? `${counts.apps} apps · ${counts.categories} categories · ${counts.sites} sites`
              : '—'
          }
        />
        <Line label="Shield currently applied" ok={shielded} value={shielded ? 'active' : 'inactive'} />

        <Text style={styles.sectionLabel}>Drive it by hand</Text>

        <Action label="Request authorization" onPress={async () => { await requestScreenTimeAuthorization(); refresh(); }} />
        <Action label="Choose apps (Apple picker)" onPress={() => setPickerOpen(true)} />
        <Action label="Block now" onPress={() => { blockSelectedApps(); refresh(); }} />
        <Action label="Unblock now" onPress={() => { unblockSelectedApps(); refresh(); }} />
        <Action label="Re-read state" onPress={refresh} />
        {onAddBailouts && <Action label="Add 50 bailouts" onPress={() => onAddBailouts(50)} />}

        <Text style={styles.note}>
          After "Block now" reads active, leave Phonewise and open one of the apps you picked — iOS draws
          the shield, not us. Nothing here works in the Simulator.
        </Text>
        <Text style={styles.tick}>read #{tick}</Text>
      </ScrollView>

      {pickerOpen && DeviceActivitySelectionSheetViewPersisted && (
        <DeviceActivitySelectionSheetViewPersisted
          style={{ width: 1, height: 1, position: 'absolute' }}
          familyActivitySelectionId={SELECTION_ID}
          includeEntireCategory
          onDismissRequest={() => {
            setPickerOpen(false);
            refresh();
          }}
          onSelectionChange={refresh}
        />
      )}
    </SafeAreaView>
  );
}

function Line({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <View style={styles.line}>
      <View style={[styles.dot, { backgroundColor: ok ? palette.accent : palette.danger }]} />
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.actionOn]}>
      <Text style={styles.actionText}>{label}</Text>
      <Icon name="chevronRight" size={14} color={palette.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.glass,
  },
  headerTitle: { color: palette.text, fontSize: 16, fontWeight: '700' },
  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 10 },
  note: { color: palette.textTertiary, fontSize: 13, lineHeight: 19, marginVertical: 8 },
  sectionLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 4,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: radius.base,
    backgroundColor: palette.surfaceRaised,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  lineLabel: { color: palette.text, fontSize: 13.5, flex: 1 },
  lineValue: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '700' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radius.base,
    backgroundColor: palette.glass,
  },
  actionOn: { backgroundColor: palette.glassPressed },
  actionText: { color: palette.text, fontSize: 14.5, fontWeight: '600' },
  tick: { color: palette.textQuaternary, fontSize: 11, textAlign: 'center', marginTop: 12 },
});
