import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BIOMES, LANDMARKS } from '../world/worldData';
import { palette, space, radius } from '../design/tokens';
import Icon from '../ui/Icon';

export default function LandmarksScreen({
  hoursReclaimed,
  dayNumber,
  onBack,
}: {
  hoursReclaimed: number;
  dayNumber: number;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Landmarks</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.lede}>
          Once raised, a landmark is permanent. Changing your theme re-skins the island but never takes
          anything down.
        </Text>

        <Text style={styles.sectionTitle}>Biomes</Text>
        <View style={styles.biomeRow}>
          {BIOMES.map((b) => {
            const open = dayNumber >= b.atDays;
            return (
              <View key={b.id} style={[styles.biome, open && styles.biomeOpen]}>
                <Text style={[styles.biomeName, open && styles.biomeNameOpen]}>{b.name}</Text>
                <Text style={styles.biomeMeta}>{open ? 'Open' : `Day ${b.atDays}`}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>All landmarks</Text>
        {LANDMARKS.map((l, i) => {
          const built = hoursReclaimed >= l.atHours;
          return (
            <Animated.View
              key={l.id}
              entering={FadeInDown.delay(i * 45).duration(340)}
              style={[styles.row, !built && styles.rowLocked]}
            >
              <Text style={[styles.glyph, !built && styles.glyphLocked]}>{l.glyph}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, !built && styles.nameLocked]}>{l.name}</Text>
                <Text style={styles.blurb}>{built ? l.blurb : `Raised at ${l.atHours} hours reclaimed.`}</Text>
              </View>
              {built ? (
                <View style={styles.builtPill}>
                  <Text style={styles.builtText}>Built</Text>
                </View>
              ) : (
                <Text style={styles.lockedAt}>{l.atHours}h</Text>
              )}
            </Animated.View>
          );
        })}
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
  headerTitle: { flex: 1, color: palette.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  scroll: { paddingHorizontal: 18, paddingBottom: 110 },
  lede: { color: palette.textSecondary, fontSize: 14.5, lineHeight: 21, marginTop: 8 },
  sectionTitle: { color: palette.text, fontSize: 19, fontWeight: '800', marginTop: 26, marginBottom: 14 },
  biomeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  biome: {
    flexGrow: 1,
    minWidth: '46%',
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  biomeOpen: { backgroundColor: 'rgba(124,245,176,0.1)', borderColor: 'rgba(124,245,176,0.3)' },
  biomeName: { color: palette.textSecondary, fontSize: 15, fontWeight: '700' },
  biomeNameOpen: { color: palette.accent },
  biomeMeta: { color: palette.textTertiary, fontSize: 12.5, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 15,
    marginBottom: 9,
  },
  rowLocked: { backgroundColor: 'rgba(255,255,255,0.025)' },
  glyph: { fontSize: 21, width: 28 },
  glyphLocked: { opacity: 0.28 },
  name: { color: palette.text, fontSize: 15.5, fontWeight: '700' },
  nameLocked: { color: palette.textSecondary },
  blurb: { color: palette.textTertiary, fontSize: 13, marginTop: 3, lineHeight: 18 },
  builtPill: { backgroundColor: 'rgba(124,245,176,0.16)', borderRadius: 13, paddingVertical: 5, paddingHorizontal: 11 },
  builtText: { color: palette.accent, fontSize: 12, fontWeight: '800' },
  lockedAt: { color: palette.textTertiary, fontSize: 13.5, fontWeight: '600' },
});
