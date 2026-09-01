import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { Card, Editorial, Screen, SectionHeader, SegmentedControl, Stat } from '../design/primitives';
import { dataRamp, palette, radius, space, type } from '../design/tokens';

type Tab = 'week' | 'patterns' | 'words';

function relativeDay(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

/** Map a 0–1 focus intensity onto the shared data ramp (soft mint → lime →
 *  amber → coral for the busiest days). Hotter bar = more focus that day. */
function heatColor(v: number) {
  if (v > 0.8) return dataRamp[4];
  if (v > 0.55) return dataRamp[3];
  if (v > 0.3) return dataRamp[2];
  if (v > 0.12) return dataRamp[1];
  return dataRamp[0];
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
    { label: 'Requests abandoned mid-gate', value: String(week.distractionsBlocked), good: true },
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
    <Screen edges={['top']} bloom>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Reflection</Text>
        <Editorial lead="The record keeps itself." emphasis="Read it when you want." style={styles.voice} />

        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { label: 'This week', value: 'week' },
            { label: 'Patterns', value: 'patterns' },
            { label: 'Your words', value: 'words' },
          ]}
          style={styles.segment}
        />

        {tab === 'week' && (
          <Animated.View entering={FadeIn.duration(320)}>
            <Text style={styles.lede}>Honest, unflattering, and never pushed to you as a notification.</Text>
            <View style={styles.grid}>
              {stats.map((s, i) => (
                <Animated.View key={s.label} entering={FadeInDown.delay(i * 60).duration(340)} style={styles.gridItem}>
                  <Card raised style={styles.statCard}>
                    <Stat value={s.value} label={s.label} color={s.good ? palette.accent : palette.text} />
                  </Card>
                </Animated.View>
              ))}
            </View>
            <Card tone="accent" style={styles.callout}>
              <Text style={styles.calloutText}>
                {!hasAnyData
                  ? 'Nothing logged yet this week. Once you start blocking distractions and running focus sessions, this fills in on its own.'
                  : `Compared with last week, you've reclaimed ${formatSignedMinutes(savedDelta)}.`}
              </Text>
            </Card>
          </Animated.View>
        )}

        {tab === 'patterns' && (
          <Animated.View entering={FadeIn.duration(320)}>
            <Text style={styles.lede}>
              Which days you actually held the line — not which apps. We can't see app names on iOS, and we'd
              rather say so than guess.
            </Text>
            {!hasAnyData ? (
              <Card tone="accent" style={styles.callout}>
                <Text style={styles.calloutText}>No days recorded yet. Come back after a day or two of use.</Text>
              </Card>
            ) : (
              <>
                <Card style={styles.heatCard}>
                  <View style={styles.heatWrap}>
                    {series.map((d, i) => {
                      const v = (d.focusMinutes + d.savedMinutes) / peak;
                      return (
                        <Animated.View key={d.date} entering={FadeInDown.delay(i * 35).duration(320)} style={styles.heatCol}>
                          <View style={styles.heatTrack}>
                            <View
                              style={[styles.heatBar, { height: `${Math.max(6, v * 100)}%`, backgroundColor: heatColor(v) }]}
                            />
                          </View>
                          <Text style={styles.heatLabel}>{weekdayShort(d.date)}</Text>
                        </Animated.View>
                      );
                    })}
                  </View>
                </Card>
                <Card tone="accent" style={styles.callout}>
                  <Text style={styles.calloutText}>
                    {bestDay && bestDay.savedMinutes > 0
                      ? `Your strongest day was ${weekdayShort(bestDay.date)} — ${formatDuration(bestDay.savedMinutes)} reclaimed.`
                      : 'Still early. A pattern needs a few days before it means anything.'}
                  </Text>
                </Card>
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
              <Card tone="accent" style={styles.callout}>
                <Text style={styles.calloutText}>
                  Nothing written yet. The gate asks you to type a reason once friction kicks in — whatever you
                  write shows up here.
                </Text>
              </Card>
            ) : (
              words.map((w, i) => (
                <Animated.View key={`${w.date}-${i}`} entering={FadeInDown.delay(i * 70).duration(340)}>
                  <Card style={styles.wordCard}>
                    <Text style={[type.overline, styles.wordDate]}>{relativeDay(w.date)}</Text>
                    <Text style={styles.wordText}>“{w.text}”</Text>
                    <Text style={[styles.wordOutcome, { color: w.unlocked ? palette.textTertiary : palette.accent }]}>
                      {w.unlocked ? 'You went in anyway.' : 'You backed out. That one counted.'}
                    </Text>
                  </Card>
                </Animated.View>
              ))
            )}
          </Animated.View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.tabClearance },
  title: { ...type.title1 },
  voice: { marginTop: space.xxs, marginBottom: space.lg },
  segment: { marginBottom: space.xs },
  lede: { ...type.callout, color: palette.textSecondary, lineHeight: 21, marginTop: space.lg, marginBottom: space.base },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -space.xs },
  gridItem: { width: '50%', paddingHorizontal: space.xs, marginBottom: space.md },
  statCard: { minHeight: 104, justifyContent: 'center' },

  callout: { marginTop: space.base },
  calloutText: { ...type.callout, color: palette.text, lineHeight: 21 },

  heatCard: { paddingVertical: space.lg },
  heatWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xs, height: 176 },
  heatCol: { flex: 1, alignItems: 'center', gap: space.sm },
  heatTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  heatBar: { width: '100%', borderRadius: radius.sm },
  heatLabel: { ...type.caption, color: palette.textTertiary, fontWeight: '500' },

  wordCard: { marginBottom: space.md },
  wordDate: { color: palette.textTertiary },
  wordText: { ...type.quote, color: palette.text, marginTop: space.sm },
  wordOutcome: { ...type.sub, marginTop: space.sm },
});
