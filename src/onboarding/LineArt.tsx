import React from 'react';
import { fonts } from '../design/tokens';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

/** Hand-drawn style spot illustrations for onboarding: dark outlines, white
 *  fills, a single warm accent and dotted "flow" arrows. All original. */
export type ArtName = 'phoneLock' | 'shield' | 'clock' | 'gauge' | 'chart' | 'camera' | 'apps' | 'dumbbell' | 'sun' | 'pin' | 'wave';

const S = '#2E3136';
const W = '#FFFFFF';
const A = '#F08A1C';
const B = '#6FA8DC';
const P = '#B57EDC';
const M = '#E8E4DC';
const sw = 3;

function Dots({ d }: { d: string }) {
  return <Path d={d} stroke={S} strokeWidth={1.6} strokeDasharray="3 5" fill="none" strokeLinecap="round" />;
}

function Label({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <SvgText x={x} y={y} fill={S} fontFamily={fonts.medium} fontSize={13} fontWeight="500" textAnchor="middle">
      {children}
    </SvgText>
  );
}

function Bricks({ x, y }: { x: number; y: number }) {
  return (
    <G stroke="#C9C4BA" strokeWidth={1.4} fill="none">
      <Path d={`M${x} ${y}h34M${x + 6} ${y + 9}h34M${x} ${y + 18}h28M${x + 14} ${y}v9M${x + 22} ${y + 9}v9`} />
    </G>
  );
}

const ART: Record<ArtName, () => React.ReactElement> = {
  phoneLock: () => (
    <G>
      <Bricks x={20} y={150} />
      <Bricks x={250} y={40} />
      <G transform="rotate(-8 150 115)">
        <Rect x={102} y={22} width={96} height={180} rx={20} fill={W} stroke={S} strokeWidth={sw} />
        <Line x1={136} y1={34} x2={164} y2={34} stroke={S} strokeWidth={sw} strokeLinecap="round" />
        <Rect x={130} y={98} width={40} height={34} rx={7} fill={A} stroke={S} strokeWidth={sw} />
        <Path d="M138 98v-10a12 12 0 0 1 24 0v10" fill="none" stroke={S} strokeWidth={sw} />
        <Circle cx={150} cy={114} r={4} fill={S} />
      </G>
      <Rect x={22} y={40} width={44} height={44} rx={12} fill={P} stroke={S} strokeWidth={sw} />
      <Path d="M36 56l16 6-16 6z" fill={W} stroke={S} strokeWidth={2} strokeLinejoin="round" />
      <Label x={44} y={102}>Reels</Label>
      <Dots d="M70 60 C 90 58, 96 80, 104 92" />
      <Rect x={236} y={130} width={44} height={44} rx={12} fill={B} stroke={S} strokeWidth={sw} />
      <Path d="M248 146h20M248 154h20M248 162h12" stroke={W} strokeWidth={3} strokeLinecap="round" />
      <Label x={258} y={192}>Feeds</Label>
      <Dots d="M232 148 C 214 150, 210 132, 200 124" />
    </G>
  ),
  shield: () => (
    <G>
      <Bricks x={24} y={60} />
      <Bricks x={244} y={150} />
      <Path d="M150 20 L212 44 V104 C212 150 182 180 150 196 C118 180 88 150 88 104 V44 Z" fill={W} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M150 40 L194 58 V104 C194 138 174 160 150 174 Z" fill={A} opacity={0.9} />
      <Path d="M126 106 l16 16 32 -34" fill="none" stroke={S} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={56} cy={150} r={20} fill={P} stroke={S} strokeWidth={sw} />
      <Path d="M48 150 a8 8 0 0 1 16 0 c0 6 -8 10 -8 14 c0 -4 -8 -8 -8 -14z" fill={W} stroke={S} strokeWidth={1.8} />
      <Dots d="M76 146 C 84 136, 84 124, 90 116" />
      <Circle cx={250} cy={60} r={20} fill={B} stroke={S} strokeWidth={sw} />
      <Path d="M244 54 a10 10 0 1 0 12 12 a8 8 0 0 1 -12 -12z" fill={W} stroke={S} strokeWidth={1.8} />
      <Dots d="M232 70 C 222 78, 220 86, 212 90" />
    </G>
  ),
  clock: () => (
    <G>
      <Bricks x={30} y={168} />
      <Bricks x={240} y={30} />
      <Circle cx={150} cy={112} r={78} fill={W} stroke={S} strokeWidth={sw} />
      <Path d="M150 112 L150 34 A78 78 0 0 1 222 84 Z" fill={A} opacity={0.85} />
      <Circle cx={150} cy={112} r={78} fill="none" stroke={S} strokeWidth={sw} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <Line key={i} x1={150 + Math.sin(a) * 66} y1={112 - Math.cos(a) * 66} x2={150 + Math.sin(a) * 72} y2={112 - Math.cos(a) * 72} stroke={S} strokeWidth={2} />;
      })}
      <Line x1={150} y1={112} x2={150} y2={62} stroke={S} strokeWidth={4} strokeLinecap="round" />
      <Line x1={150} y1={112} x2={188} y2={124} stroke={S} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={150} cy={112} r={6} fill={S} />
      <Path d="M44 70 a16 16 0 1 0 18 20 a12 12 0 0 1 -18 -20z" fill={B} stroke={S} strokeWidth={2.4} />
      <Dots d="M64 90 C 70 100, 70 106, 74 110" />
    </G>
  ),
  gauge: () => (
    <G>
      <Bricks x={24} y={40} />
      <Bricks x={246} y={44} />
      <Path d="M50 170 A100 100 0 0 1 250 170" fill={W} stroke={S} strokeWidth={sw} />
      <Path d="M68 170 A82 82 0 0 1 110 98" fill="none" stroke={P} strokeWidth={14} />
      <Path d="M114 96 A82 82 0 0 1 186 96" fill="none" stroke={B} strokeWidth={14} />
      <Path d="M190 98 A82 82 0 0 1 232 170" fill="none" stroke={A} strokeWidth={14} />
      <Line x1={150} y1={170} x2={206} y2={110} stroke={S} strokeWidth={5} strokeLinecap="round" />
      <Circle cx={150} cy={170} r={10} fill={S} />
      <Line x1={40} y1={170} x2={260} y2={170} stroke={S} strokeWidth={sw} strokeLinecap="round" />
      <Label x={64} y={194}>Phone</Label>
      <Label x={236} y={194}>You</Label>
    </G>
  ),
  chart: () => (
    <G>
      <G transform="rotate(-4 150 110)">
        <Rect x={50} y={22} width={200} height={170} rx={30} fill={W} stroke={S} strokeWidth={sw} />
        {[60, 90, 120, 150].map((y) => (
          <Line key={y} x1={70} y1={y} x2={230} y2={y} stroke={M} strokeWidth={1.6} />
        ))}
        <Path d="M72 70 C 100 80, 110 96, 136 98 S 170 126, 190 134 S 220 150, 230 158" fill="none" stroke={A} strokeWidth={4} strokeLinecap="round" />
        <SvgText x={72} y={176} fill={S} fontFamily={fonts.bold} fontSize={15} fontWeight="700">Your day, in hours</SvgText>
      </G>
      <Dots d="M28 40 C 30 70, 40 80, 52 84" />
      <Rect x={10} y={10} width={30} height={30} rx={8} fill={P} stroke={S} strokeWidth={2.4} />
      <Dots d="M276 176 C 270 160, 262 156, 252 150" />
      <Rect x={262} y={176} width={30} height={30} rx={8} fill={B} stroke={S} strokeWidth={2.4} />
    </G>
  ),
  camera: () => (
    <G>
      <Bricks x={26} y={160} />
      <Bricks x={246} y={50} />
      <G transform="rotate(5 150 110)">
        <Rect x={86} y={20} width={128} height={156} rx={10} fill={W} stroke={S} strokeWidth={sw} />
        <Rect x={98} y={32} width={104} height={104} rx={6} fill={A} opacity={0.85} stroke={S} strokeWidth={2.4} />
        <Circle cx={150} cy={80} r={22} fill={W} stroke={S} strokeWidth={2.4} />
        <Circle cx={143} cy={77} r={2.5} fill={S} />
        <Circle cx={157} cy={77} r={2.5} fill={S} />
        <Path d="M142 87 q8 7 16 0" fill="none" stroke={S} strokeWidth={2.2} strokeLinecap="round" />
        <Path d="M114 136 q36 -40 72 0" fill={W} stroke={S} strokeWidth={2.4} />
        <SvgText x={150} y={160} fill={S} fontFamily={fonts.semibold} fontSize={13} fontWeight="600" textAnchor="middle">Day one</SvgText>
      </G>
      <Path d="M40 60 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6z" fill={B} stroke={S} strokeWidth={2} strokeLinejoin="round" />
      <Dots d="M60 80 C 72 90, 78 96, 88 98" />
    </G>
  ),
  apps: () => (
    <G>
      <Rect x={20} y={20} width={40} height={40} rx={11} fill={P} stroke={S} strokeWidth={sw} transform="rotate(-12 40 40)" />
      <Rect x={130} y={8} width={40} height={40} rx={11} fill={A} stroke={S} strokeWidth={sw} transform="rotate(8 150 28)" />
      <Rect x={240} y={22} width={40} height={40} rx={11} fill={B} stroke={S} strokeWidth={sw} transform="rotate(14 260 42)" />
      <Dots d="M48 70 C 60 100, 90 110, 112 128" />
      <Dots d="M150 56 C 146 80, 154 100, 150 120" />
      <Dots d="M256 70 C 244 100, 214 110, 190 128" />
      <Path d="M86 130 h128 l-10 70 h-108 z" fill={W} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M80 130 h140" stroke={S} strokeWidth={sw} strokeLinecap="round" />
      <Rect x={134} y={152} width={32} height={26} rx={6} fill={A} stroke={S} strokeWidth={2.4} />
      <Path d="M141 152v-7a9 9 0 0 1 18 0v7" fill="none" stroke={S} strokeWidth={2.4} />
    </G>
  ),
  dumbbell: () => (
    <G>
      <Bricks x={30} y={40} />
      <Bricks x={240} y={160} />
      <G transform="rotate(-14 150 110)">
        <Line x1={90} y1={110} x2={210} y2={110} stroke={S} strokeWidth={8} strokeLinecap="round" />
        <Rect x={66} y={72} width={26} height={76} rx={8} fill={A} stroke={S} strokeWidth={sw} />
        <Rect x={46} y={82} width={22} height={56} rx={7} fill={W} stroke={S} strokeWidth={sw} />
        <Rect x={208} y={72} width={26} height={76} rx={8} fill={A} stroke={S} strokeWidth={sw} />
        <Rect x={232} y={82} width={22} height={56} rx={7} fill={W} stroke={S} strokeWidth={sw} />
      </G>
      <Path d="M150 180 l8 -16 8 16" fill="none" stroke={S} strokeWidth={2.4} strokeLinecap="round" />
      <Label x={158} y={206}>10 reps</Label>
    </G>
  ),
  sun: () => (
    <G>
      <Bricks x={30} y={60} />
      <Bricks x={240} y={30} />
      <Circle cx={150} cy={96} r={40} fill={A} stroke={S} strokeWidth={sw} />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <Line key={i} x1={150 + Math.cos(a) * 52} y1={96 + Math.sin(a) * 52} x2={150 + Math.cos(a) * 66} y2={96 + Math.sin(a) * 66} stroke={S} strokeWidth={sw} strokeLinecap="round" />;
      })}
      <Path d="M20 196 C 70 160, 110 176, 150 186 S 240 160, 280 190" fill="none" stroke={S} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M60 176 l0 -22 M54 160 l6 -6 6 6" stroke={S} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Path d="M236 172 l0 -18 M230 158 l6 -6 6 6" stroke={S} strokeWidth={2.4} fill="none" strokeLinecap="round" />
    </G>
  ),
  pin: () => (
    <G>
      <Path d="M30 170 L110 140 L190 168 L270 138 L270 196 L190 214 L110 196 L30 214 Z" fill={W} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Line x1={110} y1={140} x2={110} y2={196} stroke={S} strokeWidth={2} />
      <Line x1={190} y1={168} x2={190} y2={214} stroke={S} strokeWidth={2} />
      <Path d="M150 30 a36 36 0 0 1 36 36 c0 30 -36 70 -36 70 s-36 -40 -36 -70 a36 36 0 0 1 36 -36z" fill={A} stroke={S} strokeWidth={sw} />
      <Circle cx={150} cy={66} r={13} fill={W} stroke={S} strokeWidth={2.4} />
      <Dots d="M60 120 C 80 100, 100 100, 112 90" />
      <Dots d="M240 110 C 220 96, 200 92, 188 88" />
    </G>
  ),
  wave: () => (
    <G>
      <Bricks x={30} y={50} />
      <Bricks x={240} y={160} />
      <Path d="M90 196 C 96 150, 110 130, 150 128 S 206 150, 212 196" fill={W} stroke={S} strokeWidth={sw} />
      <Circle cx={150} cy={86} r={36} fill={W} stroke={S} strokeWidth={sw} />
      <Circle cx={138} cy={82} r={3} fill={S} />
      <Circle cx={162} cy={82} r={3} fill={S} />
      <Path d="M140 98 q10 9 20 0" fill="none" stroke={S} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M200 150 C 214 130, 222 110, 236 96" fill="none" stroke={S} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={240} cy={90} r={12} fill={A} stroke={S} strokeWidth={sw} />
      <Path d="M258 76 q8 8 0 18 M266 70 q12 14 0 30" fill="none" stroke={S} strokeWidth={2} strokeLinecap="round" />
    </G>
  ),
};

export default function LineArt({ name, height = 200 }: { name: ArtName; height?: number }) {
  const Draw = ART[name];
  return (
    <Svg width="100%" height={height} viewBox="0 0 300 220">
      <Draw />
    </Svg>
  );
}
