import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import OpalOrb from '../components/OpalOrb';
import { colors } from '../theme';

function ModeChip({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.modeCol} onPress={onPress}>
      <View style={styles.modeChip}>
        <Text style={styles.modeIcon}>{icon}</Text>
        <View style={styles.modeBlur} />
      </View>
      <Text style={styles.modeLabel}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen({
  onOpenProfile,
  onOpenApps,
  onTriggerShield,
  onOpenEssentials,
  onStartFocus,
  onStartRest,
  onOpenSleepSchedule,
  unlockNumber,
}: {
  onOpenProfile: () => void;
  onOpenApps: () => void;
  onTriggerShield: () => void;
  onOpenEssentials: () => void;
  onStartFocus?: () => void;
  onStartRest?: () => void;
  onOpenSleepSchedule?: () => void;
  unlockNumber: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(0.33, { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, []);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(420)}>
          <Pressable onPress={onOpenProfile} style={styles.gemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.gemTitle}>INVESTED GEM</Text>
              <Text style={styles.gemSub}>Progress</Text>
              <View style={styles.gemTrack}>
                <Animated.View style={[styles.gemBarWrap, barStyle]}>
                  <LinearGradient
                    colors={['#d9f77e', '#9df5c0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
            </View>
            <View style={styles.rawGem} />
          </Pressable>
        </Animated.View>

        <View style={styles.orbSection}>
          <OpalOrb size={180} awake />
          <View style={styles.pedestal} />
          <Text style={styles.scoreTitle}>Analyzing Your Score…</Text>
          <Text style={styles.scoreSub}>58 minutes left</Text>
        </View>

        <View style={styles.modesRow}>
          <ModeChip icon="🌙" label="Sleep" onPress={onOpenSleepSchedule} />
          <ModeChip icon="⏳" label="Focus" onPress={onStartFocus} />
          <ModeChip icon="🌳" label="Rest" onPress={onStartRest} />
        </View>

        <Pressable onPress={onOpenApps} style={styles.appsCard}>
          <View style={styles.appsHeader}>
            <Text style={styles.appsHeaderText}>My Apps</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
          <View style={styles.ruleRow}>
            <Text style={styles.shield}>🛡</Text>
            <View>
              <Text style={styles.ruleName}>Work Time</Text>
              <Text style={styles.ruleSub}>1 app blocked</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.blockedRow}>
            <View style={styles.blockedIcon}>
              <Text style={styles.lockGlyph}>🔒</Text>
            </View>
            <View style={styles.unblockPill}>
              <Text style={styles.unblockText}>🔓 Unblock Apps</Text>
            </View>
          </View>
        </Pressable>

        <Pressable onPress={onTriggerShield} style={styles.shieldDemo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shieldDemoTitle}>Open a blocked app</Text>
            <Text style={styles.shieldDemoSub}>
              Next request is unlock #{unlockNumber} today
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable onPress={onOpenEssentials} style={styles.essentialsRow}>
          <Text style={styles.essentialsGlyph}>🆘</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.essentialsTitle}>Essentials & emergency access</Text>
            <Text style={styles.essentialsSub}>Never blocked. Never charged.</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 110 },
  gemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 18,
  },
  gemTitle: { color: colors.accent, fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  gemSub: { color: colors.textDim, fontSize: 13.5, marginTop: 2 },
  gemTrack: {
    height: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: 12,
    overflow: 'hidden',
  },
  gemBarWrap: { height: '100%', borderRadius: 5, overflow: 'hidden' },
  rawGem: {
    width: 42,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#4a4a4a',
    transform: [{ rotate: '8deg' }],
  },
  orbSection: { alignItems: 'center', marginTop: 26 },
  pedestal: { width: 82, height: 12, borderRadius: 6, backgroundColor: '#0d0d0d', marginTop: -6 },
  scoreTitle: { color: 'rgba(255,255,255,0.85)', fontSize: 19, fontWeight: '700', marginTop: 20 },
  scoreSub: { color: colors.textDim, fontSize: 14.5, marginTop: 4 },
  modesRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 26 },
  modeCol: { alignItems: 'center', gap: 8 },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.28)',
  },
  modeIcon: { fontSize: 16 },
  modeBlur: { width: 26, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.13)' },
  modeLabel: { color: colors.text, fontSize: 14.5, fontWeight: '600' },
  appsCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 18, marginTop: 28 },
  appsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  appsHeaderText: { color: colors.text, fontSize: 17, fontWeight: '700' },
  chevron: { color: colors.textFaint, fontSize: 19 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shield: { fontSize: 20 },
  ruleName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  ruleSub: { color: colors.textDim, fontSize: 14, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
  blockedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  blockedIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1e3a24',
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockGlyph: { fontSize: 20 },
  unblockPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 11,
    paddingHorizontal: 18,
  },
  unblockText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  shieldDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,245,176,0.09)',
    borderRadius: 22,
    padding: 18,
    marginTop: 14,
  },
  shieldDemoTitle: { color: colors.accent, fontSize: 16.5, fontWeight: '700' },
  shieldDemoSub: { color: colors.textDim, fontSize: 13.5, marginTop: 3 },
  essentialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 22,
    padding: 18,
    marginTop: 12,
  },
  essentialsGlyph: { fontSize: 19 },
  essentialsTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  essentialsSub: { color: colors.textDim, fontSize: 13.5, marginTop: 3 },
});
