import React from 'react';
import Svg, { Circle, Defs, Path, Rect, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

/**
 * Simplified brand marks for the curated blocked-apps list.
 *
 * Why these are drawn rather than fetched: Android hands us the real launcher
 * icon at runtime, but iOS never exposes installed-app icons to third-party
 * apps at all. Without these, every row on iOS falls back to a monogram tile
 * and a list of blocked apps reads as "IN / X( / SN / RE".
 *
 * They are deliberately *simplified* — the recognisable silhouette and brand
 * colour, not a reproduction of the logo. Enough to identify a row at a glance,
 * which is the only job they have here.
 */

type GlyphProps = { size: number };

function Instagram({ size }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <SvgGradient id="ig" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#FEDA75" />
          <Stop offset="0.35" stopColor="#FA7E1E" />
          <Stop offset="0.65" stopColor="#D62976" />
          <Stop offset="1" stopColor="#962FBF" />
        </SvgGradient>
      </Defs>
      <Rect width="100" height="100" rx="24" fill="url(#ig)" />
      <Rect x="24" y="24" width="52" height="52" rx="16" stroke="#fff" strokeWidth="6" fill="none" />
      <Circle cx="50" cy="50" r="13" stroke="#fff" strokeWidth="6" fill="none" />
      <Circle cx="68.5" cy="31.5" r="4.2" fill="#fff" />
    </Svg>
  );
}

function XTwitter({ size }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" rx="24" fill="#000000" />
      <Path
        d="M27 26h13.5l14.2 19.4L71.5 26H80L58.8 49.6 81 74H67.5L52 53.2 34.6 74H26l22.8-25.3z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function Snapchat({ size }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" rx="24" fill="#FFFC00" />
      <Path
        d="M50 22c9.6 0 15.4 6.6 15.4 16.2 0 3.1-.4 5.4-.4 7 1.6 1 3.6.4 5.4-.3 1.6-.6 3 .4 3 1.9 0 2.4-4.6 4.3-6.4 5.1-.9.4-1.2 1-.9 2 1.4 4.4 6.2 9.3 11.2 10.6 1.3.3 1.8 1.3 1.4 2.4-.7 2-4.6 3-8.3 3.5-.6.1-.9.5-1.1 1.4-.3 1.6-.7 2.9-2.3 2.9-1.9 0-4.3-.8-7.4-.8-4.3 0-6 4.1-12.6 4.1S39 74 34.7 74c-3.1 0-5.5.8-7.4.8-1.6 0-2-1.3-2.3-2.9-.2-.9-.5-1.3-1.1-1.4-3.7-.5-7.6-1.5-8.3-3.5-.4-1.1.1-2.1 1.4-2.4 5-1.3 9.8-6.2 11.2-10.6.3-1 0-1.6-.9-2-1.8-.8-6.4-2.7-6.4-5.1 0-1.5 1.4-2.5 3-1.9 1.8.7 3.8 1.3 5.4.3 0-1.6-.4-3.9-.4-7C29 28.6 40.4 22 50 22z"
        fill="#FFFFFF"
        stroke="#111"
        strokeWidth="2.5"
      />
    </Svg>
  );
}

function Reddit({ size }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" rx="24" fill="#FF4500" />
      <Circle cx="50" cy="56" r="24" fill="#FFFFFF" />
      <Circle cx="41" cy="54" r="4.2" fill="#FF4500" />
      <Circle cx="59" cy="54" r="4.2" fill="#FF4500" />
      <Path d="M40 65c3 3 7 4.4 10 4.4S57 68 60 65" stroke="#FF4500" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <Circle cx="74" cy="38" r="6.5" fill="#FFFFFF" />
      <Path d="M62 34l9-9" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" />
      <Circle cx="71" cy="24" r="4.5" fill="#FFFFFF" />
    </Svg>
  );
}

function Facebook({ size }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" rx="24" fill="#1877F2" />
      <Path
        d="M57 40h9v-11h-9c-7.2 0-13 5.8-13 13v6H35v11h9v25h11V59h9.5L66 48h-11v-6c0-1.1.9-2 2-2z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function TikTok({ size }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" rx="24" fill="#000000" />
      <Path
        d="M62 22c1.3 7.2 5.7 11.4 13 12v10.4c-4.4.4-8.3-.9-12.8-3.5v15.6c0 19.8-21.6 26-30.3 11.8-5.6-9.1-2.2-25.2 15.7-25.9v11c-1.4.2-2.8.6-4.1 1-4 1.4-6.2 3.9-5.6 8.3.6 4.4 5.9 7.4 10.5 5.5 3-1.2 4.9-4 4.9-7.5V22z"
        fill="#FFFFFF"
      />
      <Path
        d="M60 20c1.3 7.2 5.7 11.4 13 12v10.4c-4.4.4-8.3-.9-12.8-3.5v15.6c0 19.8-21.6 26-30.3 11.8-5.6-9.1-2.2-25.2 15.7-25.9v11c-1.4.2-2.8.6-4.1 1-4 1.4-6.2 3.9-5.6 8.3.6 4.4 5.9 7.4 10.5 5.5 3-1.2 4.9-4 4.9-7.5V20z"
        fill="#25F4EE"
        opacity={0.85}
      />
      <Path
        d="M61 21c1.3 7.2 5.7 11.4 13 12v10.4c-4.4.4-8.3-.9-12.8-3.5v15.6c0 19.8-21.6 26-30.3 11.8-5.6-9.1-2.2-25.2 15.7-25.9v11c-1.4.2-2.8.6-4.1 1-4 1.4-6.2 3.9-5.6 8.3.6 4.4 5.9 7.4 10.5 5.5 3-1.2 4.9-4 4.9-7.5V21z"
        fill="#FE2C55"
        opacity={0.85}
      />
      <Path
        d="M62 22c1.3 7.2 5.7 11.4 13 12v10.4c-4.4.4-8.3-.9-12.8-3.5v15.6c0 19.8-21.6 26-30.3 11.8-5.6-9.1-2.2-25.2 15.7-25.9v11c-1.4.2-2.8.6-4.1 1-4 1.4-6.2 3.9-5.6 8.3.6 4.4 5.9 7.4 10.5 5.5 3-1.2 4.9-4 4.9-7.5V22z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function YouTube({ size }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" rx="24" fill="#FFFFFF" />
      <Rect x="12" y="28" width="76" height="44" rx="13" fill="#FF0000" />
      <Path d="M43 40l20 10-20 10z" fill="#FFFFFF" />
    </Svg>
  );
}

function WhatsApp({ size }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" rx="24" fill="#25D366" />
      <Path
        d="M50 22c-15.5 0-28 12.5-28 28 0 5 1.3 9.6 3.6 13.7L22 78l14.8-3.4A28 28 0 1 0 50 22zm16 39.4c-.7 2-4 3.8-5.6 4-1.4.2-3.2.3-5.2-.3-1.2-.4-2.7-.9-4.7-1.7-8.2-3.6-13.6-11.9-14-12.5-.4-.6-3.4-4.5-3.4-8.6s2.1-6.1 2.9-6.9c.8-.8 1.7-1 2.3-1h1.6c.5 0 1.2-.2 1.9 1.5.7 1.7 2.4 5.8 2.6 6.2.2.4.3.9 0 1.5-1.4 2.8-2.9 2.7-2.1 4 3 5.1 5.9 6.9 10.4 9.2.7.3 1.2.3 1.6-.2.4-.6 1.9-2.2 2.4-3 .5-.7 1-.6 1.6-.4.7.2 4.7 2.2 5.5 2.6.8.4 1.3.6 1.5.9.2.4.2 1.7-.5 3.7z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

/** Package name → mark. Anything absent falls back to the monogram tile. */
const BRANDS: Record<string, (p: GlyphProps) => React.ReactElement> = {
  'com.instagram.android': Instagram,
  'com.twitter.android': XTwitter,
  'com.snapchat.android': Snapchat,
  'com.reddit.frontpage': Reddit,
  'com.facebook.katana': Facebook,
  'com.zhiliaoapp.musically': TikTok,
  'com.google.android.youtube': YouTube,
  'com.whatsapp': WhatsApp,
};

export function hasBrandGlyph(packageName?: string): boolean {
  return !!packageName && packageName in BRANDS;
}

export default function BrandGlyph({
  packageName,
  size = 44,
}: {
  packageName?: string;
  size?: number;
}) {
  const Mark = packageName ? BRANDS[packageName] : undefined;
  if (!Mark) return null;
  return <Mark size={size} />;
}
