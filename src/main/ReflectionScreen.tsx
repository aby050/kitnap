import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors } from '../theme';

type Tab = 'week' | 'patterns' | 'words';

/** Apple returns opaque tokens, not app names — so the heatmap runs on time of
 *  day, never on "you opened Instagram 11 times". */
const HEAT = [
  { hour: '6a', v: 0.05 }, { hour: '8a', v: 0.2 }, { hour: '10a', v: 0.35 },
  { hour: '12p', v: 0.5 }, { hour: '2p', v: 0.42 }, { hour: '4p', v: 0.55 },
  { hour: '6p', v: 0.7 }, { hour: '8p', v: 0.85 }, { hour: '10p', v: 1.0 },
  { hour: '12a', v: 0.78 }, { hour: '2a', v: 0.3 }, { hour: '4a', v: 0.08 },
];

const WORDS = [
  { date: '2 days ago', text: 'just checking one thing', outcome: 'You stayed 34 minutes.' },
  { date: '4 days ago', text: "I'm bored and I don't want to start the report" },
  { date: '6 days ago', text: 'I want my evenings back' },
  { date: '9 days ago', text: "I'll feel exactly as empty as last time" },
];

const STATS = [
  { label: 'Requests you abandoned mid-gate', value: '14', good: true },
  { label: 'Unlocks granted', value: '9', good: false },
  { label: 'Time reclaimed', value: '4h 20m', good: true },
  { label: 'Emergency access used', value: '0 times', good: false },
];

export default function ReflectionScreen() {
  const [tab, setTab] = useState<Tab>('week');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Reflection</Text>

        <View style={styles.segment}>
          {(['week', 'patterns', 'words'] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.segItem, tab === t && styles.segItemActive]}>
              <Text style={[styles.segText, tab === t && styles.segTextActive]}>
                {t === 'week' ? 'This week' : t === 'patterns' ? 'Patterns' : 'Your words'}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'week' && (
          <Animated.View entering={FadeIn.duration(320)}>
            <Text style={styles.lede}>
              Honest, unflattering, and never pushed to you as a notification.
            </Text>
            {STATS.map((s, i) => (
              <Animated.View key={s.label} entering={FadeInDown.delay(i * 60).duration(340)} style={styles.statRow}>
                <Text style={[styles.statValue, s.good && { color: colors.accent }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </Animated.View>
            ))}
            <View style={styles.callout}>
              <Text style={styles.calloutText}>
                Your hardest hour is 10pm. Four of your nine unlocks happened after it.
              </Text>
            </View>
          </Animated.View>
        )}

        {tab === 'patterns' && (
          <Animated.View entering={FadeIn.duration(320)}>
            <Text style={styles.lede}>
              When you lose time — not which apps. We genuinely can't see the app names, and we'd rather say so.
            </Text>
            <View style={styles.heatWrap}>
              {HEAT.map((h, i) => (
                <Animated.View key={h.hour} entering={FadeInDown.delay(i * 35).duration(320)} style={styles.heatCol}>
                  <View style={styles.heatTrack}>
                    <View
                      style={[
                        styles.heatBar,
                        { height: `${Math.max(6, h.v * 100)}%`, backgroundColor: heatColor(h.v) },
                      ]}
                    />
                  </View>
                  <Text style={styles.heatLabel}>{h.hour}</Text>
                </Animated.View>
              ))}
            </View>
            <View style={styles.callout}>
              <Text style={styles.calloutText}>Late night is your weak spot. Consider a Sleep schedule.</Text>
            </View>
          </Animated.View>
        )}

        {tab === 'words' && (
          <Animated.View entering={FadeIn.duration(320)}>
            <Text style={styles.lede}>
              Everything you've typed at the gate. These come back to you later, in your own words.
            </Text>
            {WORDS.map((w, i) => (
              <Animated.View key={w.text} entering={FadeInDown.delay(i * 70).duration(340)} style={styles.wordCard}>
                <Text style={styles.wordDate}>{w.date}</Text>
                <Text style={styles.wordText}>“{w.text}”</Text>
                {w.outcome ? <Text style={styles.wordOutcome}>{w.outcome}</Text> : null}
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function heatColor(v: number) {
  if (v > 0.8) return '#ff8f6b';
  if (v > 0.55) return '#ffd36b';
  if (v > 0.3) return '#b6f5a0';
  return 'rgba(124,245,176,0.35)';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 110 },
  title: { color: colors.text, fontSize: 34, fontWeight: '800', marginBottom: 20 },
  segment: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 5 },
  segItem: { flex: 1, paddingVertical: 11, borderRadius: 20, alignItems: 'center' },
  segItemActive: { backgroundColor: 'rgba(255,255,255,0.11)' },
  segText: { color: colors.textDim, fontSize: 14.5, fontWeight: '600' },
  segTextActive: { color: colors.text },
  lede: { color: colors.textDim, fontSize: 14.5, lineHeight: 21, marginTop: 22, marginBottom: 18 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 10,
  },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '800', minWidth: 76 },
  statLabel: { flex: 1, color: colors.textDim, fontSize: 14, lineHeight: 20 },
  callout: { marginTop: 16, padding: 18, borderRadius: 20, backgroundColor: 'rgba(124,245,176,0.09)' },
  calloutText: { color: 'rgba(255,255,255,0.82)', fontSize: 14.5, lineHeight: 21 },
  heatWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 190 },
  heatCol: { flex: 1, alignItems: 'center', gap: 8 },
  heatTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  heatBar: { width: '100%', borderRadius: 4 },
  heatLabel: { color: colors.textFaint, fontSize: 10.5 },
  wordCard: { backgroundColor: 'rgba(255,255,255,0.045)', borderRadius: 20, padding: 18, marginBottom: 10 },
  wordDate: { color: colors.textFaint, fontSize: 12.5, fontWeight: '600' },
  wordText: { color: colors.text, fontSize: 16.5, fontWeight: '600', marginTop: 7, lineHeight: 23 },
  wordOutcome: { color: '#ffb08f', fontSize: 13.5, marginTop: 7 },
});
