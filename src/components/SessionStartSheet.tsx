import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Modal from './Modal';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon, { IconName } from '../ui/Icon';
import { tapLight, tapMedium } from '../ui/haptics';
import { control, palette, radius, space, type } from '../design/tokens';
import Toggle from '../design/Toggle';

const HOLD_MS = 900;
const STEP_MINUTES = 15;
const MIN_MINUTES = 15;
const MAX_MINUTES = 720;

export function formatPresetDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function HoldToStart({ onComplete }: { onComplete: () => void }) {
  const fill = useSharedValue(0);
  const armed = useSharedValue(false);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fill.value }],
  }));

  const finish = () => {
    tapMedium();
    onComplete();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Hold to start session"
      onPressIn={() => {
        tapLight();
        armed.value = true;
        fill.value = withTiming(1, { duration: HOLD_MS, easing: Easing.out(Easing.quad) }, (done) => {
          if (done && armed.value) runOnJS(finish)();
        });
      }}
      onPressOut={() => {
        armed.value = false;
        fill.value = withTiming(0, { duration: 160 });
      }}
      style={styles.holdBtn}
    >
      <Animated.View style={[styles.holdFill, fillStyle]} />
      <Text style={styles.holdLabel}>Hold to Start</Text>
    </Pressable>
  );
}

export default function SessionStartSheet({
  preset,
  blockedCount = 0,
  onClose,
  onOpenBlockedApps,
  onConfirm,
}: {
  preset: {
    title: string;
    minutes: number;
    mark: IconName;
    cover: [string, string];
  } | null;
  blockedCount?: number;
  onClose: () => void;
  onOpenBlockedApps?: () => void;
  onConfirm: (minutes: number, label: string, hardMode: boolean) => void;
}) {
  const [minutes, setMinutes] = useState(preset?.minutes ?? 90);
  const [hardMode, setHardMode] = useState(false);

  useEffect(() => {
    if (preset) {
      setMinutes(preset.minutes);
      setHardMode(false);
    }
  }, [preset]);

  if (!preset) return null;

  const blockedLabel = blockedCount > 0 ? String(blockedCount) : 'None';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Pressable onPress={onClose} style={styles.close} hitSlop={8} accessibilityLabel="Close">
            <Icon name="close" size={16} color={palette.text} strokeWidth={1.8} />
          </Pressable>

          <View style={styles.coverWrap}>
            <LinearGradient colors={preset.cover} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.cover}>
              <View style={styles.coverIcon}>
                <Icon name={preset.mark} size={36} color={palette.text} strokeWidth={1.5} />
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.title}>{preset.title}</Text>

          <View style={styles.stepper}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => {
                tapLight();
                setMinutes((m) => Math.max(MIN_MINUTES, m - STEP_MINUTES));
              }}
              accessibilityLabel="Decrease duration"
            >
              <Icon name="minus" size={18} color={palette.text} />
            </Pressable>
            <View style={styles.stepValue}>
              <Text style={styles.stepValueText}>{formatPresetDuration(minutes)}</Text>
            </View>
            <Pressable
              style={styles.stepBtn}
              onPress={() => {
                tapLight();
                setMinutes((m) => Math.min(MAX_MINUTES, m + STEP_MINUTES));
              }}
              accessibilityLabel="Increase duration"
            >
              <Icon name="plus" size={18} color={palette.text} />
            </Pressable>
          </View>

          <Pressable style={styles.row} onPress={onOpenBlockedApps} disabled={!onOpenBlockedApps}>
            <Text style={styles.rowTitle}>Blocked Apps</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowMeta}>{blockedLabel}</Text>
              <Icon name="chevronRight" size={16} color={palette.textQuaternary} />
            </View>
          </Pressable>

          <View style={styles.row}>
            <View style={styles.hardCopy}>
              <View style={styles.hardTitleRow}>
                <Text style={styles.rowTitle}>Hard Mode</Text>
                <View style={styles.proBadge}>
                  <Icon name="bolt" size={10} color={palette.accent} strokeWidth={2.2} />
                  <Text style={styles.proText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.rowSub}>Can't use a Bailout to leave early.</Text>
            </View>
            <Toggle
              value={hardMode}
              onValueChange={setHardMode}
            />
          </View>

          <HoldToStart onComplete={() => onConfirm(minutes, preset.title, hardMode)} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: palette.scrim,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  sheet: {
    backgroundColor: palette.surfaceRaised,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: palette.borderStrong,
    marginBottom: space.sm,
  },
  close: {
    position: 'absolute',
    top: space.base,
    left: space.base,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  coverWrap: { alignItems: 'center', marginTop: space.sm },
  cover: {
    width: 120,
    height: 120,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.title2, textAlign: 'center', marginTop: space.lg, marginBottom: space.xl },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    marginBottom: space.xl,
  },
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
    minWidth: 140,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  stepValueText: { ...type.bodyStrong },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.hairline,
  },
  rowTitle: { ...type.bodyStrong },
  rowSub: { ...type.caption, color: palette.textTertiary, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  rowMeta: { ...type.body, color: palette.textTertiary },
  hardCopy: { flex: 1, paddingRight: space.md },
  hardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentBorder,
  },
  proText: { ...type.caption, color: palette.accent, fontWeight: '800', letterSpacing: 0.6, fontSize: 10 },
  holdBtn: {
    marginTop: space.lg,
    height: control.lg,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceInverse,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  holdFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: palette.accent,
    transformOrigin: 'left center',
  },
  holdLabel: { ...type.bodyStrong, color: palette.textInverse, zIndex: 1 },
});
