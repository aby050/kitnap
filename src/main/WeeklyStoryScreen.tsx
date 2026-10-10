import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { CONTENT_H, CONTENT_W } from '../layout';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ProgressState,
  dailySeries,
  dateKey,
  formatDuration,
  formatSignedMinutes,
  sumRange,
  weeklyWindows,
} from '../data/progress';
import { buildWeeklyInsight } from './WeeklyInsight';
import { Sparkline } from './profile/viz';
import Icon, { IconName } from '../ui/Icon';
import { gradients, palette, radius, space } from '../design/tokens';
import { tapLight } from '../ui/haptics';

/**
 * The week, told one card at a time.
 *
 * The same numbers used to arrive as a scrolling page of widgets, which is a
 * report — you skim a report. A week is worth one sentence at a time: a story
 * gives each figure the whole screen for a moment, and the user leaves having
 * actually read four things instead of having scrolled past nine.
 *
 * Two rules hold this to the same standard as the rest of the app:
 *
 *   1. **A page only exists when its number does.** No zero states dressed up
 *      as achievements, no comparison against a week that never happened. A
 *      first week has fewer pages, and says so, rather than inventing a
 *      baseline to be measured against — which is exactly the habit the
 *      fabricated "58% down" came from.
 *   2. **Nothing here computes anything.** Every figure comes from
 *      `buildWeeklyInsight`, the same function the 7-day check-in reads, so
 *      the story and the check-in can never report different weeks.
 */

const SCREEN_W = CONTENT_W;

type Page = {
  key: string;
  /** Small line above the figure. */
  eyebrow: string;
  /** The figure itself — the thing the page exists for. */
  value: string;
  /** One sentence under it, in the app's own voice. */
  line: string;
  icon: IconName;
  tint: string;
  /** Optional trend drawn under the sentence. Absent when there is no series. */
  series?: number[];
};

export default function WeeklyStoryScreen({
  progress,
  goalLine,
  onClose,
}: {
  progress: ProgressState;
  goalLine?: string | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);

  const { pages, rangeLabel } = useMemo(() => {
    const today = dateKey();
    const windows = weeklyWindows(today);
    const d = buildWeeklyInsight(progress, today);
    const prev = sumRange(progress, windows.prevStart, windows.prevEnd);
    const series = dailySeries(progress, windows.thisStart, today);
    const hasPrev = prev.savedMinutes > 0 || prev.focusMinutes > 0 || prev.lockSessions > 0;

    const out: Page[] = [];

    if (d.savedMinutes > 0) {
      out.push({
        key: 'saved',
        eyebrow: 'YOU TOOK BACK',
        value: formatDuration(d.savedMinutes),
        line: hasPrev
          ? `${formatSignedMinutes(d.savedDelta)} against last week.`
          : goalLine
            ? `Time that went to ${goalLine} instead.`
            : 'Your first week of it.',
        icon: 'clock',
        tint: palette.accent,
        series: series.map((s) => s.savedMinutes),
      });
    }

    if (d.focusMinutes > 0) {
      out.push({
        key: 'focus',
        eyebrow: 'HEADS DOWN',
        value: formatDuration(d.focusMinutes),
        line:
          d.lockSessions > 0
            ? `Across ${d.lockSessions} session${d.lockSessions === 1 ? '' : 's'} you chose to start.`
            : 'Focused, on purpose.',
        icon: 'target',
        tint: palette.accent,
        series: series.map((s) => s.focusMinutes),
      });
    }

    if (d.distractionsBlocked > 0) {
      out.push({
        key: 'blocked',
        eyebrow: 'THE DOOR HELD',
        value: String(d.distractionsBlocked),
        line: `${d.distractionsBlocked === 1 ? 'One reach' : 'Times you reached'} for something and did not get in.`,
        icon: 'shield',
        tint: '#60A5FA',
        series: series.map((s) => s.distractionsBlocked),
      });
    }

    if (d.bestDayLabel) {
      out.push({
        key: 'bestday',
        eyebrow: 'YOUR BEST DAY',
        value: d.bestDayLabel,
        line: `${formatDuration(d.bestDayMinutes)} back on its own.`,
        icon: 'flame',
        tint: '#E9B23E',
      });
    }

    if (d.streak > 0) {
      out.push({
        key: 'streak',
        eyebrow: 'STILL GOING',
        value: `${d.streak} day${d.streak === 1 ? '' : 's'}`,
        line: 'Unbroken.',
        icon: 'flame',
        tint: '#E9B23E',
      });
    }

    const fmt = (k: string) => {
      const [, m, day] = k.split('-');
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      return `${Number(day)} ${months[Number(m) - 1]}`;
    };

    return { pages: out, rangeLabel: `${fmt(windows.thisStart)} — ${fmt(today)}` };
  }, [progress, goalLine]);

  // Nothing measured yet. One honest card beats five invented ones.
  if (pages.length === 0) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[...gradients.ground]}
          locations={[...gradients.groundLocations]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <Pressable onPress={onClose} style={styles.close} hitSlop={12}>
            <Icon name="close" size={18} color={palette.text} strokeWidth={2} />
          </Pressable>
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Nothing to tell yet</Text>
            <Text style={styles.emptyBody}>
              Your week starts counting the first time you block something or finish a session.
              Come back once there is something true to say about it.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const last = index >= pages.length;
  const page = pages[Math.min(index, pages.length - 1)];

  const go = (dir: 1 | -1) => {
    const next = index + dir;
    if (next < 0) return;
    if (next > pages.length) {
      onClose();
      return;
    }
    tapLight();
    setIndex(next);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...gradients.ground]}
        locations={[...gradients.groundLocations]}
        style={StyleSheet.absoluteFill}
      />

      {/* Tap targets sit under everything, full-bleed: the whole left half goes
          back, the whole right half goes on. Nobody should have to find a
          button to advance a story. */}
      <Pressable style={[styles.tapZone, styles.tapLeft]} onPress={() => go(-1)} />
      <Pressable style={[styles.tapZone, styles.tapRight]} onPress={() => go(1)} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.top} pointerEvents="box-none">
          <View style={styles.segments} pointerEvents="none">
            {[...pages, { key: 'recap' }].map((p, i) => (
              <View key={p.key} style={styles.segment}>
                <View style={[styles.segmentFill, i <= index && styles.segmentOn]} />
              </View>
            ))}
          </View>
          <Pressable onPress={onClose} style={styles.close} hitSlop={12}>
            <Icon name="close" size={18} color={palette.text} strokeWidth={2} />
          </Pressable>
        </View>

        {last ? (
          <Animated.View key="recap" entering={FadeIn.duration(260)} style={styles.body} pointerEvents="box-none">
            <Text style={styles.recapRange}>{rangeLabel}</Text>
            <Text style={styles.recapTitle}>Your week</Text>
            <View style={styles.recapList} pointerEvents="box-none">
              {pages.map((p) => (
                <View key={p.key} style={styles.recapRow}>
                  <View style={styles.recapLeft}>
                    <Text style={styles.recapValue}>{p.value}</Text>
                    <Text style={styles.recapLabel}>{p.eyebrow.toLowerCase()}</Text>
                  </View>
                  <View style={[styles.recapChip, { borderColor: `${p.tint}44`, backgroundColor: `${p.tint}14` }]}>
                    <Icon name={p.icon} size={13} color={p.tint} strokeWidth={2} />
                  </View>
                </View>
              ))}
            </View>
            <Pressable onPress={onClose} style={styles.done} hitSlop={8}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View key={page.key} entering={FadeIn.duration(260)} style={styles.body} pointerEvents="none">
            <Animated.Text entering={FadeInDown.duration(380)} style={styles.eyebrow}>
              {page.eyebrow}
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.delay(60).duration(420)}
              style={[styles.value, { color: page.tint }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {page.value}
            </Animated.Text>
            <Animated.Text entering={FadeInUp.delay(140).duration(420)} style={styles.line}>
              {page.line}
            </Animated.Text>
            {!!page.series && page.series.some((v) => v > 0) && (
              <Animated.View entering={FadeIn.delay(240).duration(420)} style={styles.spark}>
                <Sparkline values={page.series} width={SCREEN_W - space.xxl * 2} height={54} color={page.tint} />
              </Animated.View>
            )}
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.base },
  safe: { flex: 1 },
  tapZone: { position: 'absolute', top: 0, bottom: 0, width: '50%' },
  tapLeft: { left: 0 },
  tapRight: { right: 0 },

  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.lg, paddingTop: space.sm },
  segments: { flex: 1, flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' },
  segmentFill: { height: '100%', width: '100%', backgroundColor: 'transparent' },
  segmentOn: { backgroundColor: palette.text },
  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: palette.hairline,
  },

  body: { flex: 1, justifyContent: 'center', paddingHorizontal: space.xxl },
  eyebrow: { color: palette.textTertiary, fontSize: 11.5, fontWeight: '700', letterSpacing: 1.8, textAlign: 'center' },
  value: { fontSize: 76, lineHeight: 84, fontWeight: '700', letterSpacing: -3, textAlign: 'center', marginTop: 10 },
  line: {
    color: palette.text,
    fontSize: 19,
    lineHeight: 28,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 14,
  },
  spark: { marginTop: 40, alignItems: 'center' },

  recapRange: { color: palette.textTertiary, fontSize: 12.5, letterSpacing: 1.4, textAlign: 'center' },
  recapTitle: { color: palette.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.8, textAlign: 'center', marginTop: 6 },
  recapList: { marginTop: 30, gap: 2 },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.hairline,
  },
  recapLeft: { gap: 3 },
  recapValue: { color: palette.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  recapLabel: { color: palette.textTertiary, fontSize: 12.5 },
  recapChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  done: {
    marginTop: 34,
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: radius.pill,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentBorder,
  },
  doneText: { color: palette.accent, fontSize: 15.5, fontWeight: '700' },

  emptyWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: space.xxl },
  emptyTitle: { color: palette.text, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  emptyBody: { color: palette.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12 },
});
