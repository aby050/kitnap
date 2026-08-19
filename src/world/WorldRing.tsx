import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ThemeKey } from '../data/themes';
import { LANDMARKS, WORLD_PALETTES } from './worldData';
import { colors } from '../theme';

const SIZE = 208;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const BADGE = 52;

/** A progress ring for "hours until the next landmark" plus a row of badges
 *  for all landmarks — the same visual language as Apple Fitness rings and
 *  Duolingo achievement badges. Flat colour and typography carry the design
 *  instead of illustration, which is much harder to get wrong. */
export default function WorldRing({
  themeKey,
  hoursReclaimed,
}: {
  themeKey: ThemeKey;
  hoursReclaimed: number;
}) {
  const accent = WORLD_PALETTES[themeKey].sun;
  const built = LANDMARKS.filter((l) => hoursReclaimed >= l.atHours);
  const next = LANDMARKS.find((l) => hoursReclaimed < l.atHours);
  const prevThreshold = built.length > 0 ? built[built.length - 1].atHours : 0;
  const span = next ? next.atHours - prevThreshold : 1;
  const progressInSpan = next ? (hoursReclaimed - prevThreshold) / span : 1;
  const pct = Math.max(0, Math.min(1, progressInSpan));
  const current = built[built.length - 1];

  return (
    <View style={styles.wrap}>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <SvgGradient id="ring" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={accent} stopOpacity="0.5" />
              <Stop offset="1" stopColor={accent} />
            </SvgGradient>
          </Defs>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke="url(#ring)"
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - pct)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <View style={[styles.currentBadge, { backgroundColor: `${accent}26`, borderColor: accent }]}>
            <Text style={styles.currentGlyph}>{current ? current.glyph : '🌱'}</Text>
          </View>
          <Text style={styles.hoursValue}>{hoursReclaimed.toFixed(1)}h</Text>
          <Text style={styles.hoursLabel}>reclaimed</Text>
        </View>
      </View>

      {next && (
        <Text style={styles.nextText}>
          <Text style={{ color: accent, fontWeight: '800' }}>{(next.atHours - hoursReclaimed).toFixed(1)}h</Text> to{' '}
          {next.name}
        </Text>
      )}

      <Animated.View entering={FadeIn.delay(200).duration(400)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeRow}>
          {LANDMARKS.map((l) => {
            const unlocked = hoursReclaimed >= l.atHours;
            return (
              <View key={l.id} style={styles.badgeCol}>
                <View
                  style={[
                    styles.badge,
                    unlocked
                      ? { backgroundColor: `${accent}22`, borderColor: accent }
                      : styles.badgeLocked,
                  ]}
                >
                  <Text style={[styles.badgeGlyph, !unlocked && styles.badgeGlyphLocked]}>{l.glyph}</Text>
                </View>
                <Text style={styles.badgeHours}>{l.atHours}h</Text>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  ringWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  currentBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  currentGlyph: { fontSize: 26 },
  hoursValue: { color: colors.text, fontSize: 26, fontWeight: '800' },
  hoursLabel: { color: colors.textDim, fontSize: 12.5, marginTop: 2 },
  nextText: { color: colors.textDim, fontSize: 14.5, marginTop: 16, textAlign: 'center' },
  badgeRow: { gap: 14, paddingHorizontal: 4, paddingTop: 22 },
  badgeCol: { alignItems: 'center', width: BADGE + 6 },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLocked: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' },
  badgeGlyph: { fontSize: 22 },
  badgeGlyphLocked: { opacity: 0.28 },
  badgeHours: { color: colors.textFaint, fontSize: 11, marginTop: 6, fontWeight: '600' },
});
