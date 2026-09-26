import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import BlockedSelection from '../components/BlockedSelection';
import { DEFAULT_BLOCKED_APPS } from '../data/blockedApps';
import { installedLabel, useInstalledApps } from '../data/installedApps';
import { HARD_BLOCKS } from '../onboarding/questions';
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
import Icon, { IconName } from '../ui/Icon';
import { palette, radius, space, type } from '../design/tokens';

/** Package name → friendly label, falling back to the last path segment so a
 *  custom-added package still reads as something rather than raw reverse-DNS. */
function appLabel(packageName: string): string {
  // What the launcher calls it, first — that is the name on the user's own
  // home screen, and it is right for every package rather than the handful
  // the curated list happens to know.
  const real = installedLabel(packageName);
  if (real) return real;
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
/** Rule name → glyph. Matched on the words people actually use when naming a
 *  window, with the time of day as a second pass, so a custom "Gym 6am" still
 *  gets something better than a generic calendar. */
function ruleIcon(name: string, start: string): IconName {
  const n = name.toLowerCase();
  if (/sleep|bed|night/.test(n)) return 'moon';
  if (/wind ?down|evening|relax|calm/.test(n)) return 'leaf';
  if (/morning|wake|sunrise/.test(n)) return 'sunrise';
  if (/work|office|deep|focus|study|school/.test(n)) return 'target';
  if (/dinner|lunch|meal|family|kids|home/.test(n)) return 'heart';
  if (/gym|run|walk|workout|train/.test(n)) return 'activity';
  if (/read|book/.test(n)) return 'book';
  const hour = Number(start.split(':')[0]);
  if (Number.isFinite(hour)) {
    if (hour >= 21 || hour < 5) return 'moon';
    if (hour < 10) return 'sunrise';
    if (hour < 17) return 'sun';
  }
  return 'clock';
}

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
  onOpenDifficulty,
  onOpenGuardian,
  guardianName = null,
  hardBlocks = [],
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
  onOpenDifficulty?: () => void;
  /** Opens Guardian setup. Absent hides the card. */
  onOpenGuardian?: () => void;
  /** Set means Guardian is live — the card becomes a status display. */
  guardianName?: string | null;
  /** HARD_BLOCKS keys the user asked to have gone completely. */
  hardBlocks?: string[];
  schedules?: { id: string; name: string; start: string; end: string; days: string }[];
}) {
  const blockedApps = blockedPackages.map((pkg) => ({
    packageName: pkg,
    name: appLabel(pkg),
    icon: DEFAULT_BLOCKED_APPS.find((a) => a.packageName === pkg)?.icon,
  }));
  // Subscribe so the rows re-render once the launcher names and icons land;
  // appLabel/AppGlyph read the cache synchronously.
  useInstalledApps();
  const strictnessLabel = getIntensity(intensityKey).name;

  return (
    <Screen edges={['top']} bloom>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow} />
        <Editorial lead="Decide once," emphasis="stay out of reach." style={styles.voice} />

        {/* Primary entry — Android only. Its destination is per-app daily
            minute limits, which Family Controls does not expose on iOS; the
            picker below is the whole-app blocking that works on both.
            The "Block Shorts" and "Block Websites" rows this card used to
            advertise are gone: Screen Time cannot block one feature inside an
            app (Shorts rides the same surface as YouTube itself), so they
            were permanently-disabled rows promising something unbuildable. */}
        {Platform.OS !== 'ios' && (
          <Card tone="accent" onPress={onOpenBlocks} style={styles.blockCard}>
            <Row
              icon="sliders"
              iconColor={palette.accent}
              title="Block apps & limits"
              subtitle="Set a daily minute limit for any app."
              chevron
            />
          </Card>
        )}

        {/* Blocked apps */}
        <SectionHeader
          title="Blocked apps"
          actionLabel={Platform.OS !== 'ios' && blockedApps.length > 0 ? 'Edit' : undefined}
          onAction={Platform.OS !== 'ios' && blockedApps.length > 0 ? onOpenBlockedApps : undefined}
          style={styles.section}
        />
        {/* The unlock level is global — one setting for every blocked app —
            so it belongs here rather than repeated on each row. On iOS the
            row list is drawn natively and can't carry it at all, which is why
            the level was invisible on that platform entirely. */}
        <Pressable style={styles.levelRow} onPress={onOpenDifficulty} hitSlop={6}>
          <Text style={[type.sub, styles.levelLabel]}>Unlock difficulty</Text>
          <Pill label={strictnessLabel} tone="accent" />
          <Icon name="chevronRight" size={13} color={palette.textQuaternary} />
        </Pressable>

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
                <Animated.View key={rule.id} entering={FadeInDown.delay(i * 30).duration(240)}>
                  {i > 0 && <Divider inset={56} />}
                  <Row
                    icon={ruleIcon(rule.name, rule.start)}
                    iconColor={status.active ? palette.accent : palette.textSecondary}
                    title={rule.name}
                    subtitle={`${rule.days} · ${rule.start}–${rule.end}`}
                    right={<Pill label={status.label} tone={status.active ? 'accent' : 'neutral'} />}
                    onPress={onOpenSchedules}
                    chevron={false}
                  />
                </Animated.View>
              );
            })}
          </Card>
        ) : (
          <EmptyState
            icon="calendar"
            title="No recurring rules"
            body="Add a window like Work Time or Sleep and Phonewise will block on schedule."
            actionLabel="Add a rule"
            onAction={onOpenSchedules}
          />
        )}

        {/* Manage */}
        {/* What the user asked to have gone completely, and why it is shut.
            A block with no stated reason reads as the app being difficult.
            The reason here is the user's own answer from onboarding, quoted
            back at the moment they are most likely to be arguing with it. */}
        {hardBlocks.length > 0 && (
          <>
            <SectionHeader title="Gone completely" style={styles.section} />
            <Card style={styles.list}>
              {hardBlocks.map((key, i) => {
                const item = HARD_BLOCKS.find((h) => h.key === key);
                if (!item) return null;
                return (
                  <View key={key} style={i === 0 ? undefined : styles.hardNext}>
                    <View style={styles.hardHead}>
                      <Icon name="lock" size={15} color={palette.accent} />
                      <Text style={styles.hardTitle}>{item.label}</Text>
                    </View>
                    <Text style={styles.hardWhy}>{item.why}</Text>
                  </View>
                );
              })}
            </Card>
          </>
        )}

        {/* Guardian belongs on this screen more than anywhere else: this is
            where someone comes to take an app *off* the list, which is
            precisely the moment the feature exists for. Offering it here is
            not a cross-sell — it is the answer to what they are about to do. */}
        {onOpenGuardian && (
          <Card onPress={onOpenGuardian} style={styles.section}>
            <View style={styles.guardHead}>
              <View style={styles.guardEyebrowRow}>
                <View style={[styles.guardDot, guardianName ? null : styles.guardDotOff]} />
                <Text style={styles.guardEyebrow}>GUARDIAN</Text>
              </View>
              <Icon name="chevronRight" size={16} color={palette.textQuaternary} />
            </View>
            <Text style={styles.guardLine}>
              {guardianName
                ? `${guardianName} holds your key.`
                : 'Make this list hard to undo.'}
            </Text>
            <Text style={styles.guardBody}>
              {guardianName
                ? 'Taking an app off this list needs their code.'
                : 'Someone you trust holds a code. Without it, apps cannot come off this list.'}
            </Text>
          </Card>
        )}

        {/* "Essentials & always-allowed" is an Android idea and it is hidden
            here on iOS.
            Android blocks by package and therefore needs a whitelist. iOS
            does the opposite: the Family Activity Picker defines what is
            blocked and everything the user did not pick is allowed already,
            so a screen promising to keep Maps and the dialer "always allowed"
            describes a permission Phonewise never grants — nothing reads these
            toggles on the way to the shield. It stays on the locked session
            screen, where it is what it actually is: shortcuts out to the
            dialer, maps and your bank while everything else is shut. */}
        {Platform.OS !== 'ios' && (onOpenEssentials || onOpenBlockedApps) && (
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
  guardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guardEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  guardDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.accent },
  guardDotOff: { backgroundColor: palette.textQuaternary },
  guardEyebrow: { color: palette.textTertiary, fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  guardLine: { color: palette.text, fontSize: 16, fontWeight: '600', marginTop: 8, lineHeight: 22 },
  guardBody: { color: palette.textSecondary, fontSize: 13.5, lineHeight: 19, marginTop: 6 },
  hardNext: { marginTop: space.lg },
  hardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hardTitle: { color: palette.text, fontSize: 15, fontWeight: '700' },
  hardWhy: { color: palette.textSecondary, fontSize: 13.5, lineHeight: 19, marginTop: 6 },
  voice: { marginTop: space.base },

  blockCard: { marginTop: space.xl },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
  },
  levelLabel: { flex: 1, color: palette.textSecondary },
  section: { marginTop: space.xl },
  list: { paddingHorizontal: space.base },

  blockedRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rowSub: { marginTop: space.xxs },
});
