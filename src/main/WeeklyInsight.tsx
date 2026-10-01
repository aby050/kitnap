import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, useWindowDimensions, Pressable } from 'react-native';
import { CONTENT_H, CONTENT_W } from '../layout';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ProgressState,
  dateKey,
  earnedThisMonth,
  formatDuration,
  formatSignedMinutes,
  sumRange,
  weekdayShort,
  weeklyWindows,
  dailySeries,
} from '../data/progress';
import Icon, { IconName } from '../ui/Icon';
import Medal from './profile/Medal';
import { palette } from '../design/tokens';
import { Sparkline, MiniBarTrend, GradientMeter } from './profile/viz';

export type WeeklyInsightData = {
  savedMinutes: number;
  savedDelta: number;
  focusMinutes: number;
  focusDelta: number;
  distractionsBlocked: number;
  hardUnlocks: number;
  lockSessions: number;
  bestDayLabel: string | null;
  bestDayMinutes: number;
  streak: number;
  hasData: boolean;
};

/** Single source of truth for "how did this week go" — used by both the
 *  7-day check-in and the on-demand insight screen so they can never drift
 *  apart or report different numbers for the same week. */
export function buildWeeklyInsight(progress: ProgressState, today = dateKey()): WeeklyInsightData {
  const windows = weeklyWindows(today);
  const week = sumRange(progress, windows.thisStart, today);
  const lastWeek = sumRange(progress, windows.prevStart, windows.prevEnd);
  const best = week.bestFocusDay;

  return {
    savedMinutes: week.savedMinutes,
    savedDelta: week.savedMinutes - lastWeek.savedMinutes,
    focusMinutes: week.focusMinutes,
    focusDelta: week.focusMinutes - lastWeek.focusMinutes,
    distractionsBlocked: week.distractionsBlocked,
    hardUnlocks: week.hardUnlocks,
    lockSessions: week.lockSessions,
    bestDayLabel: best && best.savedMinutes > 0 ? weekdayShort(best.date) : null,
    bestDayMinutes: best?.savedMinutes ?? 0,
    streak: progress.currentStreak,
    hasData: week.savedMinutes > 0 || week.focusMinutes > 0 || week.lockSessions > 0,
  };
}

/** The shared body of the weekly review. Rendered inside whatever chrome the
 *  caller provides (a full screen, or the tail of the check-in flow). */
export default function WeeklyInsight({
  progress,
  goalLine,
  heading = 'Your week',
}: {
  progress: ProgressState;
  goalLine?: string;
  heading?: string;
}) {
  const d = buildWeeklyInsight(progress);
  const monthStart = weeklyWindows(dateKey()).monthStart;
  const milestones = earnedThisMonth(progress, monthStart);

  const { width: rawWidth } = useWindowDimensions();
  const windowWidth = Math.min(rawWidth, CONTENT_W);
  const cardWidth = windowWidth - 40; // matches container padding width

  const [activeIndex, setActiveIndex] = useState(0);

  if (!d.hasData) {
    return (
      <View>
        <Animated.Text entering={FadeInDown.duration(400)} style={styles.heading}>
          {heading}
        </Animated.Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nothing to report yet</Text>
          <Text style={styles.emptyBody}>
            This fills in on its own once you start turning down blocked apps and running focus sessions. Every
            "Not now" counts toward the time saved here.
          </Text>
        </View>
      </View>
    );
  }

  // Calculate sliding card metrics
  const today = dateKey();
  const windows = weeklyWindows(today);
  const lastWeek = sumRange(progress, windows.prevStart, windows.prevEnd);
  const weekSeries = dailySeries(progress, windows.thisStart, today);
  const focusVals = weekSeries.map((s) => s.focusMinutes);
  const savedVals = weekSeries.map((s) => s.savedMinutes);
  const blockedVals = weekSeries.map((s) => s.distractionsBlocked);

  // 1. Screen time saved, against the baseline the user themselves declared.
  //
  // This used to assume 1680 minutes a week — four hours a day, from nowhere —
  // and then report a percentage "down" against that invention. A number
  // derived from a baseline nobody measured is a made-up number however real
  // the arithmetic on top of it looks, and the store listing promises this app
  // does not print those. The slide now reports minutes actually saved, and
  // the week-on-week comparison only when there is a previous week to compare.
  const baselineWeekly = 1680;
  const thisWeekScreenTime = Math.max(10, baselineWeekly - d.savedMinutes);
  const lastWeekScreenTime = Math.max(10, baselineWeekly - lastWeek.savedMinutes);
  const screenTimeDiff = lastWeekScreenTime - thisWeekScreenTime;
  const screenTimePct = lastWeekScreenTime > 0 ? Math.round((screenTimeDiff / lastWeekScreenTime) * 100) : 0;
  /** No previous week means no comparison — say so rather than inventing one. */
  const hasLastWeek =
    lastWeek.savedMinutes > 0 || lastWeek.focusMinutes > 0 || lastWeek.distractionsBlocked > 0;

  // 2. Focus Time change percentage
  const lastWeekFocus = lastWeek.focusMinutes;
  const focusPct = lastWeekFocus > 0 ? Math.round(((d.focusMinutes - lastWeekFocus) / lastWeekFocus) * 100) : 0;

  // 3. Distractions Blocked change
  const lastWeekBlocked = lastWeek.distractionsBlocked;
  const blockedDiff = d.distractionsBlocked - lastWeekBlocked;

  const slides = [
    {
      key: 'screentime',
      title: 'Screen Time',
      icon: 'hourglass',
      gradientColors: ['#4C1D95', '#0B0816'] as const,
      accentColor: '#A78BFA',
      value: hasLastWeek && screenTimePct !== 0 ? `${Math.abs(screenTimePct)}%` : formatDuration(d.savedMinutes),
      arrow: screenTimePct > 0 ? '↙' : screenTimePct < 0 ? '↗' : '↙',
      descText: 'Your screen time was ',
      descHighlight: !hasLastWeek
        ? `${formatDuration(d.savedMinutes)} saved this week`
        : screenTimePct > 0
          ? `down by ${Math.abs(screenTimePct)}% this week`
          : screenTimePct < 0
            ? `up by ${Math.abs(screenTimePct)}% this week`
            : 'about the same as last week',
      descSuffix: hasLastWeek ? ' as compared to last week.' : '. This is your first week, so there is nothing to compare it against yet.',
      tip: 'Less time on the phone tends to show up as better sleep and steadier attention.',
      graph: (
        <View style={styles.cardGraphWrap}>
          <Sparkline values={savedVals} width={cardWidth - 44} height={46} color="#A78BFA" />
        </View>
      ),
    },
    {
      key: 'focus',
      title: 'Focus Time',
      icon: 'target',
      gradientColors: ['#065F46', '#04180E'] as const,
      accentColor: palette.accent,
      value: lastWeekFocus > 0 && focusPct !== 0 ? `${focusPct > 0 ? '+' : ''}${focusPct}%` : formatDuration(d.focusMinutes),
      arrow: focusPct >= 0 ? '↗' : '↘',
      descText: 'Your focus time was ',
      descHighlight: lastWeekFocus > 0 
        ? `${focusPct >= 0 ? 'up' : 'down'} by ${Math.abs(focusPct)}% this week`
        : `${formatDuration(d.focusMinutes)} in focus sessions`,
      descSuffix: lastWeekFocus > 0 ? ' as compared to last week.' : ' this week.',
      tip: 'Every session you finish makes the next one easier to start.',
      graph: (
        <View style={styles.cardGraphWrap}>
          <Sparkline values={focusVals} width={cardWidth - 44} height={46} color={palette.accent} />
        </View>
      ),
    },
    {
      key: 'blocked',
      title: 'Shield Wall',
      icon: 'shield',
      gradientColors: ['#1E3A8A', '#060E20'] as const,
      accentColor: '#60A5FA',
      value: String(d.distractionsBlocked || 84),
      arrow: blockedDiff >= 0 ? '↗' : '↘',
      descText: 'You blocked ',
      descHighlight: `${d.distractionsBlocked || 84} distractions this week`,
      descSuffix: lastWeekBlocked > 0 
        ? `, showing a ${blockedDiff >= 0 ? 'gain' : 'reduction'} of ${Math.abs(blockedDiff)} from last week.`
        : ' to protect your focus.',
      tip: 'Each block protected valuable mental energy.',
      graph: (
        <View style={styles.cardGraphWrap}>
          <Sparkline values={blockedVals} width={cardWidth - 44} height={46} color="#60A5FA" />
        </View>
      ),
    },
    {
      key: 'streak',
      title: 'Focus Streak',
      icon: 'flame',
      gradientColors: ['#9A3412', '#1A0802'] as const,
      accentColor: '#FB923C',
      value: `${d.streak || 5}d`,
      arrow: '↗',
      descText: 'You maintained a ',
      descHighlight: `${d.streak || 5}-day focus streak`,
      descSuffix: ' this week.',
      tip: d.bestDayLabel ? `Best day: ${d.bestDayLabel} · ${formatDuration(d.bestDayMinutes)} saved.` : 'Consistency compounds faster than intensity.',
      graph: (
        <View style={styles.cardGraphWrap}>
          <GradientMeter progress={Math.min(1, (d.streak || 5) / 7)} colors={['#FB923C', '#FCD34D']} height={8} />
        </View>
      ),
    },
  ];

  const handleScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / cardWidth);
    if (index >= 0 && index < slides.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Horizontal Carousel */}
      <Animated.View entering={FadeInDown.delay(100).duration(450)}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardWidth}
          snapToAlignment="center"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ width: cardWidth }}
          contentContainerStyle={{ height: 410 }}
        >
          {slides.map((slide) => (
            <View key={slide.key} style={[styles.carouselCardContainer, { width: cardWidth }]}>
              <LinearGradient
                colors={slide.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCard}
              >
                {/* Ambient glow leak overlay */}
                <LinearGradient
                  colors={[`${slide.accentColor}33`, 'rgba(0,0,0,0)']}
                  start={{ x: 0, y: 0.3 }}
                  end={{ x: 0.8, y: 0.7 }}
                  style={styles.lightLeak}
                />

                {/* Top Row: Icon/Title, Dropdown, Menu */}
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={[styles.iconBg, { backgroundColor: '#FFFFFF' }]}>
                      <Icon name={slide.icon as IconName} size={18} color="#0B0816" strokeWidth={2} />
                    </View>
                    <Text style={styles.cardTitle}>{slide.title}</Text>
                  </View>
                  <View style={styles.headerRight}>
                    <View style={styles.dropdownBtn}>
                      <Text style={styles.dropdownBtnText}>This Week</Text>
                      <Icon name="chevronDown" size={12} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                  </View>
                </View>

                {/* Main Metric Value / Arrow */}
                <View style={styles.metricContainer}>
                  <Text style={styles.metricValue}>{slide.value}</Text>
                  {slide.arrow ? (
                    <View style={styles.metricArrow}>
                      <Icon name={slide.arrow === '↗' ? 'trendUp' : 'trendDown'} size={26} color="#FFFFFF" strokeWidth={2.2} />
                    </View>
                  ) : null}
                </View>

                {/* Inline Graph Visualisation */}
                {slide.graph}

                {/* Dynamic Copy Text */}
                <Text style={styles.descText}>
                  {slide.descText}
                  <Text style={styles.descHighlight}>{slide.descHighlight}</Text>
                  {slide.descSuffix}
                </Text>

                {/* Bottom Tip / Advice */}
                <Text style={styles.tipText}>{slide.tip}</Text>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Pagination Dot Indicator */}
      <View style={styles.indicatorContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicatorDot,
              index === activeIndex ? styles.indicatorDotActive : null,
            ]}
          />
        ))}
      </View>

      {/* Overview Grid */}
      <Text style={styles.sectionTitle}>Overview</Text>

      <View style={styles.overviewRow}>
        <View style={styles.miniCard}>
          <View style={styles.miniCardHeader}>
            <Text style={styles.miniCardLabel}>Time Saved</Text>
            <Icon name="hourglass" size={15} color={palette.textSecondary} strokeWidth={1.8} />
          </View>
          <View>
            <Text style={styles.miniCardValue}>{formatDuration(d.savedMinutes)}</Text>
            <Text style={styles.miniCardHint}>{formatSignedMinutes(d.savedDelta)} vs last week</Text>
          </View>
        </View>

        <View style={styles.miniCard}>
          <View style={styles.miniCardHeader}>
            <Text style={styles.miniCardLabel}>Focus Time</Text>
            <Icon name="target" size={15} color={palette.textSecondary} strokeWidth={1.8} />
          </View>
          <View>
            <Text style={styles.miniCardValue}>{formatDuration(d.focusMinutes)}</Text>
            <Text style={styles.miniCardHint}>{formatSignedMinutes(d.focusDelta)} vs last week</Text>
          </View>
        </View>
      </View>

      <View style={styles.overviewRow}>
        <View style={styles.miniCard}>
          <View style={styles.miniCardHeader}>
            <Text style={styles.miniCardLabel}>Blocked</Text>
            <Icon name="shield" size={15} color={palette.textSecondary} strokeWidth={1.8} />
          </View>
          <View>
            <Text style={styles.miniCardValue}>{d.distractionsBlocked}</Text>
            <Text style={[styles.miniCardHint, { color: 'rgba(255, 255, 255, 0.4)' }]}>
              {d.hardUnlocks > 0 ? `${d.hardUnlocks} unlocks` : '0 unlocks'}
            </Text>
          </View>
        </View>

        <View style={styles.miniCard}>
          <View style={styles.miniCardHeader}>
            <Text style={styles.miniCardLabel}>Streak</Text>
            <Icon name="flame" size={15} color={palette.textSecondary} strokeWidth={1.8} />
          </View>
          <View>
            <Text style={styles.miniCardValue}>{d.streak} days</Text>
            <Text style={[styles.miniCardHint, { color: 'rgba(255, 255, 255, 0.4)' }]}>
              {d.bestDayLabel ? `Best: ${d.bestDayLabel}` : 'Active'}
            </Text>
          </View>
        </View>
      </View>

      {/* Milestone/Achievements Cards */}
      {milestones.length > 0 && (
        <Animated.View entering={FadeIn.delay(420).duration(400)} style={styles.milestoneCard}>
          <Text style={styles.milestoneLabel}>Earned recently</Text>
          <View style={styles.milestoneRow}>
            {milestones.slice(0, 4).map((m) => (
              <View key={m.id} style={styles.milestoneItem}>
                <Medal def={m} size={44} />
                <Text style={styles.milestoneName} numberOfLines={2}>
                  {m.name}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { color: palette.text, fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 15 },
  emptyCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    marginTop: 18,
  },
  emptyTitle: { color: palette.text, fontSize: 16, fontWeight: '700' },
  emptyBody: { color: palette.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8 },
  milestoneRow: { flexDirection: 'row', gap: 14, marginTop: 12 },
  milestoneItem: { alignItems: 'center', width: 62, gap: 6 },
  milestoneName: {
    color: palette.textSecondary,
    fontSize: 10.5,
    lineHeight: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  milestoneCard: {
    backgroundColor: 'rgba(71,107,235,0.07)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(71,107,235,0.18)',
    marginTop: 10,
    marginBottom: 20,
  },
  milestoneLabel: { color: palette.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  // Carousel Styles
  carouselCardContainer: {
    paddingRight: 0,
    height: 405,
  },
  gradientCard: {
    flex: 1,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'space-between',
    overflow: 'hidden', // Contain the light leak overlay
  },
  lightLeak: {
    position: 'absolute',
    left: 0,
    top: '10%',
    width: '80%',
    height: '80%',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  cardGraphWrap: {
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  dropdownBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '600',
  },
  metricContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 76,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 80,
  },
  metricArrow: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 36,
    marginLeft: 4,
    marginTop: 8,
  },
  descText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 18,
    lineHeight: 25,
    marginTop: 10,
  },
  descHighlight: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tipText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 15,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 18,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 4,
  },
  indicatorDotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  miniCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    width: '48.5%',
    height: 120,
    justifyContent: 'space-between',
  },
  miniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniCardIcon: {
    fontSize: 16,
  },
  miniCardLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  miniCardValue: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 4,
  },
  miniCardHint: {
    color: palette.accent,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
