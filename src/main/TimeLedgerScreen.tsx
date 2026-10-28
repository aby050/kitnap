import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LEDGER_UNITS, LANDMARKS } from '../world/worldData';
import { palette, space, radius } from '../design/tokens';
import Icon from '../ui/Icon';

/** Hours reclaimed → what they built. Abstract minutes mean nothing; "four
 *  proper walks" means something. */
export default function TimeLedgerScreen({
  hoursReclaimed,
  onBack,
}: {
  hoursReclaimed: number;
  onBack: () => void;
}) {
  const built = LANDMARKS.filter((l) => hoursReclaimed >= l.atHours);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Time Ledger</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
          <Text style={styles.heroValue}>{hoursReclaimed.toFixed(1)}h</Text>
          <Text style={styles.heroLabel}>reclaimed since day one</Text>
        </Animated.View>

        <Text style={styles.sectionTitle}>That's roughly</Text>
        {LEDGER_UNITS.map((u, i) => {
          const n = hoursReclaimed / u.per;
          return (
            <Animated.View key={u.label} entering={FadeInDown.delay(i * 70).duration(380)} style={styles.row}>
              <Text style={styles.rowGlyph}>{u.glyph}</Text>
              <Text style={styles.rowValue}>{n >= 10 ? Math.round(n) : n.toFixed(1)}</Text>
              <Text style={styles.rowLabel}>{u.label}</Text>
            </Animated.View>
          );
        })}

        <Text style={styles.sectionTitle}>Landmarks Built</Text>
        {built.length === 0 ? (
          <Text style={styles.empty}>Keep building focus. Your first landmark unlocks at 2 hours reclaimed.</Text>
        ) : (
          built.map((l, i) => (
            <Animated.View key={l.name} entering={FadeInDown.delay(i * 70).duration(380)} style={styles.builtRow}>
              <Text style={styles.builtGlyph}>{l.glyph}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.builtName}>{l.name}</Text>
                <Text style={styles.builtBlurb}>{l.blurb}</Text>
              </View>
              <Text style={styles.builtAt}>{l.atHours}h</Text>
            </Animated.View>
          ))
        )}

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Time reclaimed = focus sessions completed + time saved from turned-down distractions.
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
    backgroundColor: 'rgba(46,49,54,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: palette.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  scroll: { paddingHorizontal: 18, paddingBottom: 110 },
  hero: { alignItems: 'center', paddingVertical: 26 },
  heroValue: { color: palette.accent, fontSize: 56, fontWeight: '800' },
  heroLabel: { color: palette.textSecondary, fontSize: 15, marginTop: 4 },
  sectionTitle: { color: palette.text, fontSize: 19, fontWeight: '800', marginTop: 18, marginBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(46,49,54,0.045)',
    borderRadius: 18,
    padding: 15,
    marginBottom: 9,
  },
  rowGlyph: { fontSize: 19, width: 26 },
  rowValue: { color: palette.text, fontSize: 19, fontWeight: '800', minWidth: 46 },
  rowLabel: { flex: 1, color: palette.textSecondary, fontSize: 14, lineHeight: 20 },
  builtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(46,49,54,0.045)',
    borderRadius: 18,
    padding: 15,
    marginBottom: 9,
  },
  builtGlyph: { fontSize: 21, width: 28 },
  builtName: { color: palette.text, fontSize: 15.5, fontWeight: '700' },
  builtBlurb: { color: palette.textSecondary, fontSize: 13, marginTop: 3, lineHeight: 18 },
  builtAt: { color: palette.accent, fontSize: 14, fontWeight: '700' },
  empty: { color: palette.textTertiary, fontSize: 14.5, lineHeight: 21 },
  note: { marginTop: 22, padding: 16, borderRadius: 18, backgroundColor: 'rgba(46,49,54,0.04)' },
  noteText: { color: palette.textTertiary, fontSize: 13, lineHeight: 19 },
});
