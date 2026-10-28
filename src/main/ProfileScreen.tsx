import Svg, { Circle, G } from 'react-native-svg';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GateReflection } from '../data/store';
import { fonts, gradients, palette, space, radius } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';
import {
  ACHIEVEMENTS,
  AchievementDef,
  ProgressState,
  STREAK_MILESTONES,
  addDays,
  dailySeries,
  dateKey,
  daysSinceJoin,
  formatDuration,
  formatPrettyDate,
  formatSignedMinutes,
  getAchievement,
  getDay,
  nextStreakMilestone,
  shareMessage,
  sumRange,
  totals,
  weekdayShort,
  weeklyWindows,
} from '../data/progress';
import Medal from './profile/Medal';

const { width } = Dimensions.get('window');
const GUTTER = 16;
const GAP = 12;
const CONTENT_W = width - GUTTER * 2;
const HALF_W = (CONTENT_W - GAP) / 2;
const HEATMAP_WEEKS = 12;
const TILE_BG = 'rgba(46,49,54,0.055)';
const TILE_BORDER = 'rgba(46,49,54,0.09)';

function compactDuration(minutes: number): string {
  if (minutes >= 6000) return `${Math.round(minutes / 60)}h`;
  return formatDuration(minutes);
}

/** "2h 15m" as big figures with small dim units, so it never has to truncate. */
function DurationBig({ minutes, size }: { minutes: number; size: number }) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  const parts: [string, string][] = h > 0 ? [[String(h), 'h'], [String(m), 'm']] : [[String(m), 'm']];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'nowrap' }}>
      {parts.map(([n, u], i) => (
        <React.Fragment key={u}>
          <Text style={[styles.durNum, { fontSize: size, lineHeight: size + 4, marginLeft: i ? 6 : 0 }]}>{n}</Text>
          <Text style={[styles.durUnit, { fontSize: Math.round(size * 0.38) }]}>{u}</Text>
        </React.Fragment>
      ))}
    </View>
  );
}

/** A rounded dark tile, the unit the whole screen is built from. */
function Tile({
  children,
  style,
  onPress,
  label,
}: {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  label?: string;
}) {
  const C: React.ComponentType<any> = onPress ? Pressable : View;
  return (
    <C style={[styles.tile, style]} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={label}>
      {children}
    </C>
  );
}

/** Streak count inside a ring that fills toward the next milestone. */
function StreakRing({ value, next, size = 96 }: { value: number; next: number; size?: number }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / Math.max(1, next)));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(46,49,54,0.12)" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={palette.text}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - pct)}
          />
        </G>
      </Svg>
      <Text style={styles.ringNum}>{value}</Text>
    </View>
  );
}

/** Weeks of days as dots: bright where there was focus, dim where there was none. */
function DotHeat({ data, cols }: { data: { value: number; today?: boolean }[]; cols: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const rows = 7;
  const pad = cols * rows - data.length;
  const cells = [...Array(Math.max(0, pad)).fill(null), ...data];
  const dot = 9;
  return (
    <View style={styles.dotGrid}>
      {Array.from({ length: cols }).map((_, c) => (
        <View key={c} style={styles.dotCol}>
          {Array.from({ length: rows }).map((__, r) => {
            const cell = cells[c * rows + r] as { value: number; today?: boolean } | null;
            const on = !!cell && cell.value > 0;
            const a = on ? 0.45 + 0.55 * (cell!.value / max) : 0;
            return (
              <View
                key={r}
                style={{
                  width: dot,
                  height: dot,
                  borderRadius: dot / 2,
                  backgroundColor: !cell ? 'transparent' : on ? `rgba(143,214,148,${a})` : 'rgba(46,49,54,0.13)',
                  borderWidth: cell?.today ? 1.5 : 0,
                  borderColor: palette.text,
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** Seven slim bars for the last seven days. */
function WeekBars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(1, ...values);
  return (
    <View style={styles.weekBars}>
      {values.map((v, i) => (
        <View key={i} style={styles.weekCol}>
          <View style={styles.weekTrack}>
            <View style={[styles.weekFill, { height: `${Math.max(v > 0 ? 8 : 0, (v / max) * 100)}%` }]} />
          </View>
          <Text style={styles.weekLbl}>{labels[i]}</Text>
        </View>
      ))}
    </View>
  );
}

function LinkTile({ title, sub, icon, onPress }: { title: string; sub: string; icon: IconName; onPress: () => void }) {
  return (
    <Tile style={styles.linkTile} onPress={onPress} label={title}>
      <Icon name={icon} size={20} color={palette.text} strokeWidth={1.8} />
      <View style={{ flex: 1 }} />
      <Text style={styles.linkTitle}>{title}</Text>
      <Text style={styles.tileSub}>{sub}</Text>
    </Tile>
  );
}

export default function ProfileScreen({
  onBack,
  onOpenSettings,
  onOpenMilestones,
  onOpenProgressPhotos,
  progressPhotos = [],
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
  progressPhotos?: { date: string; uri: string }[];
  onOpenCalendar?: () => void;
  onOpenRealUsage?: () => void;
  onOpenWeeklyInsight?: () => void;
  progress: ProgressState;
  gateReflections?: GateReflection[];
  username: string;
  firstOpenDate: string;
  goalLine?: string;
}) {
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
  const joinedDays = daysSinceJoin(firstOpenDate, today);
  const streakGoal = nextStreakMilestone(progress.currentStreak);
  const streakBroken = progress.currentStreak === 0 && progress.bestStreak > 0;
  const focusDelta = todayLog.focusMinutes - yesterdayLog.focusMinutes;
  const earnedIds = new Set(progress.achievements.map((a) => a.id));
  const avgDailyAll = all.focusMinutes / Math.max(1, joinedDays);

  const weekSeries = dailySeries(progress, addDays(today, -6), today);
  const weekValues = weekSeries.map((d) => d.focusMinutes);
  const weekLabels = weekSeries.map((d) => weekdayShort(d.date).slice(0, 1));

  const heatData = useMemo(() => {
    const start = addDays(today, -(HEATMAP_WEEKS * 7 - 1));
    const from = start < dateKey(new Date(firstOpenDate)) ? dateKey(new Date(firstOpenDate)) : start;
    return dailySeries(progress, from > today ? today : from, today).map((d) => ({
      value: d.focusMinutes,
      today: d.date === today,
    }));
  }, [progress, firstOpenDate, today]);
  const heatActiveDays = heatData.filter((d) => d.value > 0).length;

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

  const headline =
    todayLog.focusMinutes > 0 ? 'Good going today' : progress.currentStreak > 0 ? 'Keep it going' : 'Your progress';
  const daysToGo = Math.max(0, streakGoal.next - progress.currentStreak);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...gradients.ground]}
        locations={[...gradients.groundLocations]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10} accessibilityLabel="Back">
            <Icon name="chevronLeft" size={20} color={palette.text} strokeWidth={2} />
          </Pressable>
          <Pressable onPress={onOpenSettings} style={styles.circleBtn} hitSlop={10} accessibilityLabel="Settings">
            <Icon name="settings" size={19} color={palette.text} strokeWidth={1.8} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(380)}>
            <Text style={styles.title}>{headline}</Text>
            {!!username && <Text style={styles.titleSub}>{username}</Text>}
          </Animated.View>

          {/* Streak and today, side by side. */}
          <View style={styles.row}>
            <Tile style={styles.half} onPress={onOpenMilestones} label="Day streak">
              <StreakRing value={progress.currentStreak} next={streakGoal.next} />
              <View style={{ flex: 1 }} />
              <Text style={styles.tileTitle}>{progress.currentStreak === 1 ? 'Day streak' : 'Day streak'}</Text>
              <Text style={styles.tileSub}>
                {streakBroken ? `Best ${progress.bestStreak}. Start again today` : `${daysToGo} ${daysToGo === 1 ? 'day' : 'days'} to a ${streakGoal.next}-day award`}
              </Text>
            </Tile>
            <Tile style={styles.half}>
              <DurationBig minutes={todayLog.focusMinutes} size={44} />
              <View style={{ flex: 1 }} />
              <Text style={styles.tileTitle}>Focused today</Text>
              <Text style={styles.tileSub}>
                {focusDelta === 0 ? 'Same as yesterday' : `${formatSignedMinutes(focusDelta)} vs yesterday`}
              </Text>
            </Tile>
          </View>

          {/* Dots: every day, at a glance. */}
          <Tile onPress={onOpenCalendar} label="Calendar">
            <View style={styles.tileHead}>
              <Text style={styles.tileTitle}>Last {HEATMAP_WEEKS} weeks</Text>
              {!!onOpenCalendar && <Icon name="chevronRight" size={16} color={palette.textQuaternary} strokeWidth={2} />}
            </View>
            <DotHeat data={heatData} cols={HEATMAP_WEEKS} />
            <Text style={styles.tileSub}>{heatActiveDays} active days</Text>
          </Tile>

          {/* One big number, full width. */}
          <Tile style={styles.wideRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tileTitle}>Time reclaimed</Text>
              <Text style={styles.tileSub}>{compactDuration(Math.round(avgDailyAll))} focus a day on average</Text>
            </View>
            <DurationBig minutes={all.savedMinutes} size={34} />
          </Tile>

          {/* The week, and what is next. */}
          <View style={styles.row}>
            <Tile style={styles.half}>
              <Text style={styles.tileTitle}>This week</Text>
              <Text style={styles.tileSub}>{week.daysWithFocus}/7 days</Text>
              <View style={{ flex: 1 }} />
              <WeekBars values={weekValues} labels={weekLabels} />
            </Tile>
            <Tile style={styles.half} onPress={onOpenMilestones} label="Awards">
              <Text style={styles.tileTitle}>Awards</Text>
              <Text style={styles.tileSub}>
                {progress.achievements.length} of {ACHIEVEMENTS.length}
              </Text>
              <View style={{ flex: 1 }} />
              <View style={styles.medalRow}>
                {ACHIEVEMENTS.slice(0, 3).map((def) => (
                  <Pressable key={def.id} onPress={() => setShareTarget(def)}>
                    <Medal medal={def.medal} def={def} locked={!earnedIds.has(def.id)} id={`p-${def.id}`} size={40} />
                  </Pressable>
                ))}
              </View>
            </Tile>
          </View>

          {/* Photos. */}
          {onOpenProgressPhotos && (
            <Tile onPress={onOpenProgressPhotos} label="Progress photos">
              <View style={styles.tileHead}>
                <Text style={styles.tileTitle}>
                  {progressPhotos.length > 0
                    ? `${progressPhotos.length} photo${progressPhotos.length === 1 ? '' : 's'}`
                    : 'Progress photos'}
                </Text>
                <Icon name="chevronRight" size={16} color={palette.textQuaternary} strokeWidth={2} />
              </View>
              {progressPhotos.length > 0 ? (
                <View style={styles.photoStrip}>
                  {progressPhotos.slice(0, 4).map((ph) => (
                    <Image key={ph.date} source={{ uri: ph.uri }} style={styles.photoThumb} />
                  ))}
                </View>
              ) : (
                <Text style={styles.tileSub}>One a week. Months from now it is the record of this.</Text>
              )}
            </Tile>
          )}

          {goalLine ? (
            <Tile>
              <Text style={styles.tileSub}>More room for</Text>
              <Text style={styles.goalText}>{goalLine}</Text>
            </Tile>
          ) : null}

          {/* Reports live here, out of the way of Home. */}
          <View style={styles.row}>
            {onOpenWeeklyInsight && (
              <LinkTile title="Weekly insight" sub="Your last 7 days" icon="pulse" onPress={onOpenWeeklyInsight} />
            )}
            {onOpenRealUsage && (
              <LinkTile title="Screen time" sub="By app, on this phone" icon="bars" onPress={onOpenRealUsage} />
            )}
          </View>

          {gateReflections.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Your words</Text>
              {[...gateReflections].reverse().slice(0, 8).map((w, i) => (
                <Tile key={`${w.date}-${i}`}>
                  <Text style={styles.tileSub}>{formatPrettyDate(w.date)}</Text>
                  <Text style={styles.wordText}>“{w.text}”</Text>
                  <Text style={[styles.tileSub, { color: w.unlocked ? palette.textTertiary : palette.accent }]}>
                    {w.unlocked ? 'You went in anyway.' : 'You backed out. That one counted.'}
                  </Text>
                </Tile>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={!!shareTarget} transparent animationType="fade" onRequestClose={() => setShareTarget(null)}>
        <Pressable style={styles.modalBg} onPress={() => setShareTarget(null)}>
          <Pressable style={styles.shareCard} onPress={() => {}}>
            {shareTarget && (
              <>
                <LinearGradient colors={['#12241A', '#0B0B0D']} style={StyleSheet.absoluteFill} />
                <Text style={styles.shareBrand}>Phonewise</Text>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.base },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: GUTTER, paddingTop: 4 },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TILE_BG,
    borderWidth: 1,
    borderColor: TILE_BORDER,
  },
  scroll: { paddingHorizontal: GUTTER, paddingBottom: 140, gap: GAP },
  title: { fontFamily: fonts.serif, fontSize: 36, lineHeight: 42, color: palette.text, marginTop: 8, letterSpacing: -0.5 },
  titleSub: { color: palette.textTertiary, fontFamily: fonts.medium, fontSize: 14, marginTop: 2, marginBottom: 4 },
  row: { flexDirection: 'row', gap: GAP },
  half: { width: HALF_W, height: 188 },
  tile: {
    backgroundColor: TILE_BG,
    borderWidth: 1,
    borderColor: TILE_BORDER,
    borderRadius: 28,
    padding: 18,
    gap: 6,
  },
  tileHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileTitle: { color: palette.text, fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  tileSub: { color: palette.textTertiary, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  ringNum: { color: palette.text, fontFamily: fonts.system, fontSize: 34, fontWeight: '600', letterSpacing: -1 },
  durNum: { color: palette.text, fontFamily: fonts.system, fontWeight: '300', letterSpacing: -2 },
  durUnit: { color: palette.textTertiary, fontFamily: fonts.medium, marginLeft: 2 },
  bigNum: { color: palette.text, fontFamily: fonts.system, fontSize: 56, fontWeight: '300', letterSpacing: -2.5 },
  bigNumSm: { color: palette.text, fontFamily: fonts.system, fontSize: 40, fontWeight: '300', letterSpacing: -1.5 },
  wideRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 20 },
  dotGrid: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  dotCol: { gap: 6 },
  weekBars: { flexDirection: 'row', gap: 6, height: 74 },
  weekCol: { flex: 1, alignItems: 'center', gap: 4 },
  weekTrack: { flex: 1, width: '100%', borderRadius: 5, backgroundColor: 'rgba(46,49,54,0.08)', justifyContent: 'flex-end', overflow: 'hidden' },
  weekFill: { width: '100%', borderRadius: 5, backgroundColor: palette.accent },
  weekLbl: { color: palette.textQuaternary, fontSize: 10, fontFamily: fonts.medium },
  medalRow: { flexDirection: 'row', gap: 6 },
  photoStrip: { flexDirection: 'row', gap: 8, marginTop: 6 },
  photoThumb: { width: (CONTENT_W - 36 - 24) / 4, aspectRatio: 0.8, borderRadius: 14, backgroundColor: palette.surfaceHigh },
  goalText: { color: palette.text, fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  linkTile: { width: HALF_W, height: 120 },
  linkTitle: { color: palette.text, fontFamily: fonts.semibold, fontSize: 15 },
  sectionTitle: { color: palette.text, fontFamily: fonts.semibold, fontSize: 18, marginTop: 10 },
  wordText: { color: palette.text, fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 17, lineHeight: 24 },
  modalBg: { flex: 1, backgroundColor: palette.scrim, alignItems: 'center', justifyContent: 'center', padding: 28 },
  shareCard: { width: '100%', maxWidth: 340, borderRadius: 28, padding: 24, alignItems: 'center', overflow: 'hidden', gap: 8, borderWidth: 1, borderColor: TILE_BORDER },
  shareBrand: { color: palette.textTertiary, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.6 },
  shareName: { color: palette.text, fontFamily: fonts.bold, fontSize: 22, marginTop: 6 },
  shareDesc: { color: palette.textSecondary, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  shareStat: { color: palette.accent, fontFamily: fonts.semibold, fontSize: 13, marginTop: 4 },
  sharePrivacy: { color: palette.textQuaternary, fontSize: 11, textAlign: 'center', marginTop: 6 },
  shareBtn: { marginTop: 10, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 22, backgroundColor: palette.text },
  shareBtnText: { color: palette.textInverse, fontFamily: fonts.semibold, fontSize: 14 },
});
