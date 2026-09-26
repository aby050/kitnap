import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  AppUsage,
  checkUsageAccessPermission,
  openUsageAccessSettings,
  queryTodayUsage,
  usageStatsAvailable,
} from '../data/androidUsage';
import { Button } from '../design/primitives';
import { gradients, palette, space, radius } from '../design/tokens';
import Icon from '../ui/Icon';
import { Donut, AppGlyphTile } from './profile/viz';

/** Fixed, high-contrast segment colours — assigned by rank so the donut, its
 *  legend and the breakdown rows all speak the same colour for a given app.
 *  Everything past the top five collapses into one neutral "Other" wedge. */
const SEG = [palette.accent, '#7F92E0', '#E9AE62', '#C79BFF', '#5FE0D6'];
const OTHER = 'rgba(255,255,255,0.22)';

/** Package names aren't display names — UsageStatsManager exposes only the
 *  package id + foreground time, no label or icon. We take the meaningful
 *  segment of the reverse-DNS id and title-case it ("com.instagram.android"
 *  → "Instagram"). A true label needs a PackageManager call not wired here. */
function appLabel(pkg: string): string {
  const parts = pkg.split('.');
  const core = parts.length > 2 ? parts[2] : parts[parts.length - 1];
  return core ? core.charAt(0).toUpperCase() + core.slice(1) : pkg;
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
  const ranked = usage.map((u, i) => ({
    ...u,
    label: appLabel(u.packageName),
    color: i < SEG.length ? SEG[i] : OTHER,
  }));
  const top = ranked.slice(0, SEG.length);
  const restMs = ranked.slice(SEG.length).reduce((s, u) => s + u.totalTimeInForeground, 0);
  const segments = [
    ...top.map((u) => ({ value: u.totalTimeInForeground, color: u.color })),
    ...(restMs > 0 ? [{ value: restMs, color: OTHER }] : []),
  ];
  const legend = [
    ...top,
    ...(restMs > 0 ? [{ packageName: '__other', label: 'Other apps', color: OTHER, totalTimeInForeground: restMs, lastTimeUsed: 0 }] : []),
  ];
  const maxMs = Math.max(1, ...ranked.map((u) => u.totalTimeInForeground));

  return (
    <View style={styles.root}>
      {/* Was the hardcoded pre-theme blue, which left this screen blue-black
          while the rest of the app followed the chosen scheme. */}
      <LinearGradient
        colors={[...gradients.ground]}
        locations={[...gradients.groundLocations]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
            <Icon name="chevronLeft" size={20} color={palette.text} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Screen time</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {!usageStatsAvailable() ? (
            <StateCard
              icon="phone"
              title="Android-only, and needs a real build"
              body="This reads Android's actual UsageStatsManager — real per-app screen time from the OS, not a mock. It only works in a native build with the usage-stats module compiled in, not in Expo Go or the web preview."
            />
          ) : granted === false ? (
            <StateCard
              icon="lock"
              title="Usage Access isn't granted yet"
              body="Android treats this as a special permission — there's no in-app prompt for it. You'll be sent to Settings; find Phonewise in the list and turn the toggle on, then come back here."
            >
              <Button label="Open Usage Access settings" variant="outline" icon="arrowUpRight" onPress={openUsageAccessSettings} />
            </StateCard>
          ) : usage.length === 0 ? (
            <StateCard
              icon="clock"
              title={loading ? 'Reading device usage…' : 'Nothing recorded yet today'}
              body={loading ? 'Fetching the latest foreground time from Android.' : 'No foreground app usage has been logged on this device so far today.'}
            />
          ) : (
            <>
              {/* Screen time today — donut + legend */}
              <Animated.View entering={FadeInDown.duration(380)} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.eyebrow}>SCREEN TIME TODAY</Text>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Live</Text>
                  </View>
                </View>
                <View style={styles.donutWrap}>
                  <Donut segments={segments} size={176} thickness={20}>
                    <View style={styles.donutCenter}>
                      <Text style={styles.donutTotal}>{formatMs(totalMs)}</Text>
                      <Text style={styles.donutCaption}>{usage.length} apps tracked</Text>
                    </View>
                  </Donut>
                </View>

                <View style={styles.legend}>
                  {legend.map((u) => {
                    const pct = Math.round((u.totalTimeInForeground / Math.max(1, totalMs)) * 100);
                    return (
                      <View key={u.packageName} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: u.color }]} />
                        <Text style={styles.legendName} numberOfLines={1}>{u.label}</Text>
                        <View style={styles.legendPctBadge}>
                          <Text style={styles.legendPct}>{pct}%</Text>
                        </View>
                        <Text style={styles.legendVal}>{formatMs(u.totalTimeInForeground)}</Text>
                      </View>
                    );
                  })}
                </View>
                {loading && <Text style={styles.loadingHint}>Refreshing…</Text>}
              </Animated.View>

              {/* Most used */}
              {top.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Top Offenders</Text>
                  <View style={styles.tileRow}>
                    {top.slice(0, 3).map((u, i) => (
                      <View key={u.packageName} style={styles.tile}>
                        <View style={styles.rankPill}>
                          <Text style={styles.rankText}>#{i + 1}</Text>
                        </View>
                        <AppGlyphTile label={u.label} color={u.color} size={46} />
                        <Text style={styles.tileName} numberOfLines={1}>{u.label}</Text>
                        <Text style={styles.tileVal}>{formatMs(u.totalTimeInForeground)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Full breakdown */}
              <Text style={styles.sectionTitle}>All apps breakdown</Text>
              <View style={styles.list}>
                {ranked.map((u, i) => {
                  const pct = Math.round((u.totalTimeInForeground / Math.max(1, totalMs)) * 100);
                  return (
                    <Animated.View key={u.packageName} entering={FadeInDown.delay(Math.min(i, 10) * 30).duration(300)} style={styles.row}>
                      <AppGlyphTile label={u.label} color={u.color} size={38} />
                      <View style={{ flex: 1 }}>
                        <View style={styles.rowTopLine}>
                          <Text style={styles.rowName} numberOfLines={1}>{u.label}</Text>
                          <Text style={styles.rowPctText}>{pct}%</Text>
                        </View>
                        <View style={styles.rowTrack}>
                          <View style={[styles.rowBar, { width: `${Math.max(4, (u.totalTimeInForeground / maxMs) * 100)}%`, backgroundColor: u.color }]} />
                        </View>
                      </View>
                      <Text style={styles.rowValue}>{formatMs(u.totalTimeInForeground)}</Text>
                    </Animated.View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StateCard({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(360)} style={styles.notice}>
      <View style={styles.noticeGlyph}>
        <Icon name={icon} size={26} color={palette.accent} strokeWidth={1.7} />
      </View>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.base },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingVertical: space.md },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.glass, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: palette.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  scroll: { paddingHorizontal: space.gutter, paddingTop: space.xs, paddingBottom: 110 },

  notice: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space.xl,
    marginTop: space.base,
    gap: space.sm,
  },
  noticeGlyph: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: palette.accentSoft,
    borderWidth: 1, borderColor: palette.accentBorder,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space.xs,
  },
  noticeTitle: { color: palette.text, fontSize: 17, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  noticeBody: { color: palette.textSecondary, fontSize: 13.5, lineHeight: 20, textAlign: 'center' },

  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space.lg,
    marginTop: space.base,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(111, 227, 169, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(111, 227, 169, 0.25)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.accent,
  },
  liveText: {
    color: palette.accent,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  eyebrow: { color: palette.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  donutWrap: { alignItems: 'center', marginTop: space.lg, marginBottom: space.lg },
  donutCenter: { alignItems: 'center' },
  donutTotal: { color: palette.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  donutCaption: { color: palette.textTertiary, fontSize: 12, fontWeight: '600', marginTop: 2 },

  legend: { gap: space.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, color: palette.text, fontSize: 14, fontWeight: '600' },
  legendPctBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  legendPct: { color: palette.textSecondary, fontSize: 11.5, fontWeight: '700', textAlign: 'center' },
  legendVal: { color: palette.textSecondary, fontSize: 13, fontWeight: '700', width: 62, textAlign: 'right' },
  loadingHint: { color: palette.textTertiary, fontSize: 12, marginTop: space.md, textAlign: 'center' },

  sectionTitle: { color: palette.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginTop: space.xl, marginBottom: space.md },
  tileRow: { flexDirection: 'row', gap: space.sm },
  tile: {
    flex: 1, alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: palette.border,
    paddingVertical: space.base, paddingHorizontal: space.sm,
    gap: 8,
    position: 'relative',
  },
  rankPill: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rankText: {
    color: palette.textTertiary,
    fontSize: 9.5,
    fontWeight: '800',
  },
  tileName: { color: palette.text, fontSize: 12.5, fontWeight: '700', maxWidth: '100%' },
  tileVal: { color: palette.textSecondary, fontSize: 12, fontWeight: '700' },

  list: { gap: space.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: palette.surface,
    borderRadius: radius.base,
    borderWidth: 1, borderColor: palette.hairline,
    paddingVertical: space.md, paddingHorizontal: space.md,
  },
  rowTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowPctText: {
    color: palette.textTertiary,
    fontSize: 11,
    fontWeight: '700',
  },
  rowName: { color: palette.text, fontSize: 14, fontWeight: '700' },
  rowTrack: { height: 5, borderRadius: 3, backgroundColor: palette.surfaceHigh, marginTop: 6, overflow: 'hidden' },
  rowBar: { height: '100%', borderRadius: 3 },
  rowValue: { color: palette.textSecondary, fontSize: 13.5, fontWeight: '800' },
});
