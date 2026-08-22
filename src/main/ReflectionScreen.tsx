import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  ProgressState,
  dailySeries,
  dateKey,
  formatDuration,
  formatSignedMinutes,
  sumRange,
  weekdayShort,
  weeklyWindows,
} from '../data/progress';
import { GateReflection } from '../data/store';
import { colors } from '../theme';

type Tab = 'week' | 'patterns' | 'words';

function relativeDay(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function heatColor(v: number) {
  if (v > 0.8) return '#ff8f6b';
  if (v > 0.55) return '#ffd36b';
  if (v > 0.3) return '#b6f5a0';
  return 'rgba(124,245,176,0.35)';
}

export default function ReflectionScreen({
  progress,
  gateReflections = [],
}: {
  progress: ProgressState;
  gateReflections?: GateReflection[];
}) {
  const [tab, setTab] = useState<Tab>('week');

  const today = dateKey();
  const windows = weeklyWindows(today);
  const week = sumRange(progress, windows.thisStart, today);
  const lastWeek = sumRange(progress, windows.prevStart, windows.prevEnd);
  const savedDelta = week.savedMinutes - lastWeek.savedMinutes;

  const stats = [
    { label: 'Requests you abandoned mid-gate', value: String(week.distractionsBlocked), good: true },
    { label: 'Unlocks granted', value: String(week.hardUnlocks), good: false },
    { label: 'Time reclaimed', value: formatDuration(week.savedMinutes), good: true },
    { label: 'Focus sessions completed', value: String(week.lockSessions), good: true },
  ];

  // Per-day focus across the last 7 days, normalised against the best day —
  // this is the honest version of what used to be a hardcoded hour-of-day
  // heatmap. We can't see hour-level timing, so we don't pretend to.
  const series = useMemo(() => dailySeries(progress, windows.thisStart, today), [progress, windows.thisStart, today]);
  const peak = Math.max(1, ...series.map((d) => d.focusMinutes + d.savedMinutes));
  const bestDay = series.reduce((best, d) => (d.savedMinutes > best.savedMinutes ? d : best), series[0]);

  const hasAnyData = week.savedMinutes > 0 || week.focusMinutes > 0 || week.lockSessions > 0;
  const words = [...gateReflections].reverse();

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
            {stats.map((s, i) => (
              <Animated.View key={s.label} entering={FadeInDown.delay(i * 60).duration(340)} style={styles.statRow}>
                <Text style={[styles.statValue, s.good && { color: colors.accent }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </Animated.View>
            ))}
            <View style={styles.callout}>
              <Text style={styles.calloutText}>
                {!hasAnyData
                  ? "Nothing logged yet this week. Once you start blocking distractions and running focus sessions, this fills in on its own."
                  : `Compared with last week, you've reclaimed ${formatSignedMinutes(savedDelta)}.`}
              </Text>
            </View>
          </Animated.View>
        )}

        {tab === 'patterns' && (
          <Animated.View entering={FadeIn.duration(320)}>
            <Text style={styles.lede}>
              Which days you actually held the line — not which apps. We can't see app names on iOS, and we'd
              rather say so than guess.
            </Text>
            {!hasAnyData ? (
              <View style={styles.callout}>
                <Text style={styles.calloutText}>No days recorded yet. Come back after a day or two of use.</Text>
              </View>
            ) : (
              <>
                <View style={styles.heatWrap}>
                  {series.map((d, i) => {
                    const v = (d.focusMinutes + d.savedMinutes) / peak;
                    return (
                      <Animated.View key={d.date} entering={FadeInDown.delay(i * 35).duration(320)} style={styles.heatCol}>
                        <View style={styles.heatTrack}>
                          <View
                            style={[
                              styles.heatBar,
                              { height: `${Math.max(6, v * 100)}%`, backgroundColor: heatColor(v) },
                            ]}
                          />
                        </View>
                        <Text style={styles.heatLabel}>{weekdayShort(d.date)}</Text>
                      </Animated.View>
                    );
                  })}
                </View>
                <View style={styles.callout}>
                  <Text style={styles.calloutText}>
                    {bestDay && bestDay.savedMinutes > 0
                      ? `Your strongest day was ${weekdayShort(bestDay.date)} — ${formatDuration(bestDay.savedMinutes)} reclaimed.`
                      : 'Still early. A pattern needs a few days before it means anything.'}
                  </Text>
                </View>
              </>
            )}
          </Animated.View>
        )}

        {tab === 'words' && (
          <Animated.View entering={FadeIn.duration(320)}>
            <Text style={styles.lede}>
              Everything you've typed at the gate. These come back to you later, in your own words.
            </Text>
            {words.length === 0 ? (
              <View style={styles.callout}>
                <Text style={styles.calloutText}>
                  Nothing written yet. The gate asks you to type a reason once friction kicks in — whatever you
                  write shows up here.
                </Text>
              </View>
            ) : (
              words.map((w, i) => (
                <Animated.View key={`${w.date}-${i}`} entering={FadeInDown.delay(i * 70).duration(340)} style={styles.wordCard}>
                  <Text style={styles.wordDate}>{relativeDay(w.date)}</Text>
                  <Text style={styles.wordText}>“{w.text}”</Text>
                  <Text style={styles.wordOutcome}>
                    {w.unlocked ? 'You went in anyway.' : 'You backed out. That one counted.'}
                  </Text>
                </Animated.View>
              ))
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
