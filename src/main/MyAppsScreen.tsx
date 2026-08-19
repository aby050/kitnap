import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../theme';

const RULES = [
  { name: 'Work Time', status: '4h left', active: true, emoji: '📹' },
  { name: 'Weekend Zen', status: 'Starts in 3d', active: false, emoji: '📹' },
];

const GROUPS = [
  { name: 'Always Allowed', count: '0 items', glyph: '▦' },
  { name: 'Never Allowed', count: '0 items', glyph: '🚫' },
  { name: 'Distracting', count: '1 item', glyph: '🔒' },
];

export default function MyAppsScreen({ onOpenGems }: { onOpenGems?: () => void }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Apps</Text>
          <Pressable onPress={onOpenGems}>
            <LinearGradient colors={['#8fe8ff', '#d9f77e']} style={styles.addBtn}>
              <Text style={styles.addGlyph}>+</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Blocked Apps</Text>
          <Pressable hitSlop={8}>
            <Text style={styles.actionLink}>Unblock All</Text>
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.blockedWrap}>
          <View style={styles.blockedTile}>
            <Text style={styles.lockGlyph}>🔒</Text>
          </View>
          <Text style={styles.blockedLabel}>Unblock</Text>
        </Animated.View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Rules ›</Text>
        </View>

        <View style={styles.rulesRow}>
          {RULES.map((rule, i) => (
            <Animated.View key={rule.name} entering={FadeInDown.delay(80 * i).duration(400)} style={styles.ruleCard}>
              {rule.active && (
                <LinearGradient
                  colors={['rgba(60,90,70,0.55)', 'rgba(20,25,22,0.2)']}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <View style={styles.ruleTop}>
                <Text style={styles.ruleCalendar}>🗓</Text>
                <Text style={styles.ruleArrow}>→</Text>
                <Text style={styles.ruleShield}>🛡</Text>
              </View>
              <View style={[styles.statusPill, rule.active && styles.statusPillActive]}>
                <Text style={styles.statusText}>{rule.status}</Text>
              </View>
              <Text style={styles.ruleName}>{rule.name}</Text>
              <Text style={styles.ruleAction}>Block {rule.emoji}</Text>
            </Animated.View>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Apps</Text>
        </View>

        <View style={styles.groupsRow}>
          {GROUPS.map((g) => (
            <View key={g.name} style={styles.groupCol}>
              <View style={styles.groupTile}>
                <Text style={styles.groupGlyph}>{g.glyph}</Text>
              </View>
              <Text style={styles.groupName} numberOfLines={2}>
                {g.name}
              </Text>
              <Text style={styles.groupCount}>{g.count}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 110 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { color: colors.text, fontSize: 34, fontWeight: '800' },
  addBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  addGlyph: { color: '#04240f', fontSize: 26, fontWeight: '700', marginTop: -2 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 14 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '700' },
  actionLink: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  blockedWrap: { alignItems: 'center', width: 76, marginBottom: 12 },
  blockedTile: {
    width: 66,
    height: 66,
    borderRadius: 18,
    backgroundColor: '#1e3a24',
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockGlyph: { fontSize: 24 },
  blockedLabel: { color: colors.accent, fontSize: 14, marginTop: 8, fontWeight: '600' },
  rulesRow: { flexDirection: 'row', gap: 14 },
  ruleCard: {
    flex: 1,
    aspectRatio: 0.95,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  ruleTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleCalendar: { fontSize: 19 },
  ruleArrow: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
  ruleShield: { fontSize: 19 },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statusPillActive: { backgroundColor: 'rgba(124,245,176,0.18)' },
  statusText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  ruleName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  ruleAction: { color: colors.textDim, fontSize: 14 },
  groupsRow: { flexDirection: 'row', gap: 14 },
  groupCol: { flex: 1, alignItems: 'center' },
  groupTile: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupGlyph: { fontSize: 30, opacity: 0.5 },
  groupName: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  groupCount: { color: colors.textDim, fontSize: 13, marginTop: 2 },
});
