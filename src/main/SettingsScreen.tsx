import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton, SettingRow } from '../components/ui';
import { colors } from '../theme';

const PRO_FEATURES = [
  { icon: '🛡', title: 'Tougher Apps Unblocking', sub: 'No Unblocks allowed for all rules' },
  { icon: '🔀', title: 'Create more rules' },
  { icon: '✅', title: 'Allowlist Blocking' },
  { icon: '🕘', title: 'Focus Score history' },
];

function Group({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.groupLabel}>{children}</Text>;
}

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
  difficultyLabel?: string;
  pinEnabled?: boolean;
}) {
  const [uninstallProtection, setUninstallProtection] = useState(false);
  const [blockWebsites, setBlockWebsites] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.planTitle}>You're on a Free Plan</Text>
          <Text style={styles.planSub}>
            Upgrade to focus better with <Text style={styles.planAccent}>⚡ Pro</Text>
          </Text>

          <View style={styles.proCard}>
            <LinearGradient
              colors={['rgba(60,90,70,0.35)', 'rgba(0,0,0,0)']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {PRO_FEATURES.map((f) => (
              <View key={f.title} style={styles.proRow}>
                <Text style={styles.proIcon}>{f.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.proTitle}>{f.title}</Text>
                  {f.sub ? <Text style={styles.proSub}>{f.sub}</Text> : null}
                </View>
              </View>
            ))}
            <View style={{ height: 8 }} />
            <GradientButton label="Try for ₹1,149" onPress={() => {}} />
          </View>
        </Animated.View>

        <GroupLabel>Account</GroupLabel>
        <Group>
          <SettingRow icon="👤" title="My Account" value={accountLabel ?? 'Not signed in'} onPress={onOpenAccount} last />
        </Group>

        <GroupLabel>Personalize</GroupLabel>
        <Group>
          <SettingRow icon="🔔" title="Notifications" value="On" />
          <SettingRow icon="🚫" title="Blocked Apps" subtitle="Which apps trigger the shield" onPress={onOpenBlockedApps} />
          <SettingRow icon="🎚" title="Unlock difficulty" value={difficultyLabel} subtitle="How hard it is to get past the shield" onPress={onOpenDifficulty} />
          <SettingRow icon="⚡" title="Block Screens" subtitle="Customize overlays when apps are blocked" onPress={onOpenBlockScreens} />
          <SettingRow icon="🕐" title="Waiting Room" subtitle="Customize the content you see during Waiting Room" onPress={onOpenWaitingRoom} />
          <SettingRow icon="🗓" title="Schedules" subtitle="Add or edit recurring block windows" onPress={onOpenSchedules} />
          <SettingRow icon="✨" title="Autofocus" subtitle="Configure distracting score interventions" onPress={onOpenAutofocus} />
          <SettingRow icon="💌" title="Message to future you" subtitle="Re-record what plays back on your 4th unlock" onPress={onOpenFutureSelf} last />
        </Group>

        <GroupLabel>Protection</GroupLabel>
        <Group>
          <SettingRow
            icon="🤝"
            title="Guardian"
            subtitle="A friend holds the code to loosen your own rules"
            onPress={onOpenGuardian}
          />
          <SettingRow icon="🔑" title="PIN code access" value={pinEnabled ? 'On' : 'Off'} onPress={onOpenPin} />
          <SettingRow icon="👥" title="Together" subtitle="Guardian and shared groves" onPress={onOpenTogether} last />
        </Group>

        <GroupLabel>Support</GroupLabel>
        <Group>
          <SettingRow icon="💬" title="Chat with Support" />
          <SettingRow icon="📖" title="Help Center" />
          <SettingRow icon="🎟" title="Emergency Pass" value="Available" />
          <SettingRow icon="↻" title="Reload" subtitle="Reapplies your rules and blocks if something isn't working." last />
        </Group>

        <GroupLabel>Integrations</GroupLabel>
        <Group>
          <SettingRow icon="💻" title="Desktop App" subtitle="Stay focused on your desktop" />
          <SettingRow icon="🔳" title="Connect Desktop" subtitle="Scan the code shown in the desktop app" last />
        </Group>

        <GroupLabel>Permissions</GroupLabel>
        <Group>
          <SettingRow icon="❤️" title="Health Data" subtitle="Access Steps and Sleep data" value="Connect" showChevron={false} last />
        </Group>

        <GroupLabel>Advanced</GroupLabel>
        <Group>
          <SettingRow
            icon="🔒"
            title="App Uninstall Protection"
            subtitle="Prevents the app from being deleted while blocking."
            right={
              <Switch
                value={uninstallProtection}
                onValueChange={setUninstallProtection}
                trackColor={{ true: colors.accent, false: 'rgba(255,255,255,0.2)' }}
                thumbColor="#fff"
              />
            }
          />
          <SettingRow icon="🔞" title="Adult Website Protection" />
          <SettingRow
            icon="🌐"
            title="Block Websites in Allow-Only Rules"
            subtitle="Blocks all websites during allow-only rules"
            right={
              <Switch
                value={blockWebsites}
                onValueChange={setBlockWebsites}
                trackColor={{ true: colors.accent, false: 'rgba(255,255,255,0.2)' }}
                thumbColor="#fff"
              />
            }
            last
          />
        </Group>

        <GroupLabel>Social</GroupLabel>
        <Group>
          <SettingRow icon="⇪" title="Share App" />
          <SettingRow icon="🎁" title="Enter Referral Code" last />
        </Group>

        <GroupLabel>Other</GroupLabel>
        <Group>
          <SettingRow icon="👥" title="Community Forum" />
          <SettingRow icon="↺" title="Restore Purchase" />
          <SettingRow icon="ℹ️" title="About" last />
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGlyph: { color: colors.text, fontSize: 19 },
  headerTitle: { flex: 1, color: colors.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  scroll: { paddingHorizontal: 18, paddingBottom: 110 },
  planTitle: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 14 },
  planSub: { color: colors.textDim, fontSize: 16, marginTop: 6 },
  planAccent: { color: colors.accent, fontWeight: '700' },
  proCard: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 24,
    padding: 18,
    marginTop: 18,
    overflow: 'hidden',
  },
  proRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  proIcon: { fontSize: 19, width: 26 },
  proTitle: { color: colors.text, fontSize: 16.5, fontWeight: '600' },
  proSub: { color: colors.textDim, fontSize: 14, marginTop: 3 },
  groupLabel: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: 30, marginBottom: 12 },
  group: { backgroundColor: 'rgba(255,255,255,0.045)', borderRadius: 22, overflow: 'hidden' },
});
