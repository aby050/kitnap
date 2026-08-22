import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

export type Preset = {
  title: string;
  subtitle: string;
  minutes: number;
  colors: readonly [string, string, ...string[]];
  hasButton?: boolean;
};

/** "For you" quick-start sessions. */
export const FOR_YOU_PRESETS: Preset[] = [
  { title: 'Deep study', subtitle: '1h 30m', minutes: 90, colors: ['#0f2027', '#203a43', '#2c5364'] },
  { title: 'Commute', subtitle: '30m', minutes: 30, colors: ['#3a1c1c', '#6f2d2d', '#993d3d'] },
];

/** Longer resets — no Start button, tapping the card itself begins them. */
export const DETOX_PRESETS: Preset[] = [
  { title: 'Touch grass', subtitle: 'No distracting apps', minutes: 120, colors: ['#134e5e', '#2f80ed'], hasButton: false },
  { title: 'Quiet day', subtitle: 'No distracting apps', minutes: 480, colors: ['#085d38', '#2e8b57'], hasButton: false },
];

export function PresetCard({
  title,
  subtitle,
  colors: gradColors,
  onStart,
  hasButton = true,
}: {
  title: string;
  subtitle: string;
  colors: readonly [string, string, ...string[]];
  onStart: () => void;
  hasButton?: boolean;
}) {
  return (
    <Pressable onPress={onStart} style={styles.cardContainer}>
      <LinearGradient
        colors={gradColors}
        start={{ x: 0.15, y: 0.15 }}
        end={{ x: 0.85, y: 0.85 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Decorative arcs */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} opacity={0.12}>
        <Circle cx="120" cy="-20" r="100" stroke="white" strokeWidth="2.5" fill="none" />
        <Circle cx="140" cy="-20" r="125" stroke="white" strokeWidth="1.5" fill="none" />
      </Svg>

      <View style={styles.cardContent}>
        <View style={{ flex: 1, justifyContent: 'flex-start' }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>

        {hasButton && (
          <TouchableOpacity style={styles.cardStartBtn} activeOpacity={0.8} onPress={onStart}>
            <Text style={styles.cardStartBtnText}>▶  Start</Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}

/** The full "For you" + "Digital detox" block, so any screen can drop the
 *  same set of session shortcuts in without duplicating the markup. */
export function PresetSections({ onStartPreset }: { onStartPreset: (minutes: number, label: string) => void }) {
  return (
    <>
      <Text style={styles.sectionTitle}>For you</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselScroll}>
        {FOR_YOU_PRESETS.map((p) => (
          <PresetCard
            key={p.title}
            title={p.title}
            subtitle={p.subtitle}
            colors={p.colors}
            onStart={() => onStartPreset(p.minutes, p.title)}
          />
        ))}
      </ScrollView>

      <View style={styles.detoxHeaderRow}>
        <Text style={styles.sectionTitleFlush}>Digital detox</Text>
        <Text style={styles.sectionSubtitle}>Choose a longer reset.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselScroll}>
        {DETOX_PRESETS.map((p) => (
          <PresetCard
            key={p.title}
            title={p.title}
            subtitle={p.subtitle}
            colors={p.colors}
            hasButton={p.hasButton}
            onStart={() => onStartPreset(p.minutes, p.title)}
          />
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 26,
  },
  sectionTitleFlush: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  detoxHeaderRow: {
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  carouselScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 14,
  },
  cardContainer: {
    width: 200,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12.5,
    fontWeight: '600',
  },
  cardStartBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardStartBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
