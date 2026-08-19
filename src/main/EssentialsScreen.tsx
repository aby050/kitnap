import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ESSENTIALS } from '../data/gateQuestions';
import { colors } from '../theme';

/** Ships default-on with banking and OTP apps whitelisted — a blocked OTP is a
 *  failed payment and a one-star review. */
export default function EssentialsScreen({ onBack }: { onBack: () => void }) {
  const [on, setOn] = useState<Record<string, boolean>>(
    Object.fromEntries(ESSENTIALS.map((e) => [e.name, true])),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Essentials</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          These are never blocked, never counted, and never ask you a question. Emergency calls work during
          every block at every intensity — that part is enforced by iOS, not by us.
        </Text>

        <View style={styles.card}>
          {ESSENTIALS.map((e, i) => (
            <Animated.View
              key={e.name}
              entering={FadeInDown.delay(i * 40).duration(320)}
              style={[styles.row, i < ESSENTIALS.length - 1 && styles.rowBorder]}
            >
              <Text style={styles.glyph}>{e.glyph}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{e.name}</Text>
                {e.note ? <Text style={styles.note}>{e.note}</Text> : null}
              </View>
              {e.locked ? (
                <View style={styles.lockedPill}>
                  <Text style={styles.lockedText}>Always</Text>
                </View>
              ) : (
                <Switch
                  value={on[e.name]}
                  onValueChange={(v) => setOn((p) => ({ ...p, [e.name]: v }))}
                  trackColor={{ true: colors.accent, false: 'rgba(255,255,255,0.2)' }}
                  thumbColor="#fff"
                />
              )}
            </Animated.View>
          ))}
        </View>

        <View style={styles.breakGlass}>
          <Text style={styles.breakGlassTitle}>🆘  Break-glass</Text>
          <Text style={styles.breakGlassBody}>
            Every block screen has an Emergency button in the corner. One tap unblocks everything for 15
            minutes. Zero questions, no delay, no payment — at every intensity, forever.
          </Text>
          <Text style={styles.breakGlassMeta}>Used 0 times this week.</Text>
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
  intro: { color: colors.textDim, fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 22 },
  card: { backgroundColor: 'rgba(255,255,255,0.045)', borderRadius: 22, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  glyph: { fontSize: 19, width: 26 },
  name: { color: colors.text, fontSize: 16, fontWeight: '600' },
  note: { color: colors.textFaint, fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  lockedPill: { backgroundColor: 'rgba(124,245,176,0.16)', borderRadius: 14, paddingVertical: 6, paddingHorizontal: 12 },
  lockedText: { color: colors.accent, fontSize: 12.5, fontWeight: '700' },
  breakGlass: { marginTop: 24, padding: 18, borderRadius: 22, backgroundColor: 'rgba(124,245,176,0.08)' },
  breakGlassTitle: { color: colors.accent, fontSize: 16.5, fontWeight: '800' },
  breakGlassBody: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 21, marginTop: 8 },
  breakGlassMeta: { color: colors.textFaint, fontSize: 13, marginTop: 12 },
});
