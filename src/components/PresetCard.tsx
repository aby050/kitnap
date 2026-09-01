import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import SessionStartSheet from './SessionStartSheet';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Icon, { IconName } from '../ui/Icon';
import { tapLight } from '../ui/haptics';
import { motion, palette, radius, space, type } from '../design/tokens';

export type Preset = {
  title: string;
  subtitle: string;
  minutes: number;
  /** Line icon for the preset (replaced the per-card arbitrary gradient). */
  mark: IconName;
  hasButton?: boolean;
  /** Cover wash on the start sheet. */
  cover: [string, string];
};

/**
 * Quick-start session shortcuts.
 *
 * These used to be gradient tiles in six unrelated colour schemes with a "▶"
 * emoji on the button — the single loudest source of the "different product
 * per card" feel. They're now uniform surface cards: one icon, one title, one
 * duration, the app's one accent. Difference between cards comes from the
 * label, not from the paint.
 */
export const FOR_YOU_PRESETS: Preset[] = [
  { title: 'Deep study', subtitle: '1h 30m', minutes: 90, mark: 'book', cover: ['#5A3A22', '#C4894A'] },
  { title: 'Commute', subtitle: '30m', minutes: 30, mark: 'clock', cover: ['#1A2A38', '#4A7A96'] },
];

/** Longer resets — tapping the card itself begins them. */
export const DETOX_PRESETS: Preset[] = [
  { title: 'Touch grass', subtitle: 'No distracting apps', minutes: 120, mark: 'leaf', hasButton: false, cover: ['#143024', '#3D8F5C'] },
  { title: 'Quiet day', subtitle: 'No distracting apps', minutes: 480, mark: 'mist', hasButton: false, cover: ['#1C1830', '#6A5A9A'] },
];

export function PresetCard({
  title,
  subtitle,
  mark,
  onStart,
  hasButton = true,
}: {
  title: string;
  subtitle: string;
  mark: IconName;
  onStart: () => void;
  hasButton?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.cardContainer, animStyle]}>
      <Pressable
        onPress={() => {
          tapLight();
          onStart();
        }}
        onPressIn={() => {
          scale.value = withTiming(0.98, { duration: motion.instant });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, motion.spring);
        }}
        style={styles.card}
      >
        <View style={styles.iconTile}>
          <Icon name={mark} size={20} color={palette.accent} strokeWidth={1.7} />
        </View>

        <View style={styles.spacer} />

        <Text style={type.bodyStrong} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[type.sub, styles.subtitle]} numberOfLines={1}>
          {subtitle}
        </Text>

        {hasButton && (
          <View style={styles.startRow}>
            <Icon name="play" size={13} color={palette.accent} />
            <Text style={styles.startText}>Start</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

/** The full "For you" + "Digital detox" block, so any screen can drop the
 *  same set of session shortcuts in without duplicating the markup. */
export function PresetSections({
  onStartPreset,
  blockedCount = 0,
  onOpenBlockedApps,
}: {
  onStartPreset: (minutes: number, label: string, hardMode?: boolean) => void;
  blockedCount?: number;
  onOpenBlockedApps?: () => void;
}) {
  const [open, setOpen] = useState<Preset | null>(null);

  return (
    <>
      <Text style={[type.overline, styles.sectionTitle]}>For you</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselScroll}>
        {FOR_YOU_PRESETS.map((p) => (
          <PresetCard
            key={p.title}
            title={p.title}
            subtitle={p.subtitle}
            mark={p.mark}
            onStart={() => setOpen(p)}
          />
        ))}
      </ScrollView>

      <View style={styles.detoxHeaderRow}>
        <Text style={type.overline}>Digital detox</Text>
        <Text style={[type.sub, styles.sectionSubtitle]}>Choose a longer reset.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselScroll}>
        {DETOX_PRESETS.map((p) => (
          <PresetCard
            key={p.title}
            title={p.title}
            subtitle={p.subtitle}
            mark={p.mark}
            hasButton={p.hasButton}
            onStart={() => setOpen(p)}
          />
        ))}
      </ScrollView>

      <SessionStartSheet
        preset={open}
        blockedCount={blockedCount}
        onClose={() => setOpen(null)}
        onOpenBlockedApps={onOpenBlockedApps}
        onConfirm={(minutes, label, hardMode) => {
          setOpen(null);
          onStartPreset(minutes, label, hardMode);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { paddingHorizontal: space.gutter, marginBottom: space.md, marginTop: space.xxl },
  detoxHeaderRow: { paddingHorizontal: space.gutter, marginTop: space.xxl, marginBottom: space.md },
  sectionSubtitle: { marginTop: space.xxs },
  carouselScroll: { paddingLeft: space.gutter, paddingRight: space.md, gap: space.md },
  cardContainer: { width: 168, height: 168 },
  card: {
    flex: 1,
    padding: space.base,
    borderRadius: radius.xl,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { flex: 1 },
  subtitle: { marginTop: space.xxs },
  startRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2, marginTop: space.md },
  startText: { ...type.caption, color: palette.accent },
});
