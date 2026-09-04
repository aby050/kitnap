import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingRow } from '../components/ui';
import { palette, space } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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

        {/* Guardian is hidden until there's a way to actually reach the
            friend holding the code — it needs an email/SMS service Byre
            doesn't have, so shipping the row would promise a handoff that
            never happens. The screen itself is left intact behind it. */}

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
                subtitle="Fill 2 months of history to preview populated screens"
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
  headerTitle: { flex: 1, color: palette.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  scroll: { paddingHorizontal: 18, paddingBottom: 110 },
  groupLabel: { color: palette.text, fontSize: 19, fontWeight: '800', marginTop: 30, marginBottom: 12 },
  group: { backgroundColor: palette.surface, borderRadius: 22, overflow: 'hidden' },
});
