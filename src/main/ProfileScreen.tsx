import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GateReflection } from '../data/store';
import { fonts, gradients, palette, type as T, space, radius } from '../design/tokens';
import Icon from '../ui/Icon';
import {
  ACHIEVEMENTS,
  AchievementDef,
  ProgressState,
  STREAK_MILESTONES,
  addDays,
  dailySeries,
  dateKey,
  daysSinceJoin,
  earnedThisMonth,
  formatDuration,
  formatPrettyDate,
  formatSignedMinutes,
  getAchievement,
  getDay,
  globalPercentile,
  nextStreakMilestone,
  shareMessage,
  sumRange,
  totals,
  weekdayShort,
  weeklyWindows,
} from '../data/progress';
import Medal from './profile/Medal';
import {
  CalendarHeatmap,
  IntensityBars,
  Sparkline,
  SegmentBar,
  GradientMeter,
  DotProgress,
} from './profile/viz';

const { width } = Dimensions.get('window');
const CONTENT_W = width - space.gutter * 2;
/** Ten weeks fits the card and is long enough for streaks to read as shapes. */
const HEATMAP_WEEKS = 10;

/** The signature headline figure — big tabular numerals with small dim units,
 *  the way Opal renders "3h 37m". Split so the unit contrast does the work. */
function HeroDuration({ minutes, color = palette.accent }: { minutes: number; color?: string }) {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return (
    <View style={styles.heroFigure}>
      {h > 0 && (
        <>
          <Text style={[styles.heroNum, { color }]}>{h}</Text>
          <Text style={styles.heroUnit}>h</Text>
        </>
      )}
      <Text style={[styles.heroNum, { color }]}>{h > 0 ? String(m).padStart(2, '0') : m}</Text>
      <Text style={styles.heroUnit}>m</Text>
    </View>
  );
}

/** One column of the three-up stat row under the hero. */
function StatCol({
  icon,
  value,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  /** Makes the column tappable; without it the column is inert as before. */
  onPress?: () => void;
}) {
  const Container: React.ComponentType<any> = onPress ? Pressable : View;
  return (
    <Container
      style={styles.statCol}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${label}, ${value}. Opens awards.` : undefined}
    >
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {!!onPress && <Icon name="chevronRight" size={11} color={palette.textQuaternary} strokeWidth={2} />}
    </Container>
  );
}

/** A metric mini-card: eyebrow, big value, and a small inline visualisation. */
function MetricCard({
  label,
  value,
  sub,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricEyebrow}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
      <View style={styles.metricViz}>{children}</View>
    </View>
  );
}

function DetailRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={{ alignItems: 'flex-end', flex: 1 }}>
        <Text style={styles.detailValue}>{value}</Text>
        {hint ? <Text style={styles.detailHint}>{hint}</Text> : null}
      </View>
    </View>
  );
}

export default function ProfileScreen({
  onBack,
  onOpenSettings,
  onOpenMilestones,
  onOpenProgressPhotos,
  onOpenCalendar,
  onOpenRealUsage,
  onOpenWeeklyInsight,
  progress,
  gateReflections = [],
  username,
  firstOpenDate,
  goalLine,
}: {
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenMilestones: () => void;
  onOpenProgressPhotos?: () => void;
  onOpenCalendar?: () => void;
  onOpenRealUsage?: () => void;
  onOpenWeeklyInsight?: () => void;
  progress: ProgressState;
  /** Everything typed at the gate. Rendered here because Profile is the
   *  personal record — this used to be the Reflect tab's "Your words". */
  gateReflections?: GateReflection[];
  username: string;
  firstOpenDate: string;
  goalLine?: string;
}) {
  const [range, setRange] = useState<'week' | 'month' | '3mo' | '6mo' | '9mo' | '12mo' | 'all'>('week');
  const LONG_RANGE_MONTHS: Record<string, number> = { '3mo': 3, '6mo': 6, '9mo': 9, '12mo': 12 };
  const [shareTarget, setShareTarget] = useState<AchievementDef | null>(null);

  const today = dateKey();
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dateKey(d);
  }, []);
  const windows = weeklyWindows(today);
  const todayLog = getDay(progress, today);
  const yesterdayLog = getDay(progress, yesterday);
  const all = totals(progress);
  const week = sumRange(progress, windows.thisStart, today);
  const lastWeek = sumRange(progress, windows.prevStart, windows.prevEnd);
  const month = sumRange(progress, windows.monthStart, today);
  const joinedDays = daysSinceJoin(firstOpenDate, today);
  const rank = globalPercentile(progress);
  const streakGoal = nextStreakMilestone(progress.currentStreak);
  const streakBroken = progress.currentStreak === 0 && progress.bestStreak > 0;
  const focusDelta = todayLog.focusMinutes - yesterdayLog.focusMinutes;
  const savedDelta = week.savedMinutes - lastWeek.savedMinutes;
  const earnedIds = new Set(progress.achievements.map((a) => a.id));
  const earnedDefs = progress.achievements
    .map((e) => ({ ...e, def: getAchievement(e.id) }))
    .filter((x): x is typeof x & { def: AchievementDef } => !!x.def);
  // The hero badge: your highest award, not simply the last one in the list.
  // ACHIEVEMENTS is grouped by category, so array order would rank "First
  // Month" above a 100-day streak. Rank by medal tier instead, and break ties
  // on whichever was unlocked most recently.
  const heroAward = (() => {
    const TIER: Record<AchievementDef['medal'], number> = {
      mint: 1,
      flame: 2,
      steel: 3,
      gold: 4,
      violet: 5,
    };
    const earnedAt = new Map(progress.achievements.map((a) => [a.id, a.earnedAt]));
    const earned = ACHIEVEMENTS.filter((a) => earnedIds.has(a.id));
    if (earned.length === 0) return { def: ACHIEVEMENTS[0], locked: true };
    const best = earned.reduce((top, a) => {
      const dt = TIER[a.medal] - TIER[top.medal];
      if (dt !== 0) return dt > 0 ? a : top;
      return (earnedAt.get(a.id) ?? '') > (earnedAt.get(top.id) ?? '') ? a : top;
    }, earned[0]);
    return { def: best, locked: false };
  })();

  const monthAchievements = earnedThisMonth(progress, windows.monthStart);
  const avgDailyAll = all.focusMinutes / Math.max(1, joinedDays);

  // Streak milestone tiers reached, for the "Best streak" segment indicator.
  const streakTiers = STREAK_MILESTONES.filter((m) => progress.bestStreak >= m).length;
  const weekFocusSeries = dailySeries(progress, windows.thisStart, today).map((d) => d.focusMinutes);

  // The intensity chart honours the selected range.
  const series = useMemo(() => {
    const days = range === 'week' ? 7 : range === 'month' ? 30 : LONG_RANGE_MONTHS[range] ? LONG_RANGE_MONTHS[range] * 30 : joinedDays;
    const start = addDays(today, -(Math.min(days, 60) - 1));
    const clamped = start < dateKey(new Date(firstOpenDate)) ? dateKey(new Date(firstOpenDate)) : start;
    return dailySeries(progress, clamped > today ? today : clamped, today).slice(-60);
  }, [progress, range, firstOpenDate, today, joinedDays]);

  const barData = series.map((d) => ({ value: d.focusMinutes, flag: d.hardUnlocks > 0 }));

  // Its own window: the heatmap earns its space by showing more than the bars
  // can, so it always looks back 10 weeks regardless of the selected range.
  const heatData = useMemo(() => {
    const start = addDays(today, -(HEATMAP_WEEKS * 7 - 1));
    const from = start < dateKey(new Date(firstOpenDate)) ? dateKey(new Date(firstOpenDate)) : start;
    return dailySeries(progress, from > today ? today : from, today).map((d) => ({
      value: d.focusMinutes,
      flag: d.hardUnlocks > 0,
      date: d.date,
      today: d.date === today,
    }));
  }, [progress, firstOpenDate, today]);

  const heatActiveDays = heatData.filter((d) => d.value > 0).length;
  const axisMarks = series
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i === 0 || i === series.length - 1 || i === Math.floor(series.length / 2));

  async function shareAchievement(def: AchievementDef) {
    const extra =
      def.category === 'saved'
        ? `I've saved ${formatDuration(all.savedMinutes)} in total.`
        : def.category === 'streak'
          ? `Best streak: ${progress.bestStreak} days.`
          : undefined;
    try {
      await Share.share({ message: shareMessage(def, extra), title: def.name });
    } catch {
      // User cancelled or share is unavailable.
    }
  }

  const period = range === 'week' ? week : range === 'month' ? month : { ...all, avgDailyFocus: avgDailyAll, bestFocusDay: month.bestFocusDay, span: joinedDays };

  // Long-range comparison — this N-month block vs the equivalent block before it.
  const longRange = useMemo(() => {
    const months = LONG_RANGE_MONTHS[range];
    if (!months) return null;
    const days = months * 30;
    const start = addDays(today, -days + 1);
    const prevEnd = addDays(start, -1);
    const prevStart = addDays(prevEnd, -days + 1);
    const clampedStart = start < dateKey(new Date(firstOpenDate)) ? dateKey(new Date(firstOpenDate)) : start;
    const current = sumRange(progress, clampedStart, today);
    const previous = sumRange(progress, prevStart, prevEnd);
    return { current, previous, months };
  }, [range, progress, today, firstOpenDate]);

  const rangeTitle = range === 'week' ? 'THIS WEEK' : range === 'month' ? 'THIS MONTH' : LONG_RANGE_MONTHS[range] ? `LAST ${LONG_RANGE_MONTHS[range]} MONTHS` : 'ALL TIME';


  return (
    <View style={styles.root}>
      {/* Ambient ground + gem bloom, so the screen has a light source. */}
      {/* Was a hardcoded ['#050C16','#000000','#000000'] — the pre-theme blue,
          which left Profile blue-black while every other screen followed the
          chosen scheme. */}
      <LinearGradient
        colors={[...gradients.ground]}
        locations={[...gradients.groundLocations]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
            <Icon name="chevronLeft" size={20} color={palette.text} strokeWidth={2} />
          </Pressable>
          {/* The wordmark said "Byre" on a screen the user reached from inside
              Byre — it named the app to someone who already knew. The highest
              award actually earned is the one piece of identity this header
              can carry that the user did not already have.
              Falls back to the wordmark only while nothing is unlocked, so a
              brand-new account never sees a locked award's name presented as
              though it were theirs. */}
          <View style={styles.headerTitleWrap}>
            {heroAward.locked ? (
              <Text style={styles.headerWordmark}>Byre</Text>
            ) : (
              <>
                <Text style={styles.headerAward} numberOfLines={1}>
                  {heroAward.def.name}
                </Text>
                <Text style={styles.headerAwardSub}>UNLOCKED</Text>
              </>
            )}
          </View>
          <Pressable onPress={onOpenSettings} style={styles.circleBtn} hitSlop={10}>
            <Icon name="settings" size={19} color={palette.text} strokeWidth={1.8} />
          </Pressable>
        </View>

        <LinearGradient
          colors={[gradients.ground[0], 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']}
          locations={[0, 0.45, 1]}
          style={styles.topFade}
          pointerEvents="none"
        />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* HERO — the focus crystal + today's headline figure */}
          <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
            <Medal def={heroAward.def} locked={heroAward.locked} size={196} id="hero" />
            <Text style={styles.username} numberOfLines={1}>{username}</Text>
            <HeroDuration minutes={todayLog.focusMinutes} />
            <Text style={styles.heroCaption}>FOCUS TODAY</Text>
          </Animated.View>

          {/* THREE-UP STAT ROW */}
          <View style={styles.statRow}>
            {/* One icon treatment across all three. They were an amber flame,
                a green target and a periwinkle hourglass — three unrelated
                hues in a row, which reads as three unrelated widgets rather
                than one stat row, and none of the colours carried meaning.
                Chromatic colour in this app is rationed to accent/warn/danger
                and these are all the same kind of thing: a neutral count. */}
            <StatCol
              icon={<Icon name="flame" size={24} color={palette.accent} strokeWidth={1.8} />}
              value={String(progress.currentStreak)}
              label="DAY STREAK"
              onPress={onOpenMilestones}
            />
            <View style={styles.statDivider} />
            <StatCol
              icon={<Icon name="pulse" size={24} color={palette.accent} strokeWidth={1.8} />}
              value={`${rank.percent}%`}
              label="FOCUS SCORE"
            />
            <View style={styles.statDivider} />
            <StatCol
              icon={<Icon name="clock" size={24} color={palette.accent} strokeWidth={1.8} />}
              value={formatDuration(all.savedMinutes)}
              label="SAVED"
            />
          </View>

          {/* INTENSITY CHART */}
          <Animated.View entering={FadeInDown.delay(80).duration(420)} style={styles.chartCard}>
            <View style={styles.chartHead}>
              <View>
                <Text style={styles.metricEyebrow}>FOCUS RHYTHM</Text>
                <Text style={styles.chartHeadValue}>{formatDuration(period.focusMinutes)}</Text>
                <Text style={styles.chartHeadSub}>{rangeTitle.toLowerCase().replace('this ', 'this ')}</Text>
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: palette.accent }]} />
                  <Text style={styles.legendText}>Focus</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: palette.danger }]} />
                  <Text style={styles.legendText}>Slip</Text>
                </View>
              </View>
            </View>
            <IntensityBars data={barData} width={CONTENT_W - space.lg * 2} height={128} style={styles.chart} />
            <View style={styles.chartAxis}>
              {axisMarks.map(({ d, i }) => (
                <Text key={`${d.date}-${i}`} style={styles.axisLabel}>
                  {weekdayShort(d.date)}
                </Text>
              ))}
            </View>
          </Animated.View>

          {/* CALENDAR HEATMAP — the long view the bars cannot give */}
          {heatData.length > 7 && (
            <Animated.View entering={FadeInDown.delay(120).duration(420)} style={styles.chartCard}>
              <View style={styles.chartHead}>
                <View>
                  <Text style={styles.metricEyebrow}>LAST 10 WEEKS</Text>
                  <Text style={styles.chartHeadValue}>{heatActiveDays} active days</Text>
                  <Text style={[styles.chartHeadSub, styles.chartHeadSentence]}>Darker means more focus</Text>
                </View>
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: palette.accent }]} />
                    <Text style={styles.legendText}>Focus</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: palette.danger }]} />
                    <Text style={styles.legendText}>Slip</Text>
                  </View>
                </View>
              </View>
              <CalendarHeatmap
                data={heatData}
                width={CONTENT_W - space.lg * 2}
                style={styles.chart}
              />
            </Animated.View>
          )}

          {/* RANGE PILLS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.railBleed}
            contentContainerStyle={styles.rangeRow}
          >
            {(['week', 'month', '3mo', '6mo', '9mo', '12mo', 'all'] as const).map((r) => (
              <Pressable key={r} onPress={() => setRange(r)} style={[styles.rangePill, range === r && styles.rangePillActive]}>
                <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>
                  {r === 'week' ? 'Week' : r === 'month' ? 'Month' : r === 'all' ? 'All' : r.replace('mo', 'mo')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* METRIC-VIZ GRID */}
          <View style={styles.grid}>
            <MetricCard label="THIS WEEK" value={formatDuration(week.focusMinutes)} sub="focus time">
              <Sparkline values={weekFocusSeries.length ? weekFocusSeries : [0, 0]} width={(CONTENT_W - space.md) / 2 - space.lg * 2} height={38} />
            </MetricCard>
            {/* "percentile" claimed a ranking against other users. There is no
                user base to rank against — see focusScore in progress.ts. */}
            <MetricCard label="FOCUS SCORE" value={`${rank.percent}%`} sub="your own activity">
              <GradientMeter progress={rank.score} colors={['#7F92E0', palette.accent]} height={8} />
            </MetricCard>
            <MetricCard label="BEST STREAK" value={`${progress.bestStreak}d`} sub={`${streakGoal.next}d next milestone`}>
              <SegmentBar level={Math.min(3, streakTiers)} segments={3} color="#E9AE62" />
            </MetricCard>
            <MetricCard label="CONSISTENCY" value={`${week.daysWithFocus}/7`} sub="days active this week">
              <DotProgress filled={week.daysWithFocus} total={7} />
            </MetricCard>
          </View>

          {/* STREAK CARD */}
          <View style={styles.card}>
            <Text style={styles.metricEyebrow}>DAY STREAK</Text>
            <View style={styles.streakHero}>
              <View style={styles.streakGlyph}>
                <Icon name="flame" size={28} color="#E9AE62" strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.streakNum}>{progress.currentStreak} day{progress.currentStreak === 1 ? '' : 's'}</Text>
                {streakBroken ? (
                  <Text style={styles.streakSub}>Streak paused. Your best is still {progress.bestStreak} days — pick it back up today.</Text>
                ) : (
                  <Text style={styles.streakSub}>
                    Next milestone: {streakGoal.next} days · {Math.max(0, streakGoal.next - progress.currentStreak)} to go
                  </Text>
                )}
              </View>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.milestoneRow}
              >
              {STREAK_MILESTONES.map((m) => {
                const hit = Math.max(progress.currentStreak, progress.bestStreak) >= m;
                return (
                  <View key={m} style={[styles.milestoneChip, hit && styles.milestoneChipOn]}>
                    <Text style={[styles.milestoneText, hit && styles.milestoneTextOn]}>{m}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* TIME SAVED */}
          <View style={styles.card}>
            <Text style={styles.metricEyebrow}>TIME SAVED</Text>
            <Text style={styles.savedHero}>You've saved {formatDuration(week.savedMinutes)} this week.</Text>
            <DetailRow label="Today" value={formatDuration(todayLog.savedMinutes)} />
            <DetailRow label="This week" value={formatDuration(week.savedMinutes)} hint={formatSignedMinutes(savedDelta) + ' vs last week'} />
            <DetailRow label="This month" value={formatDuration(month.savedMinutes)} />
            <DetailRow label="Since starting" value={formatDuration(all.savedMinutes)} />
            {goalLine ? <Text style={styles.goalHint}>More room for: {goalLine}</Text> : null}
          </View>

          {/* AVERAGE FOCUS */}
          <View style={styles.card}>
            <Text style={styles.metricEyebrow}>AVERAGE FOCUS</Text>
            <DetailRow label="Today" value={formatDuration(todayLog.focusMinutes)} />
            <DetailRow
              label="Compared with yesterday"
              value={formatSignedMinutes(focusDelta)}
              hint={focusDelta > 0 ? 'More than yesterday.' : focusDelta < 0 ? 'Today is still counting.' : 'Holding steady.'}
            />
            <DetailRow label="Daily average" value={formatDuration(avgDailyAll)} />
            <DetailRow label="This month" value={formatDuration(month.avgDailyFocus)} hint="avg / day" />
            <DetailRow label="Since joining" value={formatDuration(all.focusMinutes)} />
          </View>

          {longRange && (
            <View style={styles.card}>
              <Text style={styles.metricEyebrow}>{longRange.months}-MONTH COMPARISON</Text>
              <Text style={styles.savedHero}>
                {formatDuration(longRange.current.savedMinutes)} saved this block
              </Text>
              <DetailRow
                label={`vs previous ${longRange.months}mo`}
                value={formatSignedMinutes(longRange.current.savedMinutes - longRange.previous.savedMinutes)}
                hint={
                  longRange.current.savedMinutes >= longRange.previous.savedMinutes
                    ? "You're saving more than the stretch before this."
                    : 'The previous stretch was stronger — still real progress.'
                }
              />
              <DetailRow label="Focus this block" value={formatDuration(longRange.current.focusMinutes)} />
              <DetailRow label="Distractions blocked" value={String(longRange.current.distractionsBlocked)} />
              <DetailRow label="Hard unlocks" value={String(longRange.current.hardUnlocks)} />
              <DetailRow label="Focus sessions" value={String(longRange.current.lockSessions)} />
            </View>
          )}

          {monthAchievements.length > 0 && (
            <View style={[styles.card, styles.cardAccent]}>
              <Text style={[styles.metricEyebrow, { color: palette.accent }]}>EARNED THIS MONTH</Text>
              <Text style={styles.monthAwards}>{monthAchievements.map((a) => a.name).join(' · ')}</Text>
            </View>
          )}

          {/* SECTION LINKS */}
          {onOpenWeeklyInsight && <LinkRow title="Weekly insight" sub="Your last 7 days" icon="pulse" onPress={onOpenWeeklyInsight} />}
          {onOpenRealUsage && <LinkRow title="Real device usage" sub="Android screen time" icon="bars" onPress={onOpenRealUsage} />}
          {onOpenCalendar && <LinkRow title="Calendar" sub="Every day, by colour" icon="calendar" onPress={onOpenCalendar} />}
          {onOpenProgressPhotos && <LinkRow title="Progress photos" sub="Your weekly check-ins" icon="camera" onPress={onOpenProgressPhotos} />}

          {/* YOUR WORDS — the only thing that read gateReflections, carried over
              when the Reflect tab was removed. Without it this data would still
              be collected at the gate and never shown back. */}
          {gateReflections.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Your words</Text>
                <Text style={styles.sectionLink}>{gateReflections.length}</Text>
              </View>
              {[...gateReflections].reverse().slice(0, 8).map((w, i) => (
                <View key={`${w.date}-${i}`} style={styles.wordCard}>
                  <Text style={styles.wordDate}>{formatPrettyDate(w.date)}</Text>
                  <Text style={styles.wordText}>“{w.text}”</Text>
                  <Text
                    style={[
                      styles.wordOutcome,
                      { color: w.unlocked ? palette.textTertiary : palette.accent },
                    ]}
                  >
                    {w.unlocked ? 'You went in anyway.' : 'You backed out. That one counted.'}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* AWARDS RAIL */}
          <Pressable onPress={onOpenMilestones} style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Awards</Text>
            <View style={styles.sectionLinkRow}>
              <Text style={styles.sectionLink}>
                {earnedDefs.length}/{ACHIEVEMENTS.length}
              </Text>
              <Icon name="chevronRight" size={14} color={palette.textQuaternary} strokeWidth={2} />
            </View>
          </Pressable>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.railBleed}
            contentContainerStyle={styles.awardRow}
          >
            {ACHIEVEMENTS.slice(0, 8).map((def) => {
              const earned = earnedIds.has(def.id);
              const stamp = progress.achievements.find((a) => a.id === def.id);
              return (
                <Pressable key={def.id} onPress={() => setShareTarget(def)} style={styles.awardCol}>
                  <Medal medal={def.medal} def={def} locked={!earned} id={def.id} />
                  <Text style={styles.awardName} numberOfLines={1}>{def.name}</Text>
                  <Text style={styles.awardSub} numberOfLines={2}>
                    {earned && stamp ? formatPrettyDate(stamp.earnedAt) : def.statLabel}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={!!shareTarget} transparent animationType="fade" onRequestClose={() => setShareTarget(null)}>
        <Pressable style={styles.modalBg} onPress={() => setShareTarget(null)}>
          <Pressable style={styles.shareCard} onPress={() => {}}>
            {shareTarget && (
              <>
                <LinearGradient colors={['#12241A', '#0B0B0D']} style={StyleSheet.absoluteFill} />
                <Text style={styles.shareBrand}>Byre</Text>
                <Medal medal={shareTarget.medal} def={shareTarget} size={88} locked={!earnedIds.has(shareTarget.id)} id={`share-${shareTarget.id}`} />
                <Text style={styles.shareName}>{shareTarget.name}</Text>
                <Text style={styles.shareDesc}>{shareTarget.description}</Text>
                {earnedIds.has(shareTarget.id) ? (
                  <Text style={styles.shareStat}>
                    {shareTarget.statLabel}
                    {' · '}
                    {formatPrettyDate(progress.achievements.find((a) => a.id === shareTarget.id)!.earnedAt)}
                  </Text>
                ) : (
                  <Text style={styles.shareStat}>Not earned yet — keep going.</Text>
                )}
                <Text style={styles.sharePrivacy}>Sharing never includes your name, apps, or rank.</Text>
                {earnedIds.has(shareTarget.id) && (
                  <Pressable style={styles.shareBtn} onPress={() => shareAchievement(shareTarget)}>
                    <Text style={styles.shareBtnText}>Share this award</Text>
                  </Pressable>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/** A tidy tappable section link, replacing the old text-only rows. */
function LinkRow({ title, sub, icon, onPress }: { title: string; sub: string; icon: any; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.linkRow}>
      <View style={styles.linkIcon}>
        <Icon name={icon} size={19} color={palette.accent} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.linkSub}>{sub}</Text>
      </View>
      <Icon name="chevronRight" size={18} color={palette.textQuaternary} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.base },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingVertical: space.md },
  headerTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: space.sm },
  headerWordmark: { color: palette.text, fontFamily: fonts.extrabold, fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  headerAward: {
    color: palette.text,
    fontFamily: fonts.extrabold,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerAwardSub: {
    color: palette.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginTop: 1,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: 120 },
  /** Sits over the top of the scroll so content fades out under the header
   *  instead of being cut at a hard, invisible edge. */
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 28, zIndex: 2 },

  hero: { alignItems: 'center', marginTop: space.xl },
  username: { color: palette.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginTop: space.xs },
  /* Split numeral: a heavy figure with a small dim unit on the SAME baseline.
     It was a 200-weight hairline with the unit floated near the cap height,
     which reads as decoration — the number is the content of this screen and
     should carry the most weight on it, not the least. */
  heroFigure: { flexDirection: 'row', alignItems: 'baseline', marginTop: space.sm },
  heroNum: {
    fontFamily: fonts.extrabold,
    fontSize: 68,
    lineHeight: 78,
    fontWeight: '800',
    letterSpacing: -3,
    fontVariant: ['tabular-nums'],
  },
  heroUnit: {
    color: palette.textTertiary,
    fontFamily: fonts.medium,
    fontSize: 19,
    fontWeight: '500',
    marginRight: space.sm,
    marginLeft: 3,
  },
  heroCaption: { color: palette.textTertiary, fontSize: 11, fontWeight: '700', letterSpacing: 1.6, marginTop: 2 },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: space.xl,
    paddingVertical: space.base,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statCol: { flex: 1, alignItems: 'center', gap: 6 },
  statIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentBorder,
  },
  statValue: {
    color: palette.text,
    fontFamily: fonts.extrabold,
    // 21 not 23: "197h 25m" is the widest value this row ever holds and was
    // running into its neighbours' dividers.
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.7,
    fontVariant: ['tabular-nums'],
    marginTop: space.sm,
  },
  statLabel: { color: palette.textTertiary, fontSize: 9.5, fontWeight: '600', letterSpacing: 0.9, marginTop: 3 },
  statDivider: { width: 1, height: 48, backgroundColor: palette.border },

  chartCard: {
    marginTop: space.base,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space.lg,
  },
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.base },
  chartHeadValue: { color: palette.text, fontFamily: fonts.extrabold, fontSize: 28, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'], marginTop: 4 },
  chartHeadSub: { color: palette.textTertiary, fontSize: 12, marginTop: 1, textTransform: 'capitalize' },
  chartHeadSentence: { textTransform: 'none' },
  legend: { gap: 6, alignItems: 'flex-end' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: palette.textSecondary, fontSize: 12, fontWeight: '600' },
  chart: { marginTop: space.xs },
  chartAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm },
  axisLabel: { color: palette.textTertiary, fontSize: 11, fontWeight: '600' },

  /** Lets a horizontal rail run to the screen edge from inside a gutter-padded
   *  scroll, so the last item scrolls away instead of butting against padding. */
  railBleed: { marginHorizontal: -space.gutter },
  rangeRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
    paddingHorizontal: space.gutter,
  },
  rangePill: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
  },
  rangePillActive: { backgroundColor: palette.accentSoft, borderColor: palette.accentBorder },
  rangeText: { color: palette.textSecondary, fontSize: 14, fontWeight: '600' },
  rangeTextActive: { color: palette.accent },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.base },
  metricCard: {
    width: (CONTENT_W - space.md) / 2,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space.lg,
    minHeight: 128,
  },
  metricEyebrow: { color: palette.textTertiary, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2 },
  metricValue: { color: palette.text, fontFamily: fonts.extrabold, fontSize: 28, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'], marginTop: 8 },
  metricSub: { color: palette.textTertiary, fontSize: 11.5, marginTop: 2 },
  metricViz: { marginTop: 'auto', paddingTop: space.base },

  card: {
    marginTop: space.base,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardAccent: { backgroundColor: palette.accentSoft, borderColor: palette.accentBorder },
  monthAwards: { color: palette.text, fontSize: 15, fontWeight: '700', marginTop: 6, lineHeight: 21 },

  streakHero: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm },
  streakGlyph: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(233,174,98,0.14)', alignItems: 'center', justifyContent: 'center' },
  streakNum: { color: '#E9AE62', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  streakSub: { color: palette.textSecondary, fontSize: 13, marginTop: 3, lineHeight: 18 },
  milestoneRow: { gap: space.sm, marginTop: space.base, paddingRight: space.sm },
  milestoneChip: {
    minWidth: 38,
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  milestoneChipOn: { backgroundColor: 'rgba(233,174,98,0.16)', borderColor: 'rgba(233,174,98,0.4)' },
  milestoneText: { color: palette.textTertiary, fontSize: 13, fontWeight: '700' },
  milestoneTextOn: { color: '#E9AE62' },

  savedHero: { color: palette.accent, fontSize: 18, fontWeight: '800', marginTop: 6, marginBottom: 8, letterSpacing: -0.3 },
  goalHint: { color: palette.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 10 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.hairline },
  detailLabel: { color: palette.textSecondary, fontSize: 14, flex: 1, paddingRight: 12 },
  detailValue: { color: palette.text, fontSize: 15, fontWeight: '700' },
  detailHint: { color: palette.textTertiary, fontSize: 11.5, marginTop: 3, textAlign: 'right' },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space.base,
  },
  linkIcon: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { color: palette.text, fontSize: 15.5, fontWeight: '700' },
  linkSub: { color: palette.textTertiary, fontSize: 12.5, marginTop: 2 },

  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space.xxl },
  sectionTitle: { color: palette.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  sectionLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sectionLink: { color: palette.accent, fontSize: 14, fontWeight: '700' },
  wordCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 10,
  },
  wordDate: { color: palette.textTertiary, fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  wordText: { color: palette.text, fontSize: 15.5, lineHeight: 22, marginTop: 8 },
  wordOutcome: { fontSize: 12.5, fontWeight: '600', marginTop: 8 },
  awardRow: { gap: space.base, marginTop: space.base, paddingHorizontal: space.gutter },
  awardCol: { width: 96, alignItems: 'center' },
  awardName: { color: palette.text, fontSize: 13, fontWeight: '700', marginTop: space.sm, textAlign: 'center' },
  awardSub: { color: palette.textTertiary, fontSize: 11.5, marginTop: 3, textAlign: 'center' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: space.xl },
  shareCard: {
    width: '100%',
    borderRadius: radius.xxl,
    padding: space.xl,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 320,
    borderWidth: 1,
    borderColor: palette.border,
  },
  shareBrand: { color: palette.accent, fontSize: 15, fontWeight: '800', letterSpacing: 0.5, marginBottom: 16, alignSelf: 'flex-start' },
  shareName: { color: palette.text, fontSize: 24, fontWeight: '800', marginTop: 12 },
  shareDesc: { color: palette.textSecondary, fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  shareStat: { color: palette.accent, fontSize: 13, fontWeight: '700', marginTop: 14 },
  sharePrivacy: { color: palette.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 17 },
  shareBtn: {
    marginTop: 18,
    backgroundColor: palette.accent,
    borderRadius: radius.base,
    paddingVertical: 13,
    paddingHorizontal: 22,
  },
  shareBtnText: { color: palette.textInverse, fontSize: 15, fontWeight: '800' },
});
