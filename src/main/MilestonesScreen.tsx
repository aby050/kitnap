import React, { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { gradients, palette, space, radius } from '../design/tokens';
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

import { Button, Card, Pill } from '../design/primitives';
import { Modal } from 'react-native';

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
  const [selectedBadge, setSelectedBadge] = useState<AchievementDef | null>(null);
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
      <LinearGradient
        colors={[...gradients.ground]}
        locations={[...gradients.groundLocations]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10} accessibilityLabel="Back">
            <Icon name="chevronLeft" size={20} color={palette.text} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Milestones</Text>
          <Text style={styles.collected}>
            {earnedCount}/{ACHIEVEMENTS.length}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {ACHIEVEMENTS.map((m, i) => {
              const earnedAt = earnedMap.get(m.id);
              const earned = !!earnedAt;
              const pct = achievementProgress(m, progress, joinedDays);
              return (
                <Animated.View
                  key={m.id}
                  entering={FadeInDown.delay(Math.min(i, 10) * 35).duration(320)}
                  style={styles.cell}
                >
                  <Pressable
                    onPress={() => setSelectedBadge(m)}
                    style={[styles.badgeTile, earned && styles.badgeTileOn]}
                    accessibilityLabel={`${m.name}, ${earned ? 'earned' : `${Math.round(pct * 100)} percent`}`}
                  >
                    <TierThumb def={m} earned={earned} size={76} />
                    <Text style={styles.badgeName} numberOfLines={1}>
                      {m.name}
                    </Text>
                    <Text style={styles.badgeSub} numberOfLines={1}>
                      {earned ? `Earned ${new Date(earnedAt!).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : m.statLabel}
                    </Text>
                    {!earned && (
                      <View style={styles.badgeTrack}>
                        <View style={[styles.badgeFill, { width: `${Math.max(4, Math.round(pct * 100))}%` }]} />
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Reference-matched 3D Award Showcase Modal */}
      {selectedBadge && (
        <Modal
          visible={!!selectedBadge}
          animationType="fade"
          transparent
          onRequestClose={() => setSelectedBadge(null)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedBadge(null)} />
            
            <View style={styles.modalCard}>
              <LinearGradient
                colors={
                  selectedBadge.category === 'streak'
                    ? ['#FBE3C8', '#FDEFE0', '#FFF8F0']
                    : selectedBadge.category === 'focus'
                    ? ['#D8F0DA', '#E9F7EA', '#F6FCF6']
                    : selectedBadge.category === 'saved'
                    ? ['#FAEDC2', '#FCF4DA', '#FFFBEF']
                    : ['#EFE0F5', '#F6EDF9', '#FCF8FD']
                }
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFill}
              />
              
              <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedBadge(null)}>
                <Icon name="close" size={18} color={palette.textSecondary} />
              </Pressable>

              {/* 3D Front-Facing Badge Hero */}
              <View style={styles.modalBadgeHero}>
                <TierThumb def={selectedBadge} earned={earnedMap.has(selectedBadge.id)} size={176} />
              </View>

              {/* Title & Editorial Description */}
              <Text style={styles.modalTitle}>{selectedBadge.name}</Text>
              <Text style={styles.modalDesc}>{selectedBadge.description}</Text>

              {/* Unlocked Badge Status Pill */}
              <View style={styles.modalStatusRow}>
                {earnedMap.has(selectedBadge.id) ? (
                  <View style={styles.unlockedBadgePill}>
                    <Icon name="checkCircle" size={15} color={palette.accent} strokeWidth={2.2} />
                    <Text style={styles.unlockedBadgeText}>Badge Unlocked</Text>
                  </View>
                ) : (
                  <View style={styles.progressBadgePill}>
                    <Text style={styles.progressBadgeText}>
                      In Progress · {Math.round(achievementProgress(selectedBadge, progress, joinedDays) * 100)}%
                    </Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.modalActionRow}>
                {earnedMap.has(selectedBadge.id) ? (
                  <Button
                    label="Share Achievement"
                    variant="primary"
                    icon="share"
                    onPress={() => share(selectedBadge)}
                  />
                ) : (
                  <Button
                    label="Close"
                    variant="ghost"
                    onPress={() => setSelectedBadge(null)}
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.base },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingVertical: space.sm, gap: space.md },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.glass, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: palette.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  collected: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '600' },
  collectedTrack: { width: 84, height: 4, borderRadius: 2, backgroundColor: palette.surfaceHigh, marginTop: 5, overflow: 'hidden' },
  collectedBar: { height: '100%', backgroundColor: palette.accent, borderRadius: 2 },
  scroll: { paddingHorizontal: space.gutter, paddingBottom: 110, paddingTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47.8%' },
  badgeTile: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 4,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(46,49,54,0.85)',
    minHeight: 170,
  },
  badgeTileOn: { backgroundColor: '#FFF6EC', borderColor: '#2E3136' },
  badgeName: { color: palette.text, fontSize: 15, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  badgeSub: { color: palette.textTertiary, fontSize: 12.5, textAlign: 'center' },
  badgeTrack: { width: 54, height: 5, borderRadius: 3, backgroundColor: 'rgba(46,49,54,0.12)', marginTop: 6, overflow: 'hidden' },
  badgeFill: { height: '100%', borderRadius: 3, backgroundColor: palette.accent },

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
  tierNext: { borderColor: palette.accentBorder, backgroundColor: 'rgba(71,107,235,0.06)' },
  tierBody: { flex: 1, gap: 5 },
  tierEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tierEyebrow: { color: palette.textTertiary, fontSize: 10.5, fontWeight: '800', letterSpacing: 1 },
  tierEyebrowEarned: { color: palette.accent },
  tierEyebrowNext: { color: palette.accent },
  tierName: { color: palette.text, fontSize: 16.5, fontWeight: '800', letterSpacing: -0.3 },
  tierDesc: { color: palette.textSecondary, fontSize: 12.5, lineHeight: 17 },
  tierMeterRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 4 },
  tierPct: { color: palette.textTertiary, fontSize: 11, fontWeight: '700', width: 34, textAlign: 'right' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(46,49,54,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.gutter,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xxl,
    padding: space.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46,49,54,0.12)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 20,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: space.base,
    right: space.base,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46,49,54,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalBadgeHero: {
    marginTop: space.sm,
    marginBottom: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#2E3136',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: space.xs,
  },
  modalDesc: {
    color: 'rgba(46,49,54,0.72)',
    fontSize: 14.5,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: space.sm,
    marginBottom: space.lg,
  },
  modalStatusRow: {
    marginBottom: space.xl,
    alignItems: 'center',
  },
  unlockedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(71,107,235,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(71,107,235,0.3)',
  },
  unlockedBadgeText: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  progressBadgePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(46,49,54,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(46,49,54,0.14)',
  },
  progressBadgeText: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalActionRow: {
    width: '100%',
    marginTop: space.xs,
  },
});
