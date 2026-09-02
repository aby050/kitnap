import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import BlockedSelection from '../components/BlockedSelection';
import { DEFAULT_BLOCKED_APPS } from '../data/blockedApps';
import { getIntensity, IntensityKey } from '../data/themes';
import {
  Card,
  Divider,
  Editorial,
  EmptyState,
  Pill,
  Row,
  Screen,
  SectionHeader,
} from '../design/primitives';
import AppGlyph from '../ui/AppGlyph';
import { palette, radius, space, type } from '../design/tokens';

/** Package name → friendly label, falling back to the last path segment so a
 *  custom-added package still reads as something rather than raw reverse-DNS. */
function appLabel(packageName: string): string {
  const known = DEFAULT_BLOCKED_APPS.find((a) => a.packageName === packageName);
  if (known) return known.name;
  const parts = packageName.split('.');
  const tail = parts.length > 1 ? parts[parts.length - 1] : packageName;
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

function toMinutes(hhmm: string): number | null {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** Live "5h 25m left" / "Starts in 10h". Handles windows that wrap past
 *  midnight (e.g. 22:00 → 07:00). */
function scheduleStatus(start: string, end: string, now = new Date()): { active: boolean; label: string } {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null) return { active: false, label: 'Not set' };

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const wraps = s > e;
  const active = wraps ? nowMin >= s || nowMin < e : nowMin >= s && nowMin < e;

  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h <= 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  if (active) {
    const until = e > nowMin ? e - nowMin : 24 * 60 - nowMin + e;
    return { active: true, label: `${fmt(until)} left` };
  }
  const untilStart = s > nowMin ? s - nowMin : 24 * 60 - nowMin + s;
  return { active: false, label: `Starts in ${fmt(untilStart)}` };
}

export default function MyAppsScreen({
  blockedPackages = [],
  intensityKey = 'steady',
  onUnblockPackage,
  onOpenBlockedApps,
  onOpenSchedules,
  onOpenEssentials,
  onOpenBlocks,
  schedules = [],
}: {
  blockedPackages?: string[];
  /** Newly-locked apps show the currently-active global strictness level —
   *  there's no per-app override yet, this just makes the existing global
   *  setting visible on each tile instead of implying nothing was chosen. */
  intensityKey?: IntensityKey;
  onUnblockPackage?: (packageName: string) => void;
  onOpenBlockedApps?: () => void;
  onOpenSchedules?: () => void;
  onOpenEssentials?: () => void;
  onOpenBlocks?: () => void;
  schedules?: { id: string; name: string; start: string; end: string; days: string }[];
}) {
  const blockedApps = blockedPackages.map((pkg) => ({
    packageName: pkg,
    name: appLabel(pkg),
    icon: DEFAULT_BLOCKED_APPS.find((a) => a.packageName === pkg)?.icon,
  }));
  const strictnessLabel = getIntensity(intensityKey).name;

  return (
    <Screen edges={['top']} bloom>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow} />
        <Editorial lead="Decide once," emphasis="stay out of reach." style={styles.voice} />

        {/* Primary entry */}
        <Card tone="accent" onPress={onOpenBlocks} style={styles.blockCard}>
          <Row
            icon="sliders"
            iconColor={palette.accent}
            title="Block apps & limits"
            subtitle="Set daily limits, block Shorts, restrict websites."
            chevron
          />
        </Card>

        {/* Blocked apps */}
        <SectionHeader
          title="Blocked apps"
          actionLabel={Platform.OS !== 'ios' && blockedApps.length > 0 ? 'Edit' : undefined}
          onAction={Platform.OS !== 'ios' && blockedApps.length > 0 ? onOpenBlockedApps : undefined}
          style={styles.section}
        />

        {/* iOS never tells the app which apps were picked, so the row list is
            Android-only: there the package names are real. */}
        {Platform.OS === 'ios' ? (
          <BlockedSelection />
        ) : blockedApps.length > 0 ? (
          <Card padded={false} style={styles.list}>
            {blockedApps.map((app, i) => (
              <Animated.View key={app.packageName} entering={FadeInDown.delay(i * 30).duration(240)}>
                {i > 0 && <Divider inset={56} />}
                <View style={styles.blockedRow}>
                  <AppGlyph name={app.name} packageName={app.packageName} source={app.icon} size={44} />
                  <View style={styles.shrink}>
                    <Text style={type.body} numberOfLines={1}>{app.name}</Text>
                    <Text style={[type.sub, styles.rowSub]}>Locked · {strictnessLabel}</Text>
                  </View>
                  <Pill label="Unblock" onPress={() => onUnblockPackage?.(app.packageName)} />
                </View>
              </Animated.View>
            ))}
          </Card>
        ) : (
          <EmptyState
            icon="shield"
            title="Nothing blocked yet"
            body="Choose which apps should trigger the shield when you reach for them."
            actionLabel="Choose apps"
            onAction={onOpenBlockedApps}
          />
        )}

        {/* Rules */}
        <SectionHeader
          title="Rules"
          actionLabel={schedules.length > 0 ? 'Edit' : undefined}
          onAction={schedules.length > 0 ? onOpenSchedules : undefined}
          style={styles.section}
        />

        {schedules.length > 0 ? (
          <Card padded={false} style={styles.list}>
            {schedules.map((rule, i) => {
              const status = scheduleStatus(rule.start, rule.end);
              return (
                <View key={rule.id}>
                  {i > 0 && <Divider inset={56} />}
                  <Row
                    icon="calendar"
                    iconColor={status.active ? palette.accent : palette.textSecondary}
                    title={rule.name}
                    subtitle={`${rule.days} · ${rule.start}–${rule.end}`}
                    right={<Pill label={status.label} tone={status.active ? 'accent' : 'neutral'} />}
                    onPress={onOpenSchedules}
                    chevron={false}
                  />
                </View>
              );
            })}
          </Card>
        ) : (
          <EmptyState
            icon="calendar"
            title="No recurring rules"
            body="Add a window like Work Time or Sleep and Byre will block on schedule."
            actionLabel="Add a rule"
            onAction={onOpenSchedules}
          />
        )}

        {/* Manage */}
        {(onOpenEssentials || onOpenBlockedApps) && (
          <>
            <SectionHeader title="Manage" style={styles.section} />
            <Card padded={false} style={styles.list}>
              {onOpenEssentials && (
                <Row
                  icon="shield"
                  title="Essentials & always-allowed"
                  subtitle="Never blocked, never counted"
                  onPress={onOpenEssentials}
                  chevron
                />
              )}
              {onOpenEssentials && onOpenBlockedApps && <Divider inset={56} />}
              {onOpenBlockedApps && (
                <Row
                  icon="lock"
                  title="All blocked apps"
                  subtitle={`${blockedApps.length} app${blockedApps.length === 1 ? '' : 's'} in the list`}
                  onPress={onOpenBlockedApps}
                  chevron
                />
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shrink: { flex: 1, minWidth: 0 },
  scroll: { paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.tabClearance },
  headerRow: { minHeight: 44 },
  voice: { marginTop: space.base },

  blockCard: { marginTop: space.xl },
  section: { marginTop: space.xl },
  list: { paddingHorizontal: space.base },

  blockedRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rowSub: { marginTop: space.xxs },
});
