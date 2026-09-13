import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingRow } from '../components/ui';
import { fonts, palette, radius, space } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';
import { getSelectionCounts } from '../data/iosScreenTime';
import Constants from 'expo-constants';
import { brandMark } from '../ui/brandMark';
import { DEMO_DAYS } from '../data/demoData';
import { APPEARANCES, appearance } from '../design/appearance';

/** Shown as the row's current value, so the setting states itself. */
const appearanceName = APPEARANCES.find((a) => a.key === appearance)?.name ?? 'Midnight';

/** Derived rather than written out, so the copy can't drift from the seed the
 *  way it did when DEMO_DAYS went from 60 to 183. */
const DEMO_SPAN = `${Math.round(DEMO_DAYS / 30.4)} months`;

/**
 * The two controls people actually open Settings for, lifted out of the list
 * and given their current value as the headline.
 *
 * A settings screen that is nothing but grouped inset rows with a tinted icon
 * chip on each one is the iOS system-settings pattern, and every app in this
 * category ships it unchanged — which is most of why this screen read as
 * borrowed. Leading with live state instead makes it a control panel for the
 * block rather than a table of contents.
 */
function HeroTile({
  value,
  label,
  mark,
  onPress,
}: {
  value: string;
  label: string;
  mark: IconName;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={styles.heroTile}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
    >
      <View style={styles.heroTop}>
        <Icon name={mark} size={18} color={palette.textSecondary} strokeWidth={1.8} />
        <Icon name="chevronRight" size={14} color={palette.textQuaternary} strokeWidth={2} />
      </View>
      <Text style={styles.heroValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.heroLabel}>{label}</Text>
    </Pressable>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.groupLabel}>{children}</Text>;
}

function RowIcon({ name, color = palette.text }: { name: IconName; color?: string }) {
  return <Icon name={name} size={19} color={color} strokeWidth={1.8} />;
}

/**
 * Only real, wired-up features live here — every row below opens an actual
 * screen or toggles actual state. Placeholder rows with no destination
 * (Desktop App, Health Data, Community Forum, Restore Purchase, etc.) were
 * removed rather than shipped as dead taps; add them back only once they're
 * real.
 */
export default function SettingsScreen({
  onBack,
  onOpenGuardian,
  onOpenWaitingRoom,
  onOpenBlockScreens,
  onOpenAppearance,
  onOpenSubscription,
  onOpenSchedules,
  onOpenAccount,
  accountLabel,
  onOpenFutureSelf,
  onOpenBlockedApps,
  onOpenDifficulty,
  onOpenDeleteAccount,
  onOpenScreenTimeDiagnostics,
  onLoadDemoData,
  onClearDemoData,
  difficultyLabel,
}: {
  onBack: () => void;
  onOpenGuardian?: () => void;
  onOpenWaitingRoom?: () => void;
  onOpenBlockScreens?: () => void;
  onOpenAppearance?: () => void;
  onOpenSubscription?: () => void;
  onOpenSchedules?: () => void;
  onOpenAccount?: () => void;
  accountLabel?: string;
  onOpenFutureSelf?: () => void;
  onOpenBlockedApps?: () => void;
  onOpenDifficulty?: () => void;
  onOpenDeleteAccount?: () => void;
  /** iOS only — reads the live Family Controls state. */
  onOpenScreenTimeDiagnostics?: () => void;
  /** __DEV__ only — see the Developer group below. */
  onLoadDemoData?: () => void;
  onClearDemoData?: () => void;
  difficultyLabel?: string;
}) {
  /* Read on render rather than held in state: this screen is pushed over the
   * app, so it mounts fresh every time it is opened and a selection changed
   * on the picker behind it would otherwise show stale here. */
  const counts = getSelectionCounts();
  const blocked = (counts?.apps ?? 0) + (counts?.categories ?? 0);
  const blockedLabel = blocked > 0 ? String(blocked) : 'None yet';

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const build =
    Platform.OS === 'ios'
      ? Constants.expoConfig?.ios?.buildNumber
      : String(Constants.expoConfig?.android?.versionCode ?? '');
  const versionLine = build ? `Version ${version} (${build})` : `Version ${version}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* A page title in the app's headline voice rather than a centred nav
            bar caption. Every other screen in the flow opens on heavy
            lowercase type; Settings was the one place still wearing a 19pt
            centred label between two chrome buttons. */}
        <Text style={styles.pageTitle}>settings</Text>

        <View style={styles.heroRow}>
          <HeroTile
            value={blockedLabel}
            label="BLOCKED"
            mark="shield"
            onPress={onOpenBlockedApps}
          />
          <HeroTile
            value={difficultyLabel ?? 'Steady'}
            label="UNLOCK DIFFICULTY"
            mark="sliders"
            onPress={onOpenDifficulty}
          />
        </View>

        <GroupLabel>The block</GroupLabel>
        <Group>
          <SettingRow
            icon={<RowIcon name="eye" />}
            title="Block Screens"
            subtitle="What you see when you reach for a blocked app"
            onPress={onOpenBlockScreens}
          />
          <SettingRow
            icon={<RowIcon name="clock" />}
            title="Waiting Room"
            subtitle="What you see while the gate counts down"
            onPress={onOpenWaitingRoom}
          />
          <SettingRow
            icon={<RowIcon name="calendar" />}
            title="Schedules"
            subtitle="Windows that block on their own"
            onPress={onOpenSchedules}
          />
          <SettingRow
            icon={<RowIcon name="image" />}
            title="Appearance"
            value={appearanceName}
            subtitle="How the app looks"
            onPress={onOpenAppearance}
            last
          />
        </Group>

        <GroupLabel>Personal</GroupLabel>
        <Group>
          <SettingRow
            icon={<RowIcon name="message" />}
            title="Message to future you"
            subtitle="Re-record what plays back at the gate"
            onPress={onOpenFutureSelf}
            last
          />
        </Group>

        {onOpenGuardian && (
          <>
            <GroupLabel>Accountability</GroupLabel>
            <Group>
              <SettingRow
                icon={<RowIcon name="shield" />}
                title="Guardian"
                subtitle="Someone you trust holds the code"
                onPress={onOpenGuardian}
                last
              />
            </Group>
          </>
        )}

        <GroupLabel>Account</GroupLabel>
        <Group>
          <SettingRow
            icon={<RowIcon name="card" />}
            title="Subscription"
            subtitle="Your plan, bailouts and purchases"
            onPress={onOpenSubscription}
          />
          <SettingRow
            icon={<RowIcon name="user" />}
            title="My Account"
            value={accountLabel ?? 'Not signed in'}
            onPress={onOpenAccount}
          />
          <SettingRow
            icon={<RowIcon name="trash" />}
            title="Delete Account"
            subtitle="Erase everything from this device, for good"
            onPress={onOpenDeleteAccount}
            last={!onOpenScreenTimeDiagnostics}
          />
          {onOpenScreenTimeDiagnostics && (
            <SettingRow
              icon={<RowIcon name="chart" />}
              title="Screen Time diagnostics"
              subtitle="Check blocking is really wired up"
              onPress={onOpenScreenTimeDiagnostics}
              last
            />
          )}
        </Group>

        {/* Development only. Real users must never be able to fill their own
            history with numbers the app made up — the entire premise is that
            what you see happened. Gated here rather than behind a hidden
            gesture so it simply does not exist in a release build. */}
        {__DEV__ && (
          <>
            <GroupLabel>Developer</GroupLabel>
            <Group>
              <SettingRow
                icon={<RowIcon name="chart" />}
                title="Load demo data"
                subtitle={`Fill ${DEMO_SPAN} of history to preview populated screens`}
                onPress={onLoadDemoData}
              />
              <SettingRow
                icon={<RowIcon name="trash" />}
                title="Clear demo data"
                subtitle="Reset history back to empty"
                onPress={onClearDemoData}
                last
              />
            </Group>
          </>
        )}

        {/* Sign-off. Reads from the manifest rather than a hardcoded string,
            so it cannot drift from what was actually shipped — and it is the
            first thing to ask for when someone reports a bug. */}
        <View style={styles.footer}>
          <Image source={brandMark} style={styles.footerMark} resizeMode="contain" />
          <Text style={styles.footerName}>Byre</Text>
          <Text style={styles.footerVersion}>{versionLine}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: space.md },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 18, paddingBottom: space.tabClearance },
  pageTitle: {
    color: palette.text,
    fontFamily: fonts.extrabold,
    fontSize: 44,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: -2,
    marginTop: space.xs,
    marginBottom: space.sm,
  },
  /* Section labels are eyebrows, not headings. At 19/800 they were the same
     weight as the page title and read as five competing titles down the
     page; small and dim, they let the cards below them be the content. */
  groupLabel: {
    color: palette.textTertiary,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: space.xxl,
    marginBottom: space.sm,
    marginLeft: 2,
  },
  footer: { alignItems: 'center', paddingTop: space.xxxl, paddingBottom: space.xl, gap: 6 },
  footerMark: { width: 34, height: 34, opacity: 0.45 },
  footerName: {
    color: palette.textTertiary,
    fontFamily: fonts.extrabold,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  footerVersion: { color: palette.textQuaternary, fontSize: 12, fontWeight: '600' },
  heroRow: { flexDirection: 'row', gap: 10, marginTop: space.base },
  heroTile: {
    flex: 1,
    minHeight: 108,
    borderRadius: radius.xxl,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    justifyContent: 'space-between',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroValue: {
    color: palette.text,
    fontFamily: fonts.extrabold,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 14,
  },
  heroLabel: {
    color: palette.textTertiary,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginTop: 3,
  },
  /* Open rows on the ground, not filled inset cards. The card-with-tinted-
   * icon-chip is the iOS system-settings signature and the single most
   * borrowed-looking thing on this screen; a hairline rule under the eyebrow
   * and dividers between rows carries the same grouping with none of it. */
  group: {
    borderRadius: 0,
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.hairline,
  },

});
