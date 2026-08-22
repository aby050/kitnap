import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { AchievementDef } from '../../data/progress';

const PALETTE: Record<AchievementDef['medal'], [string, string, string]> = {
  flame: ['#FFD54F', '#FF8A3D', '#C2410C'],
  mint: ['#B9FFD8', '#7CF5B0', '#2BAE6A'],
  gold: ['#FFE9A8', '#F5C542', '#B8860B'],
  steel: ['#D7DEE8', '#8A96A8', '#4B5563'],
  violet: ['#E0D4FF', '#8B7CFF', '#5B4BC9'],
};

export default function Medal({
  medal,
  size = 64,
  locked = false,
  id,
}: {
  medal: AchievementDef['medal'];
  size?: number;
  locked?: boolean;
  id?: string;
}) {
  const [hi, mid, lo] = locked ? ['#3a3a3a', '#222', '#111'] : PALETTE[medal];
  const gid = `m-${id ?? medal}-${locked ? 'l' : 'u'}-${size}`;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: locked ? 0.55 : 1 }}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <SvgGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={hi} />
            <Stop offset="0.5" stopColor={mid} />
            <Stop offset="1" stopColor={lo} />
          </SvgGradient>
        </Defs>
        <Path d="M20 8 L44 8 L52 18 L32 26 L12 18 Z" fill={locked ? '#2a2a2a' : mid} opacity={0.9} />
        <Circle cx="32" cy="38" r="18" fill={`url(#${gid})`} />
        <Circle cx="32" cy="38" r="12" fill="none" stroke={hi} strokeWidth="1.4" opacity={0.7} />
        <Path d="M32 28 L34.4 33.2 L40 34 L36 38 L37 43.6 L32 40.8 L27 43.6 L28 38 L24 34 L29.6 33.2 Z" fill={locked ? '#111' : '#0c0d0e'} opacity={0.55} />
      </Svg>
    </View>
  );
}
