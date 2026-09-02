import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { palette } from '../design/tokens';

/**
 * Padlock and key — the thing a Bailout actually is: the one key that opens a
 * lock you deliberately closed. Replaces the parachute, which read as
 * "emergency landing" rather than "way back in".
 *
 * Stroked rather than filled so it sits on any surface without needing to
 * know the background colour behind the keyhole, and so it matches the
 * line-art weight of everything in Icon.tsx.
 */
export default function BailoutGlyph({
  size = 56,
  color = palette.accent,
}: {
  size?: number;
  color?: string;
}) {
  // Wider than tall: the key sits beside the lock rather than on its ring,
  // which stays legible down to ~28px where an interlocked ring turns to mush.
  const height = size;
  const width = (size * 34) / 24;

  return (
    <Svg width={width} height={height} viewBox="0 0 34 24" fill="none">
      {/* Shackle */}
      <Path
        d="M6.8 10.2V7.6a4.4 4.4 0 0 1 8.8 0v2.6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      {/* Body */}
      <Rect x={2.6} y={10.2} width={17.2} height={11.6} rx={2.6} stroke={color} strokeWidth={1.8} />
      {/* Keyhole */}
      <Circle cx={11.2} cy={15.1} r={1.7} stroke={color} strokeWidth={1.6} />
      <Path d="M11.2 16.8v2.4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />

      {/* Key: bow, shaft, two teeth */}
      <Circle cx={27.4} cy={8.4} r={4.1} stroke={color} strokeWidth={1.8} />
      <Path d="M27.4 12.5v8.6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d="M27.4 16.6h3.1M27.4 19.2h2.4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
