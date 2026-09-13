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
import { ProgressState } from '../data/progress';
import {
  Button,
  Card,
  Editorial,
  IconButton,
  Meter,
  Ring,
  Row,
  Screen,
  Stat,
} from '../design/primitives';
import AppGlyph from '../ui/AppGlyph';
import BailoutSheet from '../components/BailoutSheet';
import Icon from '../ui/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { AMBIENCES, mediaFor } from '../data/ambiences';
import { tapLight } from '../ui/haptics';
import { dataRamp, motion, palette, radius, space, type } from '../design/tokens';
import KnockoutLabel from '../components/KnockoutLabel';

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
function timePairs(pairs: [string, string][]) {
  return (
    <View style={styles.heroRow}>
      {pairs.map(([n, u], i) => (
        <View key={i} style={styles.heroPair}>
          <Text style={type.hero}>{n}</Text>
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
}: {
  onOpenProfile: () => void;
  onOpenApps: () => void;
  onTriggerShield: () => void;
  /** Jumps to the Timer tab, where the rooms live. */
  onOpenRooms?: () => void;
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

  const ringProgress = 0;

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
  const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

  return (
    <Screen edges={['top']} bloom>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Brand header */}
        <View style={styles.headerRow}>
          {Platform.OS === 'ios' && (
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Blocking on</Text>
            </View>
          )}
          <View style={styles.headerRight}>
            <View style={styles.bailoutIconWrap}>
              <IconButton
                name="key"
                onPress={() => setShowBailout(true)}
                accessibilityLabel="Bailouts"
                bordered
              />
              {bailoutBalance > 0 && (
                <View style={styles.bailoutBadge}>
                  <Text style={styles.bailoutBadgeText}>{bailoutBalance}</Text>
                </View>
              )}
            </View>
            <IconButton name="user" onPress={onOpenProfile} accessibilityLabel="Open profile" bordered />
          </View>
        </View>

        {/* Voice line */}
        <Animated.View entering={FadeInDown.duration(motion.transition)}>
          <Editorial
            lead="Give yourself"
            emphasis="a quieter stretch."
            style={styles.voice}
          />
        </Animated.View>

        {/* Commitment hero */}
        <Animated.View entering={FadeInDown.delay(60).duration(motion.transition)} style={[styles.hero, heroAnimStyle]}>
          <Ring progress={ringProgress} size={248} thickness={4}>
            <Text style={[type.overline, styles.heroLabel]}>
              {/* Blocking is already on by default (see BlockedAppsPill above)
                  — this timer is a stricter lockdown on top of that, not what
                  starts the block. "Commit a block" read as if nothing was
                  blocked until this ran. */}
              {Platform.OS === 'ios' ? 'Focus lock' : 'Commit a block'}
            </Text>
            {timePairs(heroPairs)}
          </Ring>
        </Animated.View>

        {/* Duration stepper */}
        <Animated.View entering={FadeInDown.delay(100).duration(motion.transition)} style={styles.stepper}>
          <Pressable
            style={styles.stepBtn}
            onPressIn={() => startAdjust(-1)}
            onPressOut={stopAdjust}
            hitSlop={8}
          >
            <Icon name="minus" size={20} color={palette.text} />
          </Pressable>
          <View style={styles.stepValue}>
            <Text style={type.bodyStrong}>{formatBlockLength(durationMinutes)}</Text>
          </View>
          <Pressable
            style={styles.stepBtn}
            onPressIn={() => startAdjust(1)}
            onPressOut={stopAdjust}
            hitSlop={8}
          >
            <Icon name="plus" size={20} color={palette.text} />
          </Pressable>
        </Animated.View>

        {/* Primary action */}
        <Animated.View entering={FadeInDown.delay(140).duration(motion.transition)} style={styles.cta}>
          {/* Only while something is actually running. The idle copy that used
              to sit here — "Blocking is always on. Focus lock below makes it
              stricter." — was explanatory text pinned permanently above the
              primary action, and it pointed the wrong way: the focus lock it
              called "below" is the dial above. The fact it was carrying is
              worth keeping, so it moved to the header as a live status pill,
              where it costs a glance instead of a paragraph. */}
          {Platform.OS === 'ios' && sessionRunning && (
            <View style={styles.baselineBanner}>
              <Text style={styles.baselineText}>
                Focus lock running — nothing unlocks until it ends
              </Text>
            </View>
          )}
          {/* The label is knocked out of the white pill: it is filled with the
              ground's own colour at that point on screen, so it reads as a
              hole. Green while the button sits low in the saturated zone,
              black once it scrolls up into the black.
              `measureInWindow` rather than onLayout's y, because the pill is
              inside a ScrollView and onLayout reports a position inside the
              content, not on the screen — the fill has to track where the
              button actually IS, including as it scrolls. */}
          <View
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setCtaSize({ width, height });
              ctaRef.current?.measureInWindow((_x: number, y: number) => setCtaY(y));
            }}
            ref={ctaRef}
            collapsable={false}
          >
            {/* No icon. Button lays out [icon][gap][label] as a centred row,
                so the label's centre is offset from the pill's centre by half
                the icon block — while the knockout layer above is centred on
                the pill itself, which put the glyph through the first letter.
                Reproducing that offset here would couple this screen to
                Button's internal spacing and break the moment it changed.
                The label already says "lock", and the references this
                treatment came from use plain text buttons. */}
            <Button
              label={Platform.OS === 'ios' ? 'Start focus lock' : 'Start block'}
              variant="primary"
              labelHidden={ctaSize.width > 0}
              onPress={handleStart}
            />
            {ctaSize.width > 0 && (
              <KnockoutLabel
                text={Platform.OS === 'ios' ? 'Start focus lock' : 'Start block'}
                screenY={ctaY}
                width={ctaSize.width}
                height={ctaSize.height}
              />
            )}
          </View>
          {Platform.OS === 'ios' && (
            <>
              <BlockedAppsPill running={sessionRunning} onUnlock={onTriggerShield} />
            </>
          )}
          <Pressable style={styles.manageRow} onPress={onOpenApps} hitSlop={6}>
            <Icon name="lock" size={13} color={palette.onColorTextDim} />
            <Text style={[type.caption, styles.manageText]}>Manage blocked apps</Text>
            <Icon name="chevronRight" size={13} color={palette.onColorTextDim} />
          </Pressable>
        </Animated.View>

        {/* Open a blocked app (shield demo) */}
        <Card tone="accent" onPress={onTriggerShield} style={styles.section}>
          <Row
            icon="target"
            iconColor={palette.accent}
            title="Open a blocked app"
            subtitle={`Next request is unlock #${unlockNumber} today`}
            chevron
          />
        </Card>

        {/* Focus rooms.
            The rooms themselves live on the Timer tab, which left Home with
            no route to the one feature that is not a blocker. This is that
            route: it says what a room is for, shows three of them so the
            phrase means something, and hands over rather than duplicating
            the shelf. */}
        {onOpenRooms && (
          <Card onPress={onOpenRooms} style={styles.section}>
            <View style={styles.roomsHead}>
              <View style={styles.roomsEyebrowRow}>
                <View style={styles.roomsDot} />
                <Text style={styles.roomsEyebrow}>FOCUS ROOMS</Text>
              </View>
              <Icon name="chevronRight" size={16} color={palette.textQuaternary} />
            </View>
            <Text style={styles.roomsLine}>Somewhere to be while your apps are shut.</Text>
            <View style={styles.roomsStrip}>
              {ROOM_PREVIEW.map((a) => {
                const still = mediaFor(a.key).still;
                return (
                  <View key={a.key} style={styles.roomsThumb}>
                    <LinearGradient
                      colors={a.wash}
                      start={{ x: 0.1, y: 0 }}
                      end={{ x: 0.9, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    {still ? (
                      <Image source={still} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : null}
                  </View>
                );
              })}
              <Text style={styles.roomsMore}>+{AMBIENCES.length - ROOM_PREVIEW.length} more</Text>
            </View>
          </Card>
        )}

        {/* Your week — replaces the "For you" / "Digital detox" preset
            shelves, which offered timers rather than telling you anything. */}
        {progress && (
          <View style={styles.section}>
            <WeeklyInsight progress={progress} goalLine={goalLine} heading="This week" />
          </View>
        )}

        {/* Session shortcuts — "For you" and "Digital detox" are hidden.
            Both were shelves of timer presets rather than anything about this
            user, and they pushed the two things Home actually exists for (the
            block itself, and what it is blocking) below two carousels. The
            component is kept intact so the shelves can come back.
        <PresetSections
          onStartPreset={(minutes, label, hardMode) => onStartPreset?.(minutes, label, hardMode)}
          blockedCount={blockedPackages.length}
          onOpenBlockedApps={onOpenBlockedApps}
        />
        */}

        {/* Screen time */}
        <Card onPress={Platform.OS === 'ios' ? undefined : onOpenApps} style={styles.section}>
          {Platform.OS === 'ios' ? (
            // Real numbers, drawn by iOS itself via the UsageReport
            // extension — the old "Apple doesn't let any app read your
            // screen time" line belongs to the Android usage-stats path,
            // and was stale here since this is the one channel Apple does
            // allow.
            <ScreenTimeCard />
          ) : (
            <>
              <View style={styles.stCardHead}>
                <Stat
                  value={screenTimeLabel}
                  label={usage?.available ? 'Screen time · today' : 'Screen time · not available'}
                />
                <Icon name="chevronRight" size={18} color={palette.textQuaternary} />
              </View>

              {topApps.length > 0 ? (
                <View style={styles.appList}>
                  {topApps.map((app, i) => (
                    <View key={app.packageName} style={styles.appRow}>
                      <AppGlyph name={app.label} packageName={app.packageName} size={38} />
                      <View style={styles.appMeter}>
                        <View style={styles.appMeterHead}>
                          <Text style={type.body} numberOfLines={1}>{app.label}</Text>
                          <Text style={[type.sub, styles.appValue]}>{fmtMin(app.minutes)}</Text>
                        </View>
                        <Meter
                          progress={app.minutes / peakMinutes}
                          color={dataRamp[Math.min(dataRamp.length - 1, 1 + i)]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[type.sub, styles.usageEmpty]}>
                  {!usage?.available
                    ? "Apple doesn't let any app read your screen time — not even with permission granted. Your numbers live in Settings › Screen Time."
                    : !usage?.granted
                      ? 'Turn on Usage Access to see real per-app screen time here.'
                      : 'No app usage recorded yet today.'}
                </Text>
              )}
            </>
          )}
        </Card>

        {/* Unlock difficulty + Bailouts — both real screens already, just
            without an entry point on Home before this. */}
        <Animated.View entering={FadeIn.delay(200).duration(motion.transition)} style={styles.twinRow}>
          <Pressable style={styles.twinCard} onPress={onOpenDifficulty}>
            <Icon name="pulse" size={20} color={palette.accent} />
            <Text style={styles.twinValue}>{intensityKey ? getIntensity(intensityKey).name : 'Steady'}</Text>
            <Text style={styles.twinLabel}>Unlock difficulty</Text>
          </Pressable>
          <Pressable style={styles.twinCard} onPress={onBuyBailouts}>
            <Icon name="key" size={20} color={palette.accent} />
            <Text style={styles.twinValue}>{bailoutBalance}</Text>
            <Text style={styles.twinLabel}>{bailoutBalance === 1 ? 'Bailout' : 'Bailouts'}</Text>
          </Pressable>
        </Animated.View>


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
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
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
