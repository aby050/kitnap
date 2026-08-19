import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import WorldRing from '../world/WorldRing';
import { LANDMARKS, weatherFor, WEATHER_COPY } from '../world/worldData';
import { ThemeKey } from '../data/themes';
import { colors } from '../theme';

export default function WorldScreen({
  themeKey,
  hoursReclaimed,
  reclaimedToday,
  unlocksToday,
  dayNumber,
  goalLine,
  onOpenLedger,
  onOpenLandmarks,
  onOpenSeasons,
  onTriggerShield,
  onOpenEssentials,
}: {
  themeKey: ThemeKey;
  hoursReclaimed: number;
  reclaimedToday: number;
  unlocksToday: number;
  dayNumber: number;
  goalLine?: string;
  onOpenLedger: () => void;
  onOpenLandmarks: () => void;
  onOpenSeasons: () => void;
  onTriggerShield: () => void;
  onOpenEssentials: () => void;
}) {
  const weather = weatherFor(reclaimedToday, unlocksToday, new Date().getHours());
  const built = LANDMARKS.filter((l) => hoursReclaimed >= l.atHours);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(420)} style={styles.headline}>
          <Text style={styles.today}>
            {reclaimedToday > 0 ? `${reclaimedToday} minutes back today` : 'Day ' + dayNumber}
          </Text>
          <Text style={styles.weather}>{WEATHER_COPY[weather]}</Text>
          {goalLine ? <Text style={styles.goal}>Building toward: {goalLine}</Text> : null}
        </Animated.View>

        <Animated.View entering={FadeIn.delay(150).duration(500)} style={styles.ringSection}>
          <WorldRing themeKey={themeKey} hoursReclaimed={hoursReclaimed} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).duration(420)} style={styles.row}>
          <Pressable onPress={onOpenLedger} style={styles.tile}>
            <Text style={styles.tileValue}>{hoursReclaimed.toFixed(0)}h</Text>
            <Text style={styles.tileLabel}>Time Ledger</Text>
          </Pressable>
          <Pressable onPress={onOpenLandmarks} style={styles.tile}>
            <Text style={styles.tileValue}>
              {built.length}
              <Text style={styles.tileOf}>/{LANDMARKS.length}</Text>
            </Text>
            <Text style={styles.tileLabel}>Landmarks</Text>
          </Pressable>
          <Pressable onPress={onOpenSeasons} style={styles.tile}>
            <Text style={styles.tileValue}>🐚</Text>
            <Text style={styles.tileLabel}>Seasons</Text>
          </Pressable>
        </Animated.View>

        <Pressable onPress={onTriggerShield} style={styles.shieldDemo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shieldTitle}>Open a blocked app</Text>
            <Text style={styles.shieldSub}>Next request is unlock #{unlocksToday + 1} today</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable onPress={onOpenEssentials} style={styles.essentials}>
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
  scroll: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 110 },
  headline: { alignItems: 'center', marginTop: 6 },
  today: { color: colors.text, fontSize: 24, fontWeight: '800' },
  weather: { color: colors.textDim, fontSize: 15, marginTop: 6 },
  goal: { color: colors.accent, fontSize: 13.5, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  ringSection: { marginTop: 22, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 10, marginTop: 26 },
  tile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  tileValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  tileOf: { color: colors.textFaint, fontSize: 14, fontWeight: '600' },
  tileLabel: { color: colors.textDim, fontSize: 12.5, marginTop: 5 },
  shieldDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,245,176,0.09)',
    borderRadius: 22,
    padding: 18,
    marginTop: 14,
  },
  shieldTitle: { color: colors.accent, fontSize: 16.5, fontWeight: '700' },
  shieldSub: { color: colors.textDim, fontSize: 13.5, marginTop: 3 },
  essentials: {
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
  chevron: { color: colors.textFaint, fontSize: 20 },
});
