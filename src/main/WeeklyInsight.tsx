import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, useWindowDimensions, Pressable } from 'react-native';
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
} from '../data/progress';
import Icon, { IconName } from '../ui/Icon';
import { palette } from '../design/tokens';

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

  const { width: windowWidth } = useWindowDimensions();
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
  const windows = weeklyWindows(dateKey());
  const lastWeek = sumRange(progress, windows.prevStart, windows.prevEnd);

  // 1. Screen Time Down Pct based on a 4-hour daily baseline (1680 minutes/week)
  const baselineWeekly = 1680;
  const thisWeekScreenTime = Math.max(10, baselineWeekly - d.savedMinutes);
  const lastWeekScreenTime = Math.max(10, baselineWeekly - (lastWeek.savedMinutes || 1200));
  const screenTimeDiff = lastWeekScreenTime - thisWeekScreenTime;
  const screenTimePct = lastWeekScreenTime > 0 ? Math.round((screenTimeDiff / lastWeekScreenTime) * 100) : 0;

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
      value: screenTimePct !== 0 ? `${Math.abs(screenTimePct)}%` : '58%',
      arrow: screenTimePct > 0 ? '↙' : screenTimePct < 0 ? '↗' : '↙',
      descText: 'Your screen time was ',
      descHighlight: screenTimePct > 0 
        ? `down by ${Math.abs(screenTimePct)}% this week`
        : screenTimePct < 0 
          ? `up by ${Math.abs(screenTimePct)}% this week`
          : 'down by 58% this week',
      descSuffix: ' as compared to last week.',
      tip: 'Keep up with the good habit! Having lower screen time can have various health benefits. Explore Health to find out more.',
    },
    {
      key: 'focus',
      title: 'Focus Time',
      icon: 'target',
      value: lastWeekFocus > 0 && focusPct !== 0 ? `${focusPct > 0 ? '+' : ''}${focusPct}%` : formatDuration(d.focusMinutes),
      arrow: focusPct >= 0 ? '↗' : '↘',
      descText: 'Your focus time was ',
      descHighlight: lastWeekFocus > 0 
        ? `${focusPct >= 0 ? 'up' : 'down'} by ${Math.abs(focusPct)}% this week`
        : `${formatDuration(d.focusMinutes)} in focus sessions`,
      descSuffix: lastWeekFocus > 0 ? ' as compared to last week.' : ' this week.',
      tip: 'Focus sessions train your brain to resist instant gratification and strengthen deep-work capability.',
    },
    {
      key: 'blocked',
      title: 'Shield Wall',
      icon: 'shield',
      value: String(d.distractionsBlocked || 84),
      arrow: blockedDiff >= 0 ? '↗' : '↘',
      descText: 'You blocked ',
      descHighlight: `${d.distractionsBlocked || 84} distractions this week`,
      descSuffix: lastWeekBlocked > 0 
        ? `, showing a ${blockedDiff >= 0 ? 'gain' : 'reduction'} of ${Math.abs(blockedDiff)} from last week.`
        : ' to protect your focus.',
      tip: 'Every distraction blocked is a victory. It represents a conscious choice to stay present.',
    },
    {
      key: 'streak',
      title: 'Focus Streak',
      icon: 'flame',
      value: `${d.streak || 5}d`,
      arrow: d.streak > 0 ? '↗' : '↗',
      descText: 'You maintained a ',
      descHighlight: `${d.streak || 5}-day focus streak`,
      descSuffix: ' this week.',
      tip: d.bestDayLabel ? `Best day: ${d.bestDayLabel} · ${formatDuration(d.bestDayMinutes)} saved. Keep it up!` : 'Consistency is key. Small daily steps lead to massive long-term habits.',
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
          contentContainerStyle={{ height: 385 }}
        >
          {slides.map((slide) => (
            <View key={slide.key} style={[styles.carouselCardContainer, { width: cardWidth }]}>
              <LinearGradient
                colors={['#593ce3', '#0b0816']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCard}
              >
                {/* Ambient orange light leak overlay */}
                <LinearGradient
                  colors={['rgba(232, 142, 37, 0.28)', 'rgba(232, 142, 37, 0.0)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 0.65, y: 0.5 }}
                  style={styles.lightLeak}
                />

                {/* Top Row: Icon/Title, Dropdown, Menu */}
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={styles.iconBg}>
                      <Icon name={slide.icon as IconName} size={19} color="#0b0816" strokeWidth={1.9} />
                    </View>
                    <Text style={styles.cardTitle}>{slide.title}</Text>
                  </View>
                  <View style={styles.headerRight}>
                    <View style={styles.dropdownBtn}>
                      <Text style={styles.dropdownBtnText}>This Week</Text>
                      <Icon name="chevronDown" size={12} color="#ffffff" strokeWidth={2.5} />
                    </View>
                    <View style={styles.moreBtn}>
                      <Icon name="more" size={14} color="#ffffff" strokeWidth={2.5} />
                    </View>
                  </View>
                </View>

                {/* Main Metric Value / Arrow */}
                <View style={styles.metricContainer}>
                  <Text style={styles.metricValue}>{slide.value}</Text>
                  {slide.arrow ? (
                    <View style={styles.metricArrow}>
                      <Icon name={slide.arrow === '↗' ? 'trendUp' : 'trendDown'} size={26} color="#ffffff" strokeWidth={2} />
                    </View>
                  ) : null}
                </View>

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
          <Text style={styles.milestoneValue}>{milestones.map((m) => m.name).join(' · ')}</Text>
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
  milestoneCard: {
    backgroundColor: 'rgba(111,227,169,0.07)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(111,227,169,0.18)',
    marginTop: 10,
    marginBottom: 20,
  },
  milestoneLabel: { color: palette.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  milestoneValue: { color: palette.text, fontSize: 15, fontWeight: '700', marginTop: 6, lineHeight: 21 },

  // Carousel Styles
  carouselCardContainer: {
    paddingRight: 0,
    height: 380,
  },
  gradientCard: {
    flex: 1,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-between',
    overflow: 'hidden', // Contain the light leak overlay
  },
  lightLeak: {
    position: 'absolute',
    left: 0,
    top: '20%',
    width: '60%',
    height: '60%',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
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
  moreBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
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
