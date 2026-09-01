import React, { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, space, radius } from '../design/tokens';
import Icon from '../ui/Icon';
import {
  ACHIEVEMENTS,
  AchievementCategory,
  AchievementDef,
  ProgressState,
  achievementProgress,
  daysSinceJoin,
  formatPrettyDate,
  shareMessage,
  totals,
} from '../data/progress';
import { TierThumb, TierConnector, GradientMeter } from './profile/viz';

const CATEGORIES: { key: AchievementCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'streak', label: 'Streaks' },
  { key: 'focus', label: 'Focus' },
  { key: 'saved', label: 'Saved' },
  { key: 'behavior', label: 'Behavior' },
];

export default function MilestonesScreen({
  onBack,
  progress,
  firstOpenDate,
}: {
  onBack: () => void;
  progress: ProgressState;
  firstOpenDate: string;
}) {
  const [filter, setFilter] = useState<AchievementCategory | 'all'>('all');
  const joinedDays = daysSinceJoin(firstOpenDate);
  const earnedMap = new Map(progress.achievements.map((a) => [a.id, a.earnedAt]));
  const earnedCount = progress.achievements.length;
  const t = totals(progress);
  const list = ACHIEVEMENTS.filter((a) => filter === 'all' || a.category === filter);
  // The first unearned tier in view is the one to chase — highlighted like the
  // "next reward" card in the reference.
  const nextIndex = list.findIndex((m) => !earnedMap.has(m.id));

  async function share(def: AchievementDef) {
    if (!earnedMap.has(def.id)) return;
    try {
      await Share.share({
        message: shareMessage(def, `Best streak ${progress.bestStreak} · ${Math.round(t.focusMinutes / 60)}h focused.`),
        title: def.name,
      });
    } catch {
      // User cancelled or share is unavailable.
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#04140D', '#000000', '#000000']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
            <Icon name="chevronLeft" size={20} color={palette.text} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Awards</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.collected}>{earnedCount}/{ACHIEVEMENTS.length}</Text>
            <View style={styles.collectedTrack}>
              <View style={[styles.collectedBar, { width: `${Math.max(8, (earnedCount / ACHIEVEMENTS.length) * 100)}%` }]} />
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Streak hero */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.streakCard}>
            <LinearGradient
              colors={['rgba(233,174,98,0.16)', 'rgba(233,174,98,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.flameWrap}>
              <Icon name="flame" size={30} color="#E9AE62" strokeWidth={1.8} />
              <Text style={styles.flameCount}>{progress.currentStreak}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakTitle}>Day Streak</Text>
              <Text style={styles.streakSub}>
                {progress.currentStreak > 0
                  ? `${progress.currentStreak} days in a row. Best: ${progress.bestStreak}.`
                  : progress.bestStreak > 0
                    ? `Paused for now. Best streak is still ${progress.bestStreak} days.`
                    : 'Your first focused day lights the streak.'}
              </Text>
            </View>
          </Animated.View>

          {/* Category filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {CATEGORIES.map((c) => (
              <Pressable key={c.key} onPress={() => setFilter(c.key)} style={[styles.filterChip, filter === c.key && styles.filterChipOn]}>
                <Text style={[styles.filterText, filter === c.key && styles.filterTextOn]}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Reward timeline */}
          <View style={styles.timeline}>
            {list.map((m, i) => {
              const earnedAt = earnedMap.get(m.id);
              const earned = !!earnedAt;
              const pct = achievementProgress(m, progress, joinedDays);
              const isNext = i === nextIndex;
              return (
                <View key={m.id}>
                  {i > 0 && <TierConnector />}
                  <Animated.View entering={FadeInDown.delay(Math.min(i, 8) * 45).duration(340)}>
                    <Pressable
                      onPress={() => share(m)}
                      style={[styles.tier, earned && styles.tierEarned, isNext && styles.tierNext]}
                    >
                      <TierThumb def={m} earned={earned} size={84} />
                      <View style={styles.tierBody}>
                        <View style={styles.tierEyebrowRow}>
                          <Text style={[styles.tierEyebrow, earned && styles.tierEyebrowEarned, isNext && styles.tierEyebrowNext]}>
                            {earned ? 'EARNED' : isNext ? 'NEXT UP' : m.statLabel.toUpperCase()}
                          </Text>
                          {earned && <Icon name="checkCircle" size={14} color={palette.accent} strokeWidth={2} />}
                        </View>
                        <Text style={styles.tierName} numberOfLines={1}>{m.name}</Text>
                        <Text style={styles.tierDesc} numberOfLines={2}>
                          {earned ? formatPrettyDate(earnedAt!) : m.description}
                        </Text>
                        <View style={styles.tierMeterRow}>
                          <GradientMeter
                            progress={earned ? 1 : pct}
                            colors={earned ? ['#8BEFBC', '#4FCB92'] : isNext ? ['#B9D97A', palette.accent] : ['#5FE0D6', '#8FA9FF']}
                            height={7}
                            style={{ flex: 1 }}
                          />
                          <Text style={styles.tierPct}>{earned ? '100%' : `${Math.round(pct * 100)}%`}</Text>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.base },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingVertical: space.sm, gap: space.md },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.glass, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: palette.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  collected: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '600' },
  collectedTrack: { width: 84, height: 4, borderRadius: 2, backgroundColor: palette.surfaceHigh, marginTop: 5, overflow: 'hidden' },
  collectedBar: { height: '100%', backgroundColor: palette.accent, borderRadius: 2 },
  scroll: { paddingHorizontal: space.gutter, paddingBottom: 110 },

  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.base,
    marginTop: space.base,
    marginBottom: space.lg,
    padding: space.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(233,174,98,0.24)',
    overflow: 'hidden',
  },
  flameWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(233,174,98,0.14)', alignItems: 'center', justifyContent: 'center' },
  flameCount: { position: 'absolute', bottom: 4, color: '#E9AE62', fontSize: 13, fontWeight: '900' },
  streakTitle: { color: '#E9AE62', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  streakSub: { color: palette.textSecondary, fontSize: 13.5, marginTop: 3, lineHeight: 19 },

  filterRow: { gap: space.sm, paddingBottom: space.lg },
  filterChip: { paddingHorizontal: space.base, paddingVertical: 8, borderRadius: radius.base, borderWidth: 1, borderColor: palette.border },
  filterChipOn: { backgroundColor: palette.accentSoft, borderColor: palette.accentBorder },
  filterText: { color: palette.textSecondary, fontWeight: '700', fontSize: 13 },
  filterTextOn: { color: palette.accent },

  timeline: { marginTop: space.xs },
  tier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.base,
    padding: space.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  tierEarned: { borderColor: palette.border, backgroundColor: palette.surfaceRaised },
  tierNext: { borderColor: palette.accentBorder, backgroundColor: 'rgba(111,227,169,0.06)' },
  tierBody: { flex: 1, gap: 5 },
  tierEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tierEyebrow: { color: palette.textTertiary, fontSize: 10.5, fontWeight: '800', letterSpacing: 1 },
  tierEyebrowEarned: { color: palette.accent },
  tierEyebrowNext: { color: '#B9D97A' },
  tierName: { color: palette.text, fontSize: 16.5, fontWeight: '800', letterSpacing: -0.3 },
  tierDesc: { color: palette.textSecondary, fontSize: 12.5, lineHeight: 17 },
  tierMeterRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 4 },
  tierPct: { color: palette.textTertiary, fontSize: 11, fontWeight: '700', width: 34, textAlign: 'right' },
});
