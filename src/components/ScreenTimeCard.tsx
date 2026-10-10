import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import UsageReport, { UsageReportProps, usageReportAvailable } from 'usage-report';
import { palette, space } from '../design/tokens';

const PERIODS: { key: NonNullable<UsageReportProps['period']>; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

/**
 * Real "Screen Time" numbers, as a card. Apple only lets this
 * render through a DeviceActivityReport extension (targets/UsageReport) —
 * it stays blank until that extension's own bundle id
 * (com.abhay.phonewise.ReportExtension) has Apple's Family Controls approval,
 * same wait as the other three extensions this app already has approved.
 */
export default function ScreenTimeCard() {
  const [revision] = useState(0);
  const [period, setPeriod] = useState<NonNullable<UsageReportProps['period']>>('today');

  if (Platform.OS !== 'ios' || !UsageReport || !usageReportAvailable()) return null;

  return (
    <View style={styles.card}>
      <View style={styles.tabs}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={[styles.tab, period === p.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>
      {/* Deliberately NOT keyed by period. Remounting tore down the hosted
          DeviceActivityReport scene, and DeviceActivityReportService then
          reused the old scene and logged "Update was a no-op" — the fresh
          view was handed nothing and drew blank. One native view for the
          life of the card; the Swift side changes the filter in place. */}
      <UsageReport revision={revision} period={period} style={styles.report} />
    </View>
  );
}

const styles = StyleSheet.create({
  // No background or radius of its own — this already sits inside a Card on
  // HomeScreen, and drawing a second rounded box inside the first is what
  // made the two look welded together with no gap between them.
  card: {
    overflow: 'hidden',
    // The native report draws from its own top edge, so without this the
    // total ("1h 39m") tucked up under the tab strip.
    paddingTop: space.sm,
  },
  tabs: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: palette.glass,
    borderRadius: 999,
    padding: 3,
    marginBottom: space.base,
  },
  tab: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 999 },
  tabActive: { backgroundColor: palette.accentSoft },
  tabText: { color: palette.textTertiary, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: palette.accent },
  // Native view with no intrinsic size — Yoga needs an explicit height or it
  // measures zero and the card renders empty, same issue as the icon strips.
  // Taller than the bar chart alone needs — the native view also shows a
  // "Top Offenders" notifications section beneath it when there's data for
  // it, and a fixed height that's too short clips that off silently.
  report: { width: '100%', height: 420, alignSelf: 'stretch' },
});
