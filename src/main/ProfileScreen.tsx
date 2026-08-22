import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect, Line, Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../theme';
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

const { width } = Dimensions.get('window');
const CHART_W = Math.min(330, width - 48);
const CHART_H = 168;

function ProfileAvatar() {
  return (
    <View style={styles.avatarContainer}>
      <Svg width={160} height={160} viewBox="0 0 160 160">
        <Circle cx="80" cy="80" r="76" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
        <Circle cx="80" cy="80" r="64" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
        <Circle cx="80" cy="80" r="54" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none" />
        <Path d="M 36 100 Q 30 96, 35 90 Q 40 96, 36 100" fill="rgba(255,255,255,0.18)" />
        <Path d="M 32 84 Q 26 80, 31 74 Q 37 80, 32 84" fill="rgba(255,255,255,0.18)" />
        <Path d="M 34 68 Q 28 64, 33 58 Q 39 64, 34 68" fill="rgba(255,255,255,0.18)" />
        <Path d="M 41 54 Q 36 48, 42 43 Q 48 48, 41 54" fill="rgba(255,255,255,0.18)" />
        <Path d="M 52 44 Q 48 38, 54 34 Q 60 38, 52 44" fill="rgba(255,255,255,0.18)" />
        <Path d="M 124 100 Q 130 96, 125 90 Q 120 96, 124 100" fill="rgba(255,255,255,0.18)" />
        <Path d="M 128 84 Q 134 80, 129 74 Q 123 80, 128 84" fill="rgba(255,255,255,0.18)" />
        <Path d="M 126 68 Q 132 64, 127 58 Q 121 64, 126 68" fill="rgba(255,255,255,0.18)" />
        <Path d="M 119 54 Q 124 48, 118 43 Q 112 48, 119 54" fill="rgba(255,255,255,0.18)" />
        <Path d="M 108 44 Q 112 38, 106 34 Q 100 38, 108 44" fill="rgba(255,255,255,0.18)" />
        <Path
          d="M 80 44 L 114 53 L 118 92 L 80 112 L 42 92 L 46 53 Z"
          fill="#0c0d0e"
          stroke="#7CF5B0"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <Circle cx="80" cy="71" r="9" fill="#7CF5B0" />
        <Path d="M 66 94 C 66 84, 94 84, 94 94 Z" fill="#7CF5B0" />
      </Svg>
    </View>
  );
}

function StatTile({
  type,
  value,
  label,
  color,
}: {
  type: 'hours' | 'streak' | 'rank' | 'saved';
  value: string;
  label: string;
  color: string;
}) {
  const icon =
    type === 'hours' ? (
      <Path d="M4 2h16M4 26h16M5 2c0 8 6 10 7 12-1 2-7 4-7 12M19 2c0 8-6 10-7 12 1 2 7 4 7 12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    ) : type === 'streak' ? (
      <Path d="M12 2c0 0-4.5 4.5-4.5 9c0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5c0-4.5-4.5-9-4.5-9z" stroke={color} strokeWidth={2} />
    ) : type === 'saved' ? (
      <>
        <Circle cx="12" cy="14" r="8" stroke={color} strokeWidth={2} fill="none" />
        <Path d="M12 10v4l3 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </>
    ) : (
      <>
        <Rect x="3" y="14" width="4" height="11" rx="1" stroke={color} strokeWidth={2} />
        <Rect x="10" y="6" width="4" height="19" rx="1" stroke={color} strokeWidth={2} />
        <Rect x="17" y="10" width="4" height="15" rx="1" stroke={color} strokeWidth={2} />
      </>
    );

  return (
    <View style={styles.statCol}>
      <View style={styles.statGlowWrap}>
        <Svg width={30} height={36} viewBox="0 0 24 28" fill="none">
          {icon}
        </Svg>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

function MetricRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={{ alignItems: 'flex-end', flex: 1 }}>
        <Text style={styles.metricValue}>{value}</Text>
        {hint ? <Text style={styles.metricHint}>{hint}</Text> : null}
      </View>
    </View>
  );
}

function chartPath(values: number[]): string {
  const max = Math.max(1, ...values);
  return values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * (CHART_W - 34);
      const y = 12 + (1 - v / max) * 132;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
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
  const monthAchievements = earnedThisMonth(progress, windows.monthStart);
  const avgDailyAll = all.focusMinutes / Math.max(1, joinedDays);

  const series = useMemo(() => {
    const start = range === 'week' ? windows.thisStart : range === 'month' ? windows.monthStart : dateKey(new Date(firstOpenDate));
    const logs = dailySeries(progress, start > today ? today : start, today);
    return logs.slice(-Math.max(range === 'week' ? 7 : range === 'month' ? 14 : 21));
  }, [progress, range, windows.thisStart, windows.monthStart, firstOpenDate, today]);

  const path = chartPath(series.map((d) => d.focusMinutes));
  const fill = `${path} L ${CHART_W - 34} 148 L 0 148 Z`;
  const yMax = Math.max(60, ...series.map((d) => d.focusMinutes));
  const yLabels = [yMax, yMax * 0.66, yMax * 0.33, 0].map((n) => (n >= 60 ? `${Math.round(n / 60)}h` : `${Math.round(n)}m`));

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

  // Long-range comparison — this N-month block vs the equivalent block right
  // before it, so "am I improving" has an actual answer past the first month.
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Pressable onPress={onOpenSettings} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarWrap}>
          <ProfileAvatar />
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.betterLine}>Am I getting better?</Text>
        </Animated.View>

        <View style={styles.statsRow}>
          <StatTile type="streak" value={String(progress.currentStreak)} label="DAY STREAK" color="#FFD54F" />
          <StatTile type="hours" value={formatDuration(todayLog.focusMinutes)} label="TODAY FOCUS" color="#7CF5B0" />
          <StatTile type="rank" value={`${rank.percent}%`} label="GLOBAL" color="#4C6FFF" />
        </View>

        <View style={styles.bestRow}>
          <Text style={styles.bestLabel}>Best streak {progress.bestStreak} days</Text>
          <Text style={styles.bestLabel}>Saved {formatDuration(all.savedMinutes)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>DAY STREAK</Text>
          <View style={styles.streakHero}>
            <Text style={styles.flame}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakNum}>{progress.currentStreak} day{progress.currentStreak === 1 ? '' : 's'}</Text>
              {streakBroken ? (
                <Text style={styles.streakSub}>Streak paused. Your best is still {progress.bestStreak} days — pick it back up today.</Text>
              ) : (
                <Text style={styles.streakSub}>
                  Next spark: {streakGoal.next} days · {Math.max(0, streakGoal.next - progress.currentStreak)} to go
                </Text>
              )}
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.milestoneRow}>
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

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>GLOBAL RANKING</Text>
          <Text style={styles.rankHeadline}>You're doing better than {rank.percent}% of users.</Text>
          <Text style={styles.rankBody}>
            This is a percentile — not a public rank. It blends focus time, time saved, streak consistency, successful
            lock sessions, and distractions blocked. Nobody sees your name.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>AVERAGE FOCUS HOURS</Text>
          <MetricRow label="Today" value={formatDuration(todayLog.focusMinutes)} />
          <MetricRow label="Yesterday" value={formatDuration(yesterdayLog.focusMinutes)} />
          <MetricRow
            label="Compared with yesterday"
            value={formatSignedMinutes(focusDelta)}
            hint={focusDelta > 0 ? 'More protected time than yesterday.' : focusDelta < 0 ? 'Today is still counting.' : 'Holding steady.'}
          />
          <MetricRow label="Daily average" value={formatDuration(avgDailyAll)} />
          <MetricRow label="This week" value={formatDuration(week.avgDailyFocus)} hint="avg / day" />
          <MetricRow label="This month" value={formatDuration(month.avgDailyFocus)} hint="avg / day" />
          <MetricRow label="Since joining" value={formatDuration(all.focusMinutes)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>TIME SAVED</Text>
          <Text style={styles.savedHero}>You've saved {formatDuration(week.savedMinutes)} this week.</Text>
          <MetricRow label="Today" value={formatDuration(todayLog.savedMinutes)} />
          <MetricRow label="Yesterday" value={formatDuration(yesterdayLog.savedMinutes)} />
          <MetricRow label="This week" value={formatDuration(week.savedMinutes)} />
          <MetricRow label="This month" value={formatDuration(month.savedMinutes)} />
          <MetricRow label="Since starting" value={formatDuration(all.savedMinutes)} />
          {goalLine ? <Text style={styles.goalHint}>More room for: {goalLine}</Text> : null}
        </View>

        {longRange && (
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>{longRange.months}-MONTH COMPARISON</Text>
            <Text style={styles.rankHeadline}>
              {formatDuration(longRange.current.savedMinutes)} saved this {longRange.months}mo block
            </Text>
            <MetricRow
              label={`vs previous ${longRange.months}mo`}
              value={formatSignedMinutes(longRange.current.savedMinutes - longRange.previous.savedMinutes)}
              hint={
                longRange.current.savedMinutes >= longRange.previous.savedMinutes
                  ? "You're saving more than the equivalent stretch before this."
                  : 'The previous stretch was stronger — still real progress either way.'
              }
            />
            <MetricRow label="Focus hours this block" value={formatDuration(longRange.current.focusMinutes)} />
            <MetricRow
              label="Focus vs previous block"
              value={formatSignedMinutes(longRange.current.focusMinutes - longRange.previous.focusMinutes)}
            />
            <MetricRow label="Distractions blocked" value={String(longRange.current.distractionsBlocked)} />
            <MetricRow label="Hard unlocks completed" value={String(longRange.current.hardUnlocks)} />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>{range === 'week' ? 'WEEKLY' : range === 'month' ? 'MONTHLY' : LONG_RANGE_MONTHS[range] ? `${LONG_RANGE_MONTHS[range]}-MONTH` : 'ALL-TIME'} PROGRESS</Text>
          <MetricRow label="Focus hours" value={formatDuration(period.focusMinutes)} />
          <MetricRow label="Time saved" value={formatDuration(period.savedMinutes)} />
          <MetricRow label="Avg daily focus" value={formatDuration(period.avgDailyFocus)} />
          {range === 'week' ? (
            <>
              <MetricRow label="Successful lock sessions" value={String(week.lockSessions)} />
              <MetricRow
                label="Phone time vs last week"
                value={formatSignedMinutes(savedDelta)}
                hint={savedDelta >= 0 ? 'More time kept off distracting apps.' : 'Last week had a stronger save. This week is still open.'}
              />
              <MetricRow label="Current streak" value={`${progress.currentStreak} days`} />
            </>
          ) : (
            <>
              <MetricRow label="Screen-time reduction" value={formatDuration(month.savedMinutes)} />
              <MetricRow
                label="Best focus day"
                value={month.bestFocusDay.focusMinutes > 0 ? `${weekdayShort(month.bestFocusDay.date)} · ${formatDuration(month.bestFocusDay.focusMinutes)}` : '—'}
              />
              <MetricRow label="Longest streak" value={`${progress.bestStreak} days`} />
              <MetricRow
                label="Milestones this month"
                value={monthAchievements.length ? monthAchievements.map((a) => a.name).join(', ') : 'None yet'}
              />
            </>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeRow}>
          {(['week', 'month', '3mo', '6mo', '9mo', '12mo', 'all'] as const).map((r) => (
            <Pressable key={r} onPress={() => setRange(r)} style={[styles.rangePill, range === r && styles.rangePillActive]}>
              <Text style={styles.rangeText}>
                {r === 'week' ? 'Week' : r === 'month' ? 'Month' : r === 'all' ? 'All Time' : r.replace('mo', ' mo')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.chartWrap}>
          <Svg width={CHART_W} height={CHART_H}>
            <Defs>
              <SvgGradient id="pfill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#7CF5B0" stopOpacity="0.22" />
                <Stop offset="1" stopColor="#7CF5B0" stopOpacity="0" />
              </SvgGradient>
            </Defs>
            {[20, 62, 104, 146].map((y) => (
              <Line key={y} x1="0" y1={y} x2={CHART_W - 34} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            ))}
            <Path d={fill} fill="url(#pfill)" />
            <Path d={path} stroke="#7CF5B0" strokeWidth="2.5" fill="none" />
            {yLabels.map((t, i) => (
              <SvgText key={t + i} x={CHART_W - 26} y={26 + i * 42} fill="rgba(255,255,255,0.4)" fontSize="12">
                {t}
              </SvgText>
            ))}
          </Svg>
          <View style={styles.chartAxis}>
            {series.filter((_, i) => i === 0 || i === series.length - 1 || i === Math.floor(series.length / 2)).map((d, i) => (
              <Text key={`${d.date}-${i}`} style={styles.axisLabel}>
                {weekdayShort(d.date)}
              </Text>
            ))}
          </View>
        </View>

        {onOpenWeeklyInsight && (
          <Pressable onPress={onOpenWeeklyInsight} style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Weekly insight</Text>
            <Text style={styles.sectionLink}>This week ›</Text>
          </Pressable>
        )}

        {onOpenRealUsage && (
          <Pressable onPress={onOpenRealUsage} style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Real device usage</Text>
            <Text style={styles.sectionLink}>Android ›</Text>
          </Pressable>
        )}

        {onOpenCalendar && (
          <Pressable onPress={onOpenCalendar} style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Calendar</Text>
            <Text style={styles.sectionLink}>By day ›</Text>
          </Pressable>
        )}

        {onOpenProgressPhotos && (
          <Pressable onPress={onOpenProgressPhotos} style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Progress photos</Text>
            <Text style={styles.sectionLink}>Weekly ›</Text>
          </Pressable>
        )}

        <Pressable onPress={onOpenMilestones} style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Awards</Text>
          <Text style={styles.sectionLink}>{earnedDefs.length}/{ACHIEVEMENTS.length} ›</Text>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.awardRow}>
          {ACHIEVEMENTS.slice(0, 8).map((def) => {
            const earned = earnedIds.has(def.id);
            const stamp = progress.achievements.find((a) => a.id === def.id);
            return (
              <Pressable key={def.id} onPress={() => setShareTarget(def)} style={styles.awardCol}>
                <Medal medal={def.medal} locked={!earned} id={def.id} />
                <Text style={styles.awardName} numberOfLines={1}>{def.name}</Text>
                <Text style={styles.awardSub} numberOfLines={2}>
                  {earned && stamp ? formatPrettyDate(stamp.earnedAt) : def.statLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </ScrollView>

      <Modal visible={!!shareTarget} transparent animationType="fade" onRequestClose={() => setShareTarget(null)}>
        <Pressable style={styles.modalBg} onPress={() => setShareTarget(null)}>
          <Pressable style={styles.shareCard} onPress={() => {}}>
            {shareTarget && (
              <>
                <LinearGradient colors={['#1a2430', '#0b0d10']} style={StyleSheet.absoluteFill} />
                <Text style={styles.shareBrand}>◯ Focus</Text>
                <Medal medal={shareTarget.medal} size={88} locked={!earnedIds.has(shareTarget.id)} id={`share-${shareTarget.id}`} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGlyph: { color: colors.text, fontSize: 19 },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  avatarWrap: { alignItems: 'center', marginTop: 6 },
  avatarContainer: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  username: { color: colors.text, fontSize: 25, fontWeight: '800', marginTop: 10, letterSpacing: -0.5 },
  betterLine: { color: colors.textDim, fontSize: 13, marginTop: 6 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 22, width: '100%' },
  statCol: { alignItems: 'center', width: 100 },
  statGlowWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { color: '#ffffff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginTop: 4 },
  bestRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  bestLabel: { color: colors.textDim, fontSize: 12.5, fontWeight: '600' },
  card: {
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardEyebrow: { color: colors.textFaint, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10 },
  streakHero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flame: { fontSize: 40 },
  streakNum: { color: '#FFD54F', fontSize: 26, fontWeight: '800' },
  streakSub: { color: '#e8d9a8', fontSize: 13.5, marginTop: 4, lineHeight: 18 },
  milestoneRow: { gap: 8, marginTop: 16, paddingRight: 8 },
  milestoneChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  milestoneChipOn: { backgroundColor: 'rgba(255,213,79,0.16)', borderColor: 'rgba(255,213,79,0.4)' },
  milestoneText: { color: colors.textDim, fontSize: 13, fontWeight: '700' },
  milestoneTextOn: { color: '#FFD54F' },
  rankHeadline: { color: colors.text, fontSize: 22, fontWeight: '800', lineHeight: 28 },
  rankBody: { color: colors.textDim, fontSize: 13.5, lineHeight: 20, marginTop: 10 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
  metricLabel: { color: colors.textDim, fontSize: 14, flex: 1, paddingRight: 12 },
  metricValue: { color: colors.text, fontSize: 15, fontWeight: '700' },
  metricHint: { color: colors.textFaint, fontSize: 12, marginTop: 3, textAlign: 'right' },
  savedHero: { color: colors.accent, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  goalHint: { color: colors.textDim, fontSize: 13.5, lineHeight: 19, marginTop: 8 },
  rangeRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  rangePill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  rangePillActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  rangeText: { color: colors.text, fontSize: 14.5, fontWeight: '600' },
  chartWrap: { marginTop: 24 },
  chartAxis: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 30, marginTop: 2 },
  axisLabel: { color: colors.textDim, fontSize: 12.5 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 28 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  sectionLink: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  awardRow: { gap: 16, paddingRight: 12, marginTop: 14 },
  awardCol: { width: 96, alignItems: 'center' },
  awardName: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  awardSub: { color: colors.textDim, fontSize: 11.5, marginTop: 3, textAlign: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  shareCard: {
    width: '100%',
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 320,
  },
  shareBrand: { color: colors.accent, fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 16, alignSelf: 'flex-start' },
  shareName: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 10 },
  shareDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  shareStat: { color: '#7CF5B0', fontSize: 13, fontWeight: '700', marginTop: 14 },
  sharePrivacy: { color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 17 },
  shareBtn: {
    marginTop: 18,
    backgroundColor: '#7CF5B0',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 22,
  },
  shareBtnText: { color: '#04140c', fontSize: 15, fontWeight: '800' },
});
