import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

export type IconName =
  | 'check'
  | 'close'
  | 'lock'
  | 'shield'
  | 'arrowRight'
  | 'search'
  | 'mic';

/**
 * Small shared set of line icons, replacing raw emoji glyphs used as UI
 * chrome (checkmarks, close buttons, locks, shields, arrows, search).
 * Cross-platform via react-native-svg — unlike AppIcon.tsx's SF Symbols,
 * this actually renders the same real icon on Android, iOS, and web,
 * which matters since Android is this app's primary target.
 *
 * Deliberately does NOT cover the decorative/thematic glyphs used as
 * content (World landmark glyphs, Theme glyphs, Sound glyphs, unlock-
 * challenge family glyphs) — those are illustrative content, not chrome,
 * and swapping them for line icons would be a separate illustration pass.
 */
export default function Icon({
  name,
  size = 18,
  color = '#ffffff',
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  switch (name) {
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 12.5l5 5L20 6.5" stroke={color} strokeWidth={strokeWidth + 0.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="5" y1="5" x2="19" y2="19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="19" y1="5" x2="5" y2="19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M6 11V8a6 6 0 1 1 12 0v3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path d="M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" stroke={color} strokeWidth={strokeWidth} />
          <Circle cx="12" cy="16" r="1.6" fill={color} />
        </Svg>
      );
    case 'shield':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'arrowRight':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="16" y1="16" x2="21" y2="21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'mic':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M6 11a6 6 0 0 0 12 0M12 19v3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}
