import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { palette } from '../design/tokens';

/**
 * A bailout, as a token.
 *
 * This has been a parachute (which read as "emergency landing" rather than
 * "way back in") and then a padlock standing next to a key. The padlock-plus-
 * key had three problems: two separate objects turn to mush below about 28px,
 * it needed a 34:24 aspect so it never sat properly in a square icon slot,
 * and a lock beside a key is the most generic security mark there is.
 *
 * A bailout is not security. It is *currency* — a countable thing you spend
 * to leave a lock you closed yourself, and the UI says "10 bailouts left", not
 * "10 locks". So it is a coin with a keyhole struck through it: one object,
 * square, legible at 13px where it is smallest, and it says spend rather than
 * secure.
 *
 * Stroked, not filled, so it sits on any surface without needing to know the
 * colour behind the keyhole and matches the line weight of Icon.tsx.
 */
export default function BailoutGlyph({
  size = 56,
  color = palette.accent,
}: {
  size?: number;
  color?: string;
}) {
  // Stroke thins as the glyph grows: 1.8 is right at 24px and heavy at 56,
  // which is the size the token store renders it at.
  const w = size >= 40 ? 1.5 : 1.8;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* The coin */}
      <Circle cx={12} cy={12} r={9.2} stroke={color} strokeWidth={w} />
      {/* Milled edge — a second, lighter ring. Reads as a struck coin rather
          than a plain circle, and it is the detail that stops this being just
          another outlined dot at small sizes. */}
      <Circle cx={12} cy={12} r={6.9} stroke={color} strokeWidth={w * 0.62} opacity={0.55} />
      {/* Keyhole: bore and ward, centred so the whole mark stays symmetrical
          and therefore still reads when it is tiny. */}
      <Circle cx={12} cy={10.4} r={1.75} stroke={color} strokeWidth={w * 0.9} />
      <Path
        d="M12 12.2v3.1"
        stroke={color}
        strokeWidth={w * 0.9}
        strokeLinecap="round"
      />
    </Svg>
  );
}
