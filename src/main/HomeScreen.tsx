import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PresetSections } from '../components/PresetCard';
import {
  Button,
  Card,
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
import Icon from '../ui/Icon';
import { dataRamp, motion, palette, radius, space, type } from '../design/tokens';

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
  onOpenEssentials,
  onStartFocus,
  onStartRest,
  onStartPreset,
  onOpenSleepSchedule,
  onOpenBlockedApps,
  blockedPackages = [],
  unlockNumber,
  streakDays = 0,
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
  onOpenEssentials: () => void;
  onStartFocus?: () => void;
  onStartRest?: () => void;
  /** Start an arbitrary preset session (from the For you / Detox cards). */
  onStartPreset?: (minutes: number, label: string, hardMode?: boolean) => void;
  onOpenSleepSchedule?: () => void;
  onOpenBlockedApps?: () => void;
  blockedPackages?: string[];
  unlockNumber: number;
  streakDays?: number;
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
  const [durationDays, setDurationDays] = useState(12);
  const [durationHours, setDurationHours] = useState(12);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const configuredSeconds = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const handleAdjust = (dir: number) => {
    if (running) return;
    let totalH = durationDays * 24 + durationHours + dir;
    if (totalH < 1) totalH = 1;
    if (totalH > 30 * 24) totalH = 30 * 24; // cap at 30 days
    setDurationDays(Math.floor(totalH / 24));
    setDurationHours(totalH % 24);
  };

  const handleStart = () => {
    if (running) {
      setRunning(false);
    } else if (remaining > 0) {
      setRunning(true);
    } else {
      const totalSec = durationDays * 24 * 3600 + durationHours * 3600;
      configuredSeconds.current = totalSec;
      setRemaining(totalSec);
      setRunning(true);
      onStartFocus?.();
    }
  };

  // Big-figure content: live countdown while running, chosen duration while idle.
  const heroPairs: [string, string][] = (() => {
    if (running || remaining > 0) {
      const d = Math.floor(remaining / 86400);
      const h = Math.floor((remaining % 86400) / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;
      if (d > 0) return [[String(d), d === 1 ? 'day' : 'days'], [String(h), 'hr']];
      if (h > 0) return [[String(h), 'hr'], [String(m).padStart(2, '0'), 'min']];
      return [[String(m).padStart(2, '0'), 'min'], [String(s).padStart(2, '0'), 'sec']];
    }
    if (durationDays > 0) return [[String(durationDays), durationDays === 1 ? 'day' : 'days'], [String(durationHours), 'hr']];
    return [[String(durationHours), durationHours === 1 ? 'hour' : 'hours'], ['', '']];
  })();

  const ringProgress =
    running && configuredSeconds.current > 0 ? remaining / configuredSeconds.current : 0;

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
          <Text style={styles.wordmark}>Wend</Text>
          <View style={styles.headerRight}>
            <Pill label={String(streakDays)} icon="flame" tone={streakDays > 0 ? 'warn' : 'neutral'} />
            <IconButton name="user" onPress={onOpenProfile} accessibilityLabel="Open profile" bordered />
          </View>
        </View>

        {/* Voice line */}
        <Animated.View entering={FadeInDown.duration(motion.transition)}>
          <Editorial
            lead={running ? 'Holding the line.' : 'Give yourself'}
            emphasis={running ? '' : 'a quieter stretch.'}
            align="center"
            style={styles.voice}
          />
        </Animated.View>

        {/* Commitment hero */}
        <Animated.View entering={FadeInDown.delay(60).duration(motion.transition)} style={styles.hero}>
          <Ring progress={ringProgress} size={248} thickness={4}>
            <Text style={[type.overline, styles.heroLabel]}>
              {running ? 'Time remaining' : 'Commit a block'}
            </Text>
            {timePairs(heroPairs)}
          </Ring>
        </Animated.View>

        {/* Duration stepper — idle only */}
        {!running && remaining === 0 && (
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => handleAdjust(-1)} hitSlop={8}>
              <Icon name="minus" size={20} color={palette.text} />
            </Pressable>
            <View style={styles.stepValue}>
              <Text style={type.bodyStrong}>{durationDays}d {durationHours}h</Text>
            </View>
            <Pressable style={styles.stepBtn} onPress={() => handleAdjust(1)} hitSlop={8}>
              <Icon name="plus" size={20} color={palette.text} />
            </Pressable>
          </View>
        )}

        {/* Primary action */}
        <View style={styles.cta}>
          {running ? (
            <Button label="Pause" icon="pause" variant="outline" onPress={handleStart} />
          ) : (
            <Button
              label={remaining > 0 ? 'Resume block' : 'Start block'}
              icon="shield"
              variant="accent"
              onPress={handleStart}
            />
          )}
          <Pressable style={styles.manageRow} onPress={onOpenApps} hitSlop={6}>
            <Icon name="lock" size={13} color={palette.textTertiary} />
            <Text style={[type.caption, styles.manageText]}>Manage blocked apps</Text>
            <Icon name="chevronRight" size={13} color={palette.textQuaternary} />
          </Pressable>
        </View>

        {/* Screen time */}
        <Card onPress={onOpenApps} style={styles.section}>
          <View style={styles.stCardHead}>
            <Stat value={screenTimeLabel} label="Screen time · today" />
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
                ? 'Per-app screen time is Android-only — iOS never hands app usage to third-party apps.'
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.tabClearance },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  wordmark: { ...type.title1, letterSpacing: -1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.sm },

  voice: { marginTop: space.md },

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

  cta: { marginTop: space.xl, gap: space.md, alignItems: 'center' },
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
