import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingRow } from '../components/ui';
import { fonts, palette, radius, space } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';
import { DEMO_DAYS } from '../data/demoData';
import { APPEARANCES, appearance } from '../design/appearance';

/** Shown as the row's current value, so the setting states itself. */
const appearanceName = APPEARANCES.find((a) => a.key === appearance)?.name ?? 'Midnight';

/** Derived rather than written out, so the copy can't drift from the seed the
 *  way it did when DEMO_DAYS went from 60 to 183. */
const DEMO_SPAN = `${Math.round(DEMO_DAYS / 30.4)} months`;

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
        <GroupLabel>Blocking</GroupLabel>
        <Group>
          <SettingRow
            icon={<RowIcon name="shieldOff" />}
            title="Blocked Apps"
            subtitle="Which apps trigger the shield"
            onPress={onOpenBlockedApps}
          />
          <SettingRow
            icon={<RowIcon name="sliders" />}
            title="Unlock difficulty"
            value={difficultyLabel}
            subtitle="Steady (quiz) or Strict (physical)"
            onPress={onOpenDifficulty}
          />
          <SettingRow
            icon={<RowIcon name="card" />}
            title="Subscription"
            subtitle="Plan, bailouts, restore purchases"
            onPress={onOpenSubscription}
          />
          <SettingRow
            icon={<RowIcon name="image" />}
            title="Appearance"
            value={appearanceName}
            subtitle="Colour scheme for the whole app"
            onPress={onOpenAppearance}
          />
          <SettingRow
            icon={<RowIcon name="eye" />}
            title="Block Screens"
            subtitle="The screen you see when you open a blocked app"
            onPress={onOpenBlockScreens}
          />
          <SettingRow
            icon={<RowIcon name="clock" />}
            title="Waiting Room"
            subtitle="Customize the content you see during Waiting Room"
            onPress={onOpenWaitingRoom}
          />
          <SettingRow
            icon={<RowIcon name="calendar" />}
            title="Schedules"
            subtitle="Add or edit recurring block windows"
            onPress={onOpenSchedules}
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
                subtitle="A friend holds the code to loosen Strict mode"
                onPress={onOpenGuardian}
                last
              />
            </Group>
          </>
        )}

        <GroupLabel>Account</GroupLabel>
        <Group>
          <SettingRow
            icon={<RowIcon name="user" />}
            title="My Account"
            value={accountLabel ?? 'Not signed in'}
            onPress={onOpenAccount}
          />
          <SettingRow
            icon={<RowIcon name="trash" />}
            title="Delete Account"
            subtitle="Permanently erase your data from this device"
            onPress={onOpenDeleteAccount}
            last={!onOpenScreenTimeDiagnostics}
          />
          {onOpenScreenTimeDiagnostics && (
            <SettingRow
              icon={<RowIcon name="chart" />}
              title="Screen Time diagnostics"
              subtitle="Check whether blocking is actually wired up"
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
    marginTop: space.xl,
    marginBottom: space.sm,
    marginLeft: space.xs,
  },
  group: { backgroundColor: palette.surface, borderRadius: radius.xxl, overflow: 'hidden' },

});
