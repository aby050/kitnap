import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  AppUsage,
  checkUsageAccessPermission,
  openUsageAccessSettings,
  queryTodayUsage,
  usageStatsAvailable,
} from '../data/androidUsage';
import { colors } from '../theme';

/** Package names aren't display names — brighthustle's module doesn't expose
 *  the app label/icon, only what UsageStatsManager gives Android apps:
 *  package id + foreground time. Strips the common prefix so
 *  "com.instagram.android" reads as "instagram.android" instead of full
 *  reverse-DNS noise. A real app-name lookup needs a second native call
 *  (PackageManager.getApplicationLabel) not wired here yet. */
function readableName(pkg: string): string {
  const parts = pkg.split('.');
  return parts.length > 2 ? parts.slice(2).join('.') : pkg;
}

function formatMs(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return '<1m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function RealUsageScreen({ onBack }: { onBack: () => void }) {
  const [granted, setGranted] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<AppUsage[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const has = await checkUsageAccessPermission();
    setGranted(has);
    if (has) {
      setLoading(true);
      const data = await queryTodayUsage();
      setUsage(data);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Re-check when coming back from the Settings screen — permission
    // grants there don't fire any event we can subscribe to otherwise.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const totalMs = usage.reduce((sum, u) => sum + u.totalTimeInForeground, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Real device usage</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!usageStatsAvailable() ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Android-only, and needs a real build</Text>
            <Text style={styles.noticeBody}>
              This reads Android's actual UsageStatsManager — real per-app screen time from the OS, not a mock. It
              only works in a native build with the usage-stats module compiled in, not in Expo Go or the web
              preview.
            </Text>
          </View>
        ) : granted === false ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Usage Access isn't granted yet</Text>
            <Text style={styles.noticeBody}>
              Android treats this as a special permission — there's no in-app prompt for it. You'll be sent to
              Settings; find Wend in the list and turn the toggle on, then come back here.
            </Text>
            <Pressable style={styles.grantBtn} onPress={openUsageAccessSettings}>
              <Text style={styles.grantBtnText}>Open Usage Access settings</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(360)} style={styles.totalCard}>
              <Text style={styles.totalLabel}>Today, on this device</Text>
              <Text style={styles.totalValue}>{formatMs(totalMs)}</Text>
              {loading && <Text style={styles.loadingHint}>Refreshing…</Text>}
            </Animated.View>

            {usage.length === 0 && !loading && (
              <Text style={styles.empty}>No foreground app usage recorded yet today.</Text>
            )}

            {usage.map((u, i) => (
              <Animated.View key={u.packageName} entering={FadeInDown.delay(i * 40).duration(320)} style={styles.row}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {readableName(u.packageName)}
                </Text>
                <Text style={styles.rowValue}>{formatMs(u.totalTimeInForeground)}</Text>
              </Animated.View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 8 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerGlyph: { color: colors.text, fontSize: 19 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 100, gap: 10 },
  notice: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  noticeTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  noticeBody: { color: colors.textDim, fontSize: 13.5, lineHeight: 20 },
  grantBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(124,245,176,0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  grantBtnText: { color: colors.accent, fontSize: 14.5, fontWeight: '700' },
  totalCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 6,
  },
  totalLabel: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  totalValue: { color: colors.text, fontSize: 32, fontWeight: '800', marginTop: 6 },
  loadingHint: { color: colors.textFaint, fontSize: 12, marginTop: 4 },
  empty: { color: colors.textFaint, fontSize: 13.5, textAlign: 'center', marginTop: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  rowName: { color: colors.text, fontSize: 14.5, fontWeight: '600', flex: 1, marginRight: 10 },
  rowValue: { color: colors.accent, fontSize: 14.5, fontWeight: '700' },
});
