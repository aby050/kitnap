import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BlockedAppsPill from '../components/BlockedAppsPill';
import { PresetSections } from '../components/PresetCard';
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
import { dataRamp, motion, palette, radius, space, type } from '../design/tokens';

/** A commitment runs from half an hour up to a week. */
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
  onStartBlock,
  onStartRest,
  onStartPreset,
  onOpenSleepSchedule,
  onOpenBlockedApps,
  onBuyBailouts,
  bailoutBalance = 0,
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
  /** Emergency tokens in hand — shown in the header sheet. */
  bailoutBalance?: number;
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
    const pressedAt = Date.now();
    const tick = () => {
      setDurationMinutes((c) => stepTo(c, dir));
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
          <View style={styles.headerRight}>
            <IconButton
              name="key"
              onPress={() => setShowBailout(true)}
              accessibilityLabel="Bailouts"
              bordered
            />
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
        <Animated.View entering={FadeInDown.delay(60).duration(motion.transition)} style={styles.hero}>
          <Ring progress={ringProgress} size={248} thickness={4}>
            <Text style={[type.overline, styles.heroLabel]}>
              Commit a block
            </Text>
            {timePairs(heroPairs)}
          </Ring>
        </Animated.View>

        {/* Duration stepper */}
        <View style={styles.stepper}>
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
        </View>

        {/* Primary action */}
        <View style={styles.cta}>
          <Button label="Start block" icon="shield" variant="accent" onPress={handleStart} />
          {Platform.OS === 'ios' && <BlockedAppsPill />}
          <Pressable style={styles.manageRow} onPress={onOpenApps} hitSlop={6}>
            <Icon name="lock" size={13} color={palette.textTertiary} />
            <Text style={[type.caption, styles.manageText]}>Manage blocked apps</Text>
            <Icon name="chevronRight" size={13} color={palette.textQuaternary} />
          </Pressable>
        </View>

        {/* Screen time */}
        <Card onPress={onOpenApps} style={styles.section}>
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
        </Card>

        {/* Session shortcuts */}
        <PresetSections
          onStartPreset={(minutes, label, hardMode) => onStartPreset?.(minutes, label, hardMode)}
          blockedCount={blockedPackages.length}
          onOpenBlockedApps={onOpenBlockedApps}
        />

        {/* Open a blocked app (shield demo) */}
        <Card tone="accent" onPress={onTriggerShield} style={styles.section}>
          <Row
            icon="shield"
            iconColor={palette.accent}
            title="Open a blocked app"
            subtitle={`Next request is unlock #${unlockNumber} today`}
            chevron
          />
        </Card>
      </ScrollView>

      {showBailout && (
        <BailoutSheet
          balance={bailoutBalance}
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

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', minHeight: 44 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.sm },

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
    borderColor: palette.border,
    backgroundColor: palette.glass,
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
  manageRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  manageText: { color: palette.textTertiary },

  section: { marginTop: space.xl },
  stCardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  appList: { marginTop: space.lg, gap: space.base },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  appMeter: { flex: 1, gap: space.sm },
  appMeterHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appValue: { color: palette.textSecondary },
  usageEmpty: { marginTop: space.md, lineHeight: 19 },
});
