import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { THEMES, ThemeKey } from '../data/themes';
import { palette, radius } from '../design/tokens';
import Icon from '../ui/Icon';

/** A legible, distinct hue per theme, lifted out of that theme's block-screen
 *  gradient (which is near-black by design, so six tiles painted with it
 *  straight would be six identical dark rectangles). The tint carries the
 *  identity in the tile, and reappears as the glow behind the preview — so the
 *  colour a user taps is the colour their block screen wears. */
const TINTS: Record<ThemeKey, string> = {
  deepWork: '#4FA3C7',
  health: '#8E9BFF',
  presence: '#E0A86A',
  craft: '#5FC98C',
  learning: '#B08CFF',
  quiet: '#AEB4BC',
};

const PREVIEW_H = 208;

export default function ThemePickerScreen({
  onContinue,
  suggested,
}: {
  onContinue: (key: ThemeKey) => void;
  suggested?: ThemeKey;
}) {
  const [selected, setSelected] = useState<ThemeKey>(suggested ?? 'quiet');
  const [lineIdx, setLineIdx] = useState(0);
  const theme = THEMES.find((t) => t.key === selected)!;
  const tint = TINTS[selected];
  const line = theme.lines[lineIdx % theme.lines.length];

  const choose = (key: ThemeKey) => {
    if (key === selected) return;
    setSelected(key);
    setLineIdx(0); // every theme opens on its strongest line
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
          Choose what your block screen says
        </Animated.Text>
        <Text style={styles.sub}>
          Phonewise doesn’t show a grey “blocked” wall. It says this to you, in your own reason’s words.
        </Text>

        {/* ── The payoff, first and biggest ──────────────────────────────
         *  This screen used to bury its point in a small caption under the
         *  grid. The block screen IS the product: show it full size, let the
         *  tiles below change it, and the choice explains itself. */}
        <Animated.View entering={FadeIn.delay(120).duration(420)}>
          <Pressable
            onPress={() => setLineIdx((i) => i + 1)}
            style={styles.preview}
            accessibilityRole="button"
            accessibilityLabel={`Block screen preview: ${line}. Tap for another line.`}
          >
            {/* Everything that changes with the selection is absolutely
             *  positioned, so a new theme cross-fades in place instead of
             *  resizing the box. The old version remounted a relative view
             *  whose height tracked the quote — one tap, and the whole screen
             *  jumped. That is the bounce. */}
            <Animated.View
              key={`bg-${selected}`}
              entering={FadeIn.duration(340)}
              exiting={FadeOut.duration(340)}
              style={StyleSheet.absoluteFill}
            >
              <LinearGradient colors={theme.palette} style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={[`${tint}38`, 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.85 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            {/* Static chrome — never keyed, so it never flickers. */}
            <View style={styles.previewTop}>
              <Icon name="lock" size={13} color="rgba(255,255,255,0.72)" strokeWidth={1.9} />
              <Text style={styles.previewChrome}>BLOCKED BY PHONEWISE</Text>
            </View>

            <View style={styles.previewBody}>
              <Animated.Text
                key={`line-${selected}-${lineIdx}`}
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(180)}
                style={styles.previewLine}
                numberOfLines={3}
              >
                “{line}”
              </Animated.Text>
            </View>

            <View style={styles.previewBottom}>
              <View style={styles.dots}>
                {theme.lines.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === lineIdx % theme.lines.length && styles.dotOn]}
                  />
                ))}
              </View>
              <Text style={styles.previewHint}>Tap for another line</Text>
            </View>
          </Pressable>
        </Animated.View>

        {suggested && (
          <Animated.View entering={FadeIn.delay(200).duration(320)} style={styles.suggestChip}>
            <Icon name="target" size={12} color={palette.onColorText} strokeWidth={1.9} />
            <Text style={styles.suggestText}>
              Picked from what you said you’d rather be doing
            </Text>
          </Animated.View>
        )}

        <View style={styles.grid}>
          {THEMES.map((t, i) => {
            const active = t.key === selected;
            const c = TINTS[t.key];
            return (
              <Animated.View
                key={t.key}
                entering={FadeInDown.delay(160 + i * 45).duration(340)}
                style={styles.cell}
              >
                <Pressable
                  onPress={() => choose(t.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.tile,
                    active && { borderColor: c, backgroundColor: `${c}1F` },
                  ]}
                >
                  <View style={styles.tileTop}>
                    <View style={[styles.tileIcon, { backgroundColor: `${c}2B` }]}>
                      <Icon name={t.mark} size={17} color={c} strokeWidth={1.9} />
                    </View>
                    {/* Fixed slot, so the check appears without nudging
                     *  anything sideways. */}
                    <View style={styles.checkSlot}>
                      {active && (
                        <Animated.View
                          entering={FadeIn.duration(160)}
                          style={[styles.check, { backgroundColor: c }]}
                        >
                          <Icon name="check" size={11} color="#08090B" strokeWidth={3} />
                        </Animated.View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.tileName} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Text style={styles.tileFor} numberOfLines={2}>
                    {t.forWho}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <Text style={styles.footnote}>
          Six voices, three lines each. Change it any time in Settings.
        </Text>
      </ScrollView>

      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={() => onContinue(selected)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scroll: { paddingBottom: 8 },
  heading: {
    color: palette.text,
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 22,
    paddingHorizontal: 28,
    lineHeight: 32,
  },
  sub: {
    color: palette.textSecondary,
    fontSize: 14.5,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 30,
    lineHeight: 20.5,
  },

  /* ── Block-screen preview ─────────────────────────────────────── */
  preview: {
    height: PREVIEW_H,
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    justifyContent: 'space-between',
  },
  previewTop: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 16, paddingHorizontal: 18 },
  previewChrome: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  previewBody: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  previewLine: {
    color: '#FFFFFF',
    fontSize: 20.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
  },
  previewBottom: { alignItems: 'center', paddingBottom: 15, gap: 7 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.24)' },
  dotOn: { backgroundColor: 'rgba(255,255,255,0.85)' },
  previewHint: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },

  /* ── Suggestion chip ──────────────────────────────────────────── */
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    backgroundColor: palette.onColor,
  },
  suggestText: { color: palette.onColorText, fontSize: 12, fontWeight: '600' },

  /* ── Tiles ────────────────────────────────────────────────────── */
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingTop: 14 },
  cell: { width: '50%', padding: 6 },
  tile: {
    height: 104,
    borderRadius: 20,
    padding: 13,
    backgroundColor: palette.surfaceRaised,
    borderWidth: 1.5,
    borderColor: palette.border,
    justifyContent: 'flex-start',
  },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  checkSlot: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  check: { width: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tileName: { color: palette.text, fontSize: 15, fontWeight: '700', marginTop: 9 },
  tileFor: { color: palette.textTertiary, fontSize: 11.5, lineHeight: 15, fontWeight: '500', marginTop: 2 },

  footnote: {
    color: palette.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 30,
  },
  ctaWrap: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 10 },
});
