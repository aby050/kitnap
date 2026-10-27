import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type CategoryKey = 'all' | 'social' | 'games' | 'entertainment' | 'productivity' | 'other';

/**
 * Category marks for the app picker: one stroke weight, one corner radius, one
 * grid, so the set reads as a family. Drawn on a 24-unit grid with rounded
 * line caps; colour comes from the caller so the same marks work on any tile.
 */
export default function CategoryGlyph({
  name,
  size = 24,
  color = '#FFFFFF',
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const p = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'social' && (
        <>
          <Path {...p} d="M3.5 6.5A2.5 2.5 0 0 1 6 4h6.5A2.5 2.5 0 0 1 15 6.5v3a2.5 2.5 0 0 1-2.5 2.5H8.2L5 14.5V12a2.5 2.5 0 0 1-1.5-2.3z" />
          <Path {...p} d="M17.4 9.4h.1A2.5 2.5 0 0 1 20 11.9v3a2.5 2.5 0 0 1-1.5 2.3V19.5L15.3 17h-4.1a2.5 2.5 0 0 1-2.4-1.8" />
        </>
      )}
      {name === 'games' && (
        <>
          <Path {...p} d="M7.5 8h9a4.5 4.5 0 0 1 4.4 3.6l.6 3.4a2.4 2.4 0 0 1-4.2 1.9L15 15.2H9l-2.3 1.7A2.4 2.4 0 0 1 2.5 15l.6-3.4A4.5 4.5 0 0 1 7.5 8z" />
          <Path {...p} d="M8 10.6v3M6.5 12.1h3" />
          <Circle cx="15.6" cy="11.2" r="0.9" fill={color} />
          <Circle cx="17.7" cy="13" r="0.9" fill={color} />
        </>
      )}
      {name === 'entertainment' && (
        <>
          <Rect {...p} x="3" y="5" width="18" height="14" rx="3.2" />
          <Path {...p} d="M10.3 9.3v5.4l4.5-2.7z" />
        </>
      )}
      {name === 'productivity' && (
        <>
          <Rect {...p} x="3" y="7.5" width="18" height="12" rx="2.6" />
          <Path {...p} d="M9 7.5V6.2A1.7 1.7 0 0 1 10.7 4.5h2.6A1.7 1.7 0 0 1 15 6.2v1.3M3 13h18" />
        </>
      )}
      {name === 'other' && (
        <>
          <Rect {...p} x="4" y="4" width="6.5" height="6.5" rx="2" />
          <Rect {...p} x="13.5" y="4" width="6.5" height="6.5" rx="2" />
          <Rect {...p} x="4" y="13.5" width="6.5" height="6.5" rx="2" />
          <Rect {...p} x="13.5" y="13.5" width="6.5" height="6.5" rx="2" />
        </>
      )}
      {name === 'all' && (
        <>
          <Path {...p} d="M12 4l8 4-8 4-8-4z" />
          <Path {...p} d="M4 12l8 4 8-4M4 16l8 4 8-4" />
        </>
      )}
    </Svg>
  );
}
