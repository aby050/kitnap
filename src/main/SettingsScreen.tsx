import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingRow } from '../components/ui';
import { palette } from '../design/tokens';
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
  onOpenAutofocus,
  onOpenSchedules,
  onOpenPin,
  onOpenAccount,
  accountLabel,
  onOpenFutureSelf,
  onOpenTogether,
  onOpenBlockedApps,
  onOpenDifficulty,
  onOpenDeleteAccount,
  difficultyLabel,
  pinEnabled,
}: {
  onBack: () => void;
  onOpenGuardian?: () => void;
  onOpenWaitingRoom?: () => void;
  onOpenBlockScreens?: () => void;
  onOpenAutofocus?: () => void;
  onOpenSchedules?: () => void;
  onOpenPin?: () => void;
  onOpenAccount?: () => void;
  accountLabel?: string;
  onOpenFutureSelf?: () => void;
  onOpenTogether?: () => void;
  onOpenBlockedApps?: () => void;
  onOpenDifficulty?: () => void;
  onOpenDeleteAccount?: () => void;
  difficultyLabel?: string;
  pinEnabled?: boolean;
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
            icon={<RowIcon name="eye" />}
            title="Block Screens"
            subtitle="Customize overlays when apps are blocked"
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
          />
          <SettingRow
            icon={<RowIcon name="target" />}
            title="Autofocus"
            subtitle="Configure distracting score interventions"
            onPress={onOpenAutofocus}
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

        <GroupLabel>Protection</GroupLabel>
        <Group>
          <SettingRow
            icon={<RowIcon name="key" />}
            title="Guardian"
            subtitle="A friend holds the code to loosen your own rules"
            onPress={onOpenGuardian}
          />
          <SettingRow
            icon={<RowIcon name="lock" />}
            title="PIN code access"
            value={pinEnabled ? 'On' : 'Off'}
            onPress={onOpenPin}
          />
          <SettingRow
            icon={<RowIcon name="heart" />}
            title="Together"
            subtitle="Guardian and shared groves"
            onPress={onOpenTogether}
            last
          />
        </Group>

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
            last
          />
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8 },
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
