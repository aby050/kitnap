import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import BlockedAppsPill from '../components/BlockedAppsPill';
import ScreenTimeCard from '../components/ScreenTimeCard';
import { getIntensity, IntensityKey } from '../data/themes';
import { PresetSections } from '../components/PresetCard';
import WeeklyInsight from '../main/WeeklyInsight';
import { dateKey, getDay, nextStreakMilestone, ProgressState } from '../data/progress';
import {
  Button,
  Card,
  Divider,
  Editorial,
  IconButton,
  Meter,
  Pill,
  Ring,
  Row,
  Screen,
  Stat,
} from '../design/primitives';
import AppGlyph from '../ui/AppGlyph';
import BailoutGlyph from '../components/BailoutGlyph';
import BailoutSheet from '../components/BailoutSheet';
import Icon from '../ui/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { AMBIENCES, mediaFor } from '../data/ambiences';
import { tapLight } from '../ui/haptics';
import { dataRamp, fonts, motion, palette, radius, space, type } from '../design/tokens';
import KnockoutLabel from '../components/KnockoutLabel';
import { SafeAreaView } from 'react-native-safe-area-context';
import LineArt from '../onboarding/LineArt';
import { HIGHLIGHT, INK, INK_DIM, InkButton, PAPER } from '../onboarding/PastelCard';
import { ruleIcon, scheduleStatus } from './MyAppsScreen';
import BlockedSelection from '../components/BlockedSelection';
import { installedLabel } from '../data/installedApps';

/** A commitment runs from half an hour up to a week. */
/** The three whose posters read best at thumbnail size — a strip of muddy
 *  crops would undersell the thing it is advertising. */
const ROOM_PREVIEW = ['meditate', 'family', 'night']
  .map((k) => AMBIENCES.find((a) => a.key === k))
  .filter((a): a is (typeof AMBIENCES)[number] => !!a);

const MIN_BLOCK_MINUTES = 30;
const MAX_BLOCK_MINUTES = 7 * 24 * 60;

/** Every press moves exactly 15 minutes. Holding doesn't change that amount —
 *  it just repeats faster the longer the finger stays down, so the top of the
 *  30m–7d range is reachable in seconds while each value on the way is still
 *  a real stop the user could land on. */
const HOLD_STEP_MINUTES = 15;
function holdDelay(heldMs: number): number {
  if (heldMs < 800) return 220;
  if (heldMs < 2000) return 110;
  if (heldMs < 4000) return 55;
  return 20;
}

/** Keeps the value on the 15-minute grid and always moves at least one step. */
function stepTo(current: number, dir: number): number {
  const step = HOLD_STEP_MINUTES;
  const raw =
    dir > 0
      ? Math.floor(current / step) * step + step
      : Math.ceil(current / step) * step - step;
  return Math.min(MAX_BLOCK_MINUTES, Math.max(MIN_BLOCK_MINUTES, raw));
}

/** The smaller unit is always spelled out, including when it's zero — "1h 0m",
 *  not "1h". The stepper reads as a dial the user is turning, and a component
 *  that vanishes at zero makes the value jump around as it crosses an hour. */
function formatBlockLength(minutes: number): string {
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Two [number, unit] pairs for the big light-weight time figure — the digit
 *  is hero-sized, the unit small and dim, matching the app's stat treatment. */
function timePairs(pairs: [string, string][], compact = false) {
  return (
    <View style={styles.heroRow}>
      {pairs.map(([n, u], i) => (
        <View key={i} style={styles.heroPair}>
          <Text style={[type.hero, compact && styles.heroCompact]}>{n}</Text>
          <Text style={type.unit}>{u}</Text>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen({
  onOpenProfile,
  onOpenApps,
  onTriggerShield,
  onOpenRooms,
  onOpenGuardian,
  guardianName = null,
  onOpenProgressPhotos,
  progressPhotos = [],
  photoDue = false,
  sessionRunning = false,
  onStartBlock,
  onStartRest,
  onStartPreset,
  onOpenSleepSchedule,
  onOpenBlockedApps,
  onBuyBailouts,
  progress,
  goalLine,
  bailoutBalance = 0,
  bailoutFromPrice = null,
  onOpenDifficulty,
  intensityKey,
  blockedPackages = [],
  unlockNumber,
  score = 0,
  scoreTrendUp = true,
  focusPresetMinutes = 25,
  restPresetMinutes = 90,
  sleepHours = 0,
  usage,
  dailyGoalMinutes = null,
  onChangeGoal,
  schedules = [],
  onOpenSchedules,
}: {
  onOpenProfile: () => void;
  onOpenApps: () => void;
  onTriggerShield: () => void;
  /** Jumps to the Timer tab, where the rooms live. */
  onOpenRooms?: () => void;
  /** Opens Guardian setup. Absent hides the card entirely. */
  onOpenGuardian?: () => void;
  /** Set means Guardian is live — the card becomes a status display. */
  guardianName?: string | null;
  onOpenProgressPhotos?: () => void;
  /** Oldest first, as stored. */
  progressPhotos?: { date: string; uri: string }[];
  /** Seven days since the last one — the card leads with the prompt. */
  photoDue?: boolean;
  /** A committed block is counting down — the blocked list freezes. */
  sessionRunning?: boolean;
  /** Starts the real timer at the chosen length and hands the screen over to
   *  it. Home deliberately keeps no clock of its own — it used to run a second,
   *  independent countdown that had nothing to do with the Timer tab. */
  onStartBlock?: (minutes: number) => void;
  onStartRest?: () => void;
  /** Start an arbitrary preset session (from the For you / Detox cards). */
  onStartPreset?: (minutes: number, label: string, hardMode?: boolean) => void;
  onOpenSleepSchedule?: () => void;
  onOpenBlockedApps?: () => void;
  /** Opens the Bailout store (real screen) from inside the header sheet. */
  onBuyBailouts?: () => void;
  /** Drives the "This week" card. Absent on first run, when there is no
   *  week to report yet and the card simply doesn't render. */
  progress?: ProgressState;
  goalLine?: string;
  /** Emergency tokens in hand — shown in the header sheet. */
  bailoutBalance?: number;
  /** Cheapest bailout pack's price, passed straight to the sheet. */
  bailoutFromPrice?: string | null;
  /** Opens the Steady/Strict picker (real screen, already exists). */
  onOpenDifficulty?: () => void;
  intensityKey?: IntensityKey;
  blockedPackages?: string[];
  unlockNumber: number;
  score?: number;
  scoreTrendUp?: boolean;
  focusPresetMinutes?: number;
  restPresetMinutes?: number;
  sleepHours?: number;
  /** Real per-app device usage. `available:false` off Android — we show an
   *  honest prompt there instead of inventing numbers. */
  usage?: {
    totalMinutes: number | null;
    apps: { packageName: string; label: string; minutes: number }[];
    available: boolean;
    granted: boolean;
  };
  /** Daily screen-time goal in minutes, or null when none is set. */
  dailyGoalMinutes?: number | null;
  onChangeGoal?: (minutes: number | null) => void;
  /** Recurring auto-blocks, shown under the start button. */
  schedules?: { id: string; name: string; start: string; end: string; days: string }[];
  onOpenSchedules?: () => void;
}) {
  // ---- Commitment timer state ----
  // Held in minutes, not days+hours: the floor is half an hour, which whole
  // hours can't express. 30m is the default commitment, 7d the ceiling.
  const [durationMinutes, setDurationMinutes] = useState(MIN_BLOCK_MINUTES);
  const [showBailout, setShowBailout] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Geometry for the knocked-out CTA label — see the Button in the render.
   * `ctaY` is a WINDOW coordinate, so the gradient fill lines up with the
   * real ground behind the pill rather than with the scroll content. */
  const ctaRef = useRef<View>(null);
  const [ctaSize, setCtaSize] = useState({ width: 0, height: 0 });
  const [ctaY, setCtaY] = useState(0);

  // Spring-pop the hero ring whenever the duration changes.
  const heroScale = useSharedValue(1);
  const heroAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: heroScale.value }] }));

  const stopAdjust = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  // A self-rescheduling timeout rather than an interval, so each repeat can
  // pick a shorter delay than the last: the first step lands immediately on
  // press (a tap is one 15m nudge), then the hold winds up.
  const startAdjust = (dir: number) => {
    stopAdjust();
    tapLight();
    const pressedAt = Date.now();
    const tick = () => {
      tapLight();
      setDurationMinutes((c) => stepTo(c, dir));
      // Micro-pop on each step so the ring feels alive.
      heroScale.value = withSpring(1.04, { damping: 10, stiffness: 400 }, () => {
        heroScale.value = withSpring(1, { damping: 14, stiffness: 300 });
      });
      holdTimer.current = setTimeout(tick, holdDelay(Date.now() - pressedAt));
    };
    tick();
  };

  useEffect(() => stopAdjust, []);

  const handleStart = () => onStartBlock?.(durationMinutes);

  const heroPairs: [string, string][] = (() => {
    const d = Math.floor(durationMinutes / 1440);
    const h = Math.floor((durationMinutes % 1440) / 60);
    const m = durationMinutes % 60;
    if (d > 0) return [[String(d), d === 1 ? 'day' : 'days'], [String(h), 'hr']];
    if (h > 0) return [[String(h), h === 1 ? 'hour' : 'hours'], [String(m), 'min']];
    return [[String(m), 'min'], ['', '']];
  })();

  
  // ---- Screen time card data ----
  const totalMinutes = usage?.totalMinutes ?? null;
  const topApps = (usage?.apps ?? []).slice(0, 3);
  const peakMinutes = Math.max(1, ...topApps.map((a) => a.minutes));
  const screenTimeLabel =
    totalMinutes === null
      ? '—'
      : totalMinutes >= 60
        ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
        : `${totalMinutes}m`;
  const fmtMin = (m: number) =>
    m >= 60 ? (m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`) : `${m}m`;

  // ---- Today strip ----
  const today = progress ? getDay(progress, dateKey()) : null;
  const streak = progress?.currentStreak ?? 0;
  const streakNext = nextStreakMilestone(streak).next;
  const overGoal = dailyGoalMinutes != null && totalMinutes != null && totalMinutes > dailyGoalMinutes;
  /** Tap cycles a small set of goals; past the last one it clears. Fewer
   *  decisions than a picker, and every option is a reasonable day. */
  const GOALS = [60, 120, 180, 240];
  const cycleGoal = () => {
    if (!onChangeGoal) return;
    const i = dailyGoalMinutes == null ? -1 : GOALS.indexOf(dailyGoalMinutes);
    onChangeGoal(i + 1 < GOALS.length ? GOALS[i + 1] : null);
  };

  const ctaLabel = Platform.OS === 'ios' ? 'Start focus lock' : 'Start block';
  return (
    <SafeAreaView style={P.root} edges={['top']}>
      <ScrollView contentContainerStyle={P.scroll} showsVerticalScrollIndicator={false}>
        <View style={P.header}>
          <View>
            <Pressable onPress={() => setShowBailout(true)} style={P.iconBtn} accessibilityLabel="Bailouts" hitSlop={6}>
              <BailoutGlyph size={20} color={INK} />
            </Pressable>
            {bailoutBalance > 0 && (
              <View style={P.badge}>
                <Text style={P.badgeText}>{bailoutBalance}</Text>
              </View>
            )}
          </View>
          <Text style={P.wordmark}>phonewise</Text>
          <Pressable onPress={onOpenProfile} style={P.iconBtn} accessibilityLabel="Open profile" hitSlop={6}>
            <Icon name="user" size={20} color={INK} />
          </Pressable>
        </View>

        <Animated.View entering={FadeIn.duration(500)}>
          <LineArt name="phoneLock" height={190} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(motion.transition)}>
          <Text style={P.headline}>
            A serious block. <Text style={{ color: HIGHLIGHT }}>No way around it.</Text>
          </Text>
          <Text style={P.promise}>
            No push-ups, no puzzles, no bypass. Use it only when you are serious about changing your life.
          </Text>
        </Animated.View>

        {Platform.OS === 'ios' && sessionRunning && (
          <View style={P.runningBanner}>
            <View style={P.dot} />
            <Text style={P.runningText}>Focus lock running — nothing unlocks until it ends</Text>
          </View>
        )}

        <Animated.View entering={FadeInDown.delay(60).duration(motion.transition)} style={[P.card, heroAnimStyle]}>
          <View style={P.cardHead}>
            <Text style={P.overline}>{Platform.OS === 'ios' ? 'FOCUS LOCK' : 'LOCKED APPS'}</Text>
            <Pressable onPress={onOpenApps} hitSlop={8}>
              <Text style={P.link}>Manage</Text>
            </Pressable>
          </View>
          {Platform.OS === 'ios' ? (
            <BlockedSelection compact />
          ) : blockedPackages.length > 0 ? (
            <Pressable style={P.lockGrid} onPress={onOpenApps} accessibilityLabel="Blocked apps">
              {blockedPackages.slice(0, 11).map((pkg) => (
                <AppGlyph key={pkg} name={installedLabel(pkg) ?? pkg} packageName={pkg} size={38} />
              ))}
              {blockedPackages.length > 11 && (
                <View style={P.lockMore}>
                  <Text style={P.lockMoreText}>+{blockedPackages.length - 11}</Text>
                </View>
              )}
            </Pressable>
          ) : (
            <Pressable onPress={onOpenApps} style={{ paddingVertical: 8 }}>
              <Text style={P.link}>Choose the apps to lock</Text>
            </Pressable>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(motion.transition)} style={P.stepper}>
          <Pressable style={P.stepBtn} onPressIn={() => startAdjust(-1)} onPressOut={stopAdjust} hitSlop={8}>
            <Icon name="minus" size={20} color={INK} />
          </Pressable>
          <View style={P.stepValue}>
            <Text style={P.stepText}>{formatBlockLength(durationMinutes)}</Text>
          </View>
          <Pressable style={P.stepBtn} onPressIn={() => startAdjust(1)} onPressOut={stopAdjust} hitSlop={8}>
            <Icon name="plus" size={20} color={INK} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(motion.transition)} style={P.cta}>
          <InkButton label={ctaLabel} onPress={handleStart} />
          {Platform.OS === 'ios' && <BlockedAppsPill running={sessionRunning} onUnlock={onTriggerShield} />}
        </Animated.View>

        {schedules.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <View style={P.cardHead}>
              <Text style={P.sectionTitle}>Auto-blocks</Text>
              {onOpenSchedules && (
                <Pressable onPress={onOpenSchedules} hitSlop={8}>
                  <Text style={P.link}>Edit</Text>
                </Pressable>
              )}
            </View>
            <View style={[P.card, { paddingVertical: 4, marginTop: 10 }]}>
              {schedules.map((rule, i) => {
                const status = scheduleStatus(rule.start, rule.end);
                return (
                  <Pressable key={rule.id} onPress={onOpenSchedules} style={[P.ruleRow, i > 0 && P.ruleDivider]}>
                    <View style={{ flex: 1 }}>
                      <Text style={P.ruleName} numberOfLines={1}>{rule.name}</Text>
                      <Text style={P.ruleSub}>{`${rule.days} · ${rule.start}–${rule.end}`}</Text>
                    </View>
                    <View style={[P.statusPill, status.active && P.statusPillOn]}>
                      <Text style={[P.statusPillText, status.active && { color: '#FFFFFF' }]}>{status.label}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {showBailout && (
        <BailoutSheet
          balance={bailoutBalance}
          fromPrice={bailoutFromPrice}
          onBuy={() => {
            setShowBailout(false);
            onBuyBailouts?.();
          }}
          onClose={() => setShowBailout(false)}
        />
      )}
    </SafeAreaView>
  );
}

/** Paper look, shared with onboarding: off-white page, ink outlines, one orange accent. */
const P = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAPER },
  scroll: { paddingHorizontal: 24, paddingTop: 6, paddingBottom: space.tabClearance },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  wordmark: { color: INK, fontFamily: fonts.medium, fontSize: 18, fontWeight: '500' },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: INK,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: HIGHLIGHT, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  headline: { color: INK, fontFamily: fonts.bold, fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.6, marginTop: 4 },
  promise: { color: INK_DIM, fontSize: 15.5, lineHeight: 22, marginTop: 10 },
  runningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 16,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: INK,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: HIGHLIGHT },
  runningText: { color: INK, fontSize: 13, fontWeight: '600' },
  card: { marginTop: 22, padding: 16, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: INK },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  overline: { color: INK_DIM, fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 1.4 },
  link: { color: INK, fontFamily: fonts.semibold, fontSize: 14, textDecorationLine: 'underline' },
  lockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  lockMore: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: PAPER },
  lockMoreText: { color: INK, fontSize: 13, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 24 },
  stepBtn: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: INK,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  stepValue: {
    minWidth: 140, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: INK,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20,
  },
  stepText: { color: INK, fontFamily: fonts.bold, fontSize: 18, fontWeight: '700' },
  cta: { marginTop: 22, gap: 12 },
  sectionTitle: { color: INK, fontFamily: fonts.bold, fontSize: 20, fontWeight: '700', marginBottom: -2 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  ruleDivider: { borderTopWidth: 1, borderTopColor: 'rgba(46,49,54,0.12)' },
  ruleName: { color: INK, fontFamily: fonts.semibold, fontSize: 16, fontWeight: '600' },
  ruleSub: { color: INK_DIM, fontSize: 13, marginTop: 2 },
  statusPill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: PAPER },
  statusPillOn: { backgroundColor: HIGHLIGHT },
  statusPillText: { color: INK, fontSize: 12.5, fontWeight: '700' },
});

const styles = StyleSheet.create({
  autoWrap: { marginTop: space.xl },
  autoHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm, paddingHorizontal: 4 },
  autoTitle: { color: palette.onColorTextDim, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.3 },
  autoEdit: { color: palette.accent, fontFamily: fonts.semibold, fontSize: 14 },
  promise: { ...type.sub, color: palette.onColorTextDim, marginTop: space.xs, lineHeight: 19 },
  lockCard: {
    alignItems: 'center',
    marginTop: space.base,
    paddingVertical: space.base,
    paddingHorizontal: space.base,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(220,235,203,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(220,235,203,0.16)',
    gap: space.sm,
  },
  heroCompact: { fontSize: 44, lineHeight: 48, letterSpacing: -2 },
  lockGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  lockMore: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.glass,
  },
  lockMoreText: { ...type.sub, color: palette.onColorText, fontWeight: '600' },
  lockEmpty: { paddingVertical: space.sm },
  lockEmptyText: { ...type.body, color: palette.accent },
  todayRow: { flexDirection: 'row', gap: 10 },
  todayTile: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  todayValue: { color: palette.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  todayLabel: { color: palette.textTertiary, fontSize: 11, marginTop: 3 },
  todayTrack: {
    height: 3,
    borderRadius: 2,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  todayFill: { height: 3, borderRadius: 2, backgroundColor: palette.accent },
  scroll: { paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.tabClearance },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  /* The standing fact — apps are blocked right now, with or without a focus
   * lock — as a state indicator rather than a sentence. */
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: palette.onColor,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.onColorBorder,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent },
  statusText: { color: palette.text, fontSize: 12.5, fontWeight: '700' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  bailoutIconWrap: { position: 'relative' },
  bailoutBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bailoutBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.onLight,
  },

  voice: { marginTop: space.base },

  hero: { alignItems: 'center', marginTop: space.lg },
  heroLabel: { marginBottom: space.sm, textAlign: 'center' },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  heroPair: { flexDirection: 'row', alignItems: 'flex-end', gap: space.xs },

  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.md, marginTop: space.xl },
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.onColorBorder,
    backgroundColor: palette.onColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    minWidth: 132,
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },

  cta: { marginTop: space.xl, gap: space.md, alignItems: 'stretch' },
  // `alignSelf: 'center'` to match BlockedAppsPill directly above it — the
  // row was left-aligned under a centred pill, so the two read as unrelated.
  manageRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: space.xs },
  // Sits on the saturated ground, where textTertiary (28% white on
  // near-black) drops below a readable contrast ratio.
  manageText: { color: palette.onColorTextDim },
  screenTime: { marginBottom: 4 },
  twinRow: { flexDirection: 'row', gap: 12, marginTop: space.lg },
  twinCard: {
    flex: 1,
    backgroundColor: palette.surfaceRaised,
    borderRadius: radius.xl,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  twinValue: { color: palette.text, fontSize: 17, fontWeight: '800', marginTop: 4 },
  twinLabel: { color: palette.textTertiary, fontSize: 12.5, fontWeight: '600' },
  baselineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    // Was accentSoft — a tinted accent wash, invisible once the ground below
    // it became that same accent.
    backgroundColor: palette.onColor,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.onColorBorder,
    alignSelf: 'center',
    marginBottom: 4,
  },
  baselineText: {
    color: palette.text,
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },

  section: { marginTop: space.xl },
  roomsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomsEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  roomsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.accent },
  roomsEyebrow: {
    color: palette.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  roomsLine: { color: palette.text, fontSize: 16, fontWeight: '600', marginTop: 8, lineHeight: 22 },
  guardDotOff: { backgroundColor: palette.textQuaternary },
  guardBody: { color: palette.textSecondary, fontSize: 13.5, lineHeight: 19, marginTop: 6 },
  photoStrip: { flexDirection: 'row', gap: 8, marginTop: 14 },
  photoThumb: { flex: 1, aspectRatio: 0.82, borderRadius: 12, backgroundColor: palette.surfaceHigh },
  photoAdd: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentBorder,
  },
  guardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    backgroundColor: palette.accentSoft,
  },
  guardCtaText: { color: palette.accent, fontSize: 14, fontWeight: '700' },
  roomsStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  roomsThumb: {
    width: 62,
    height: 74,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: palette.surfaceHigh,
  },
  roomsMore: { color: palette.textTertiary, fontSize: 12.5, fontWeight: '600', marginLeft: 2 },
  stCardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  appList: { marginTop: space.lg, gap: space.base },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  appMeter: { flex: 1, gap: space.sm },
  appMeterHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appValue: { color: palette.textSecondary },
  usageEmpty: { marginTop: space.md, lineHeight: 19 },
});
