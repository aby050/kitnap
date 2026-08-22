import React, { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors } from '../theme';
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
import Medal from './profile/Medal';

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Awards</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.collected}>{earnedCount}/{ACHIEVEMENTS.length} collected</Text>
          <View style={styles.collectedTrack}>
            <View style={[styles.collectedBar, { width: `${Math.max(8, (earnedCount / ACHIEVEMENTS.length) * 100)}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.streakRow}>
          <View style={styles.flameWrap}>
            <Text style={styles.flame}>🔥</Text>
            <Text style={styles.flameCount}>{progress.currentStreak}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>Day Streak</Text>
            <Text style={styles.streakSub}>
              {progress.currentStreak > 0
                ? `${progress.currentStreak} days in a row you focused. Best: ${progress.bestStreak}.`
                : progress.bestStreak > 0
                  ? `Paused for now. Best streak is still ${progress.bestStreak} days.`
                  : 'Your first focused day lights the streak.'}
            </Text>
          </View>
        </Animated.View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {CATEGORIES.map((c) => (
            <Pressable key={c.key} onPress={() => setFilter(c.key)} style={[styles.filterChip, filter === c.key && styles.filterChipOn]}>
              <Text style={[styles.filterText, filter === c.key && styles.filterTextOn]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.grid}>
          {list.map((m, i) => {
            const earnedAt = earnedMap.get(m.id);
            const pct = achievementProgress(m, progress, joinedDays);
            return (
              <Animated.View key={m.id} entering={FadeIn.delay(i * 30).duration(280)} style={styles.gridItem}>
                <Pressable onPress={() => share(m)} style={{ alignItems: 'center' }}>
                  <Medal medal={m.medal} locked={!earnedAt} id={m.id} />
                  <Text style={styles.gemName} numberOfLines={1}>{m.name}</Text>
                  <Text style={styles.gemSub} numberOfLines={2}>
                    {earnedAt ? formatPrettyDate(earnedAt) : m.description}
                  </Text>
                  {!earnedAt && (
                    <View style={styles.miniTrack}>
                      <View style={[styles.miniBar, { width: `${pct * 100}%` }]} />
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, gap: 14 },
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
  collected: { color: colors.textDim, fontSize: 12.5 },
  collectedTrack: {
    width: 84,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 5,
    overflow: 'hidden',
  },
  collectedBar: { height: '100%', backgroundColor: colors.accent },
  scroll: { paddingHorizontal: 18, paddingBottom: 110 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20, marginBottom: 18 },
  flameWrap: { alignItems: 'center', justifyContent: 'center' },
  flame: { fontSize: 46 },
  flameCount: { position: 'absolute', bottom: 2, color: '#f5c542', fontSize: 19, fontWeight: '900' },
  streakTitle: { color: '#f5c542', fontSize: 23, fontWeight: '800' },
  streakSub: { color: '#e8d9a8', fontSize: 14.5, marginTop: 3, lineHeight: 20 },
  filterRow: { gap: 8, paddingBottom: 18 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  filterChipOn: { backgroundColor: 'rgba(124,245,176,0.14)', borderColor: 'rgba(124,245,176,0.4)' },
  filterText: { color: colors.textDim, fontWeight: '700', fontSize: 13 },
  filterTextOn: { color: colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '33.33%', alignItems: 'center', marginBottom: 28, paddingHorizontal: 4 },
  gemName: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  gemSub: { color: colors.textDim, fontSize: 11.5, marginTop: 3, textAlign: 'center', lineHeight: 15 },
  miniTrack: {
    width: 54,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
    overflow: 'hidden',
  },
  miniBar: { height: '100%', backgroundColor: colors.accent },
});
