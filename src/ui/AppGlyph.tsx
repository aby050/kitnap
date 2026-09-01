import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette, radius } from '../design/tokens';

/**
 * A neutral, dignified stand-in for an app's icon.
 *
 * Why not the real logos: the app model is only `{ name, packageName }` — there
 * is no icon bitmap available on the JS side — so the old screens *hand-drew*
 * Facebook, Instagram, TikTok, X and Reddit as coloured circles with a letter.
 * That looks amateur and is legally dicey (redistributing a mangled trademark).
 *
 * Instead we show a monogram on a tile whose tint is derived deterministically
 * from the package name, so the same app is always the same colour and a grid
 * of them reads as varied without pretending to be the real brand marks. If a
 * real icon URI ever becomes available, pass it as `uri` and it wins.
 */

/** Six low-saturation tints pulled toward the app's mint/black world so the
 *  grid never turns into a bag of skittles. */
const TILE_TINTS: [string, string][] = [
  ['rgba(111,227,169,0.16)', 'rgba(111,227,169,0.9)'],
  ['rgba(233,174,98,0.16)', 'rgba(233,174,98,0.9)'],
  ['rgba(240,96,74,0.14)', 'rgba(240,96,74,0.85)'],
  ['rgba(122,162,247,0.16)', 'rgba(158,190,255,0.92)'],
  ['rgba(196,167,231,0.16)', 'rgba(210,188,240,0.92)'],
  ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.82)'],
];

function hashIndex(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

/** First letter of each of the first two words, e.g. "Google Maps" → "GM". */
function monogram(name: string): string {
  const words = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function AppGlyph({
  name,
  packageName,
  size = 46,
  style,
}: {
  name: string;
  /** Seeds the tint; falls back to `name` so it still varies without one. */
  packageName?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [bg, fg] = TILE_TINTS[hashIndex(packageName || name, TILE_TINTS.length)];
  const label = monogram(name);
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.mono,
          { color: fg, fontSize: size * (label.length > 1 ? 0.36 : 0.44) },
        ]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.hairline,
    overflow: 'hidden',
  },
  mono: { fontWeight: '700', letterSpacing: 0.2 },
});
