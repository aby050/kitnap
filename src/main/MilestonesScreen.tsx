import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors } from '../theme';

const MILESTONES = [
  { name: 'Invested', sub: '1/3 days' },
  { name: 'Steadfast', sub: '1/7 days' },
  { name: 'Radiant', sub: '1/30 days' },
  { name: 'Prismatic', sub: '1/60 days' },
  { name: 'Legendary', sub: '1/90 days' },
  { name: 'Consistent', sub: '1/100 days' },
  { name: 'Disciplined', sub: '1/150 days' },
  { name: 'Intentional', sub: '1/200 days' },
  { name: 'Dedicated', sub: '1/300 days' },
  { name: 'Tenacious', sub: '1/365 days' },
  { name: 'Transcendent', sub: '1/500 days' },
  { name: 'Immortal', sub: '1/1000 days' },
];

export default function MilestonesScreen({ onBack }: { onBack: () => void }) {
  const [showRating, setShowRating] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>MileStones</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.collected}>1/30 collected</Text>
          <View style={styles.collectedTrack}>
            <View style={styles.collectedBar} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.streakRow}>
          <View style={styles.flameWrap}>
            <Text style={styles.flame}>🔥</Text>
            <Text style={styles.flameCount}>1</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>Day Streak</Text>
            <Text style={styles.streakSub}>Days in a row you focused</Text>
          </View>
        </Animated.View>

        <View style={styles.grid}>
          {MILESTONES.map((m, i) => (
            <Animated.View key={m.name} entering={FadeIn.delay(i * 40).duration(320)} style={styles.gridItem}>
              <View style={styles.rawGem} />
              <View style={styles.pedestal} />
              <Text style={styles.gemName}>{m.name}</Text>
              <Text style={styles.gemSub}>{m.sub}</Text>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {showRating && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.ratingOverlay}>
          <View style={styles.ratingCard}>
            <View style={styles.ratingIcon}>
              <Text style={styles.ratingIconGlyph}>◯</Text>
            </View>
            <Text style={styles.ratingTitle}>Enjoying the app?</Text>
            <Text style={styles.ratingSub}>Tap a star to rate it on the App Store.</Text>
            <View style={styles.starsRow}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Pressable key={i} onPress={() => setShowRating(false)} hitSlop={6}>
                  <Text style={styles.star}>☆</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setShowRating(false)} style={styles.notNowBtn}>
              <Text style={styles.notNowText}>Not Now</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
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
  collectedBar: { width: '12%', height: '100%', backgroundColor: colors.accent },
  scroll: { paddingHorizontal: 18, paddingBottom: 110 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20, marginBottom: 30 },
  flameWrap: { alignItems: 'center', justifyContent: 'center' },
  flame: { fontSize: 46 },
  flameCount: { position: 'absolute', bottom: 2, color: '#f5c542', fontSize: 19, fontWeight: '900' },
  streakTitle: { color: '#f5c542', fontSize: 23, fontWeight: '800' },
  streakSub: { color: '#e8d9a8', fontSize: 14.5, marginTop: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '33.33%', alignItems: 'center', marginBottom: 32 },
  rawGem: { width: 44, height: 60, borderRadius: 10, backgroundColor: '#3d3d3d', transform: [{ rotate: '6deg' }] },
  pedestal: { width: 38, height: 6, borderRadius: 3, backgroundColor: '#0d0d0d', marginTop: 2 },
  gemName: { color: colors.text, fontSize: 14.5, fontWeight: '700', marginTop: 10 },
  gemSub: { color: colors.textDim, fontSize: 12.5, marginTop: 2 },
  ratingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 26,
  },
  ratingCard: {
    width: '100%',
    backgroundColor: 'rgba(38,38,38,0.98)',
    borderRadius: 26,
    padding: 22,
  },
  ratingIcon: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  ratingIconGlyph: { color: '#fff', fontSize: 30 },
  ratingTitle: { color: colors.text, fontSize: 21, fontWeight: '700' },
  ratingSub: { color: colors.textDim, fontSize: 15, marginTop: 8 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 26, marginBottom: 22 },
  star: { color: '#3b82f6', fontSize: 34 },
  notNowBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  notNowText: { color: colors.text, fontSize: 17, fontWeight: '600' },
});
