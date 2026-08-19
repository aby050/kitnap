import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { EVENTS } from '../world/worldData';
import { colors } from '../theme';

/** Placed deliberately at the known week-4 decay cliff. Rare events are never
 *  purchasable — that's the whole point of them. */
export default function SeasonsScreen({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Seasons & Events</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.lede}>What's coming to the island, and what you'd miss.</Text>

        {EVENTS.map((e, i) => (
          <Animated.View
            key={e.id}
            entering={FadeInDown.delay(i * 80).duration(380)}
            style={[styles.card, e.rare && styles.cardRare]}
          >
            <View style={styles.cardTop}>
              <Text style={styles.glyph}>{e.glyph}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{e.name}</Text>
                  {e.rare && (
                    <View style={styles.rarePill}>
                      <Text style={styles.rareText}>RARE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.window}>{e.window}</Text>
              </View>
            </View>
            <Text style={styles.blurb}>{e.blurb}</Text>
          </Animated.View>
        ))}

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Events can't be bought, skipped or rushed. If you miss one it comes back — nothing here is a
            limited-time offer.
          </Text>
        </View>
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
  lede: { color: colors.textDim, fontSize: 14.5, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  card: { backgroundColor: 'rgba(255,255,255,0.045)', borderRadius: 22, padding: 17, marginBottom: 11 },
  cardRare: { backgroundColor: 'rgba(140,120,255,0.11)', borderWidth: 1, borderColor: 'rgba(160,140,255,0.28)' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  glyph: { fontSize: 26 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: colors.text, fontSize: 17, fontWeight: '700' },
  rarePill: { backgroundColor: 'rgba(180,160,255,0.25)', borderRadius: 9, paddingVertical: 3, paddingHorizontal: 8 },
  rareText: { color: '#c9bcff', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  window: { color: colors.textDim, fontSize: 13, marginTop: 3 },
  blurb: { color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 20.5, marginTop: 12 },
  note: { marginTop: 14, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)' },
  noteText: { color: colors.textFaint, fontSize: 13, lineHeight: 19 },
});
