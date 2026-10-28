import React from 'react';
import { Image } from 'react-native';
import { brandMark } from './brandMark';

/**
 * The Kitnap mark.
 *
 * Drawn from the raster artwork: the only vector export of the logo is a
 * coarse polygon trace whose curves visibly step at the sizes this is shown.
 * `tone="dark"` dims it for light surfaces; `color` flattens it to one tint.
 */
export type MarkTone = 'brand' | 'dark';

const ASPECT = 1275 / 1092;

export default function KitnapMark({
  size = 64,
  tone = 'brand',
  color,
}: {
  size?: number;
  tone?: MarkTone;
  /** Overrides `tone` entirely — a flat fill, for a single-colour context. */
  color?: string;
}) {
  return (
    <Image
      source={brandMark}
      accessibilityIgnoresInvertColors
      style={{
        width: size,
        height: size / ASPECT,
        tintColor: color,
        opacity: !color && tone === 'dark' ? 0.85 : 1,
      }}
      resizeMode="contain"
    />
  );
}
