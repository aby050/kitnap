import React from 'react';
import { fonts } from '../design/tokens';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

/** Hand-drawn style spot illustrations for onboarding: dark outlines, white
 *  fills, a single warm accent and dotted "flow" arrows. All original. */
export type ArtName = 'kite' | 'gift' | 'door' | 'cat' | 'cloud' | 'handPhone' | 'thinker' | 'nightBed' | 'pushup' | 'sprout' | 'bellPhone' | 'phoneLock' | 'shield' | 'clock' | 'gauge' | 'chart' | 'camera' | 'apps' | 'dumbbell' | 'sun' | 'pin' | 'wave';

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

function Face({ x, y, r = 1 }: { x: number; y: number; r?: number }) {
  return (
    <G>
      <Circle cx={x - 7 * r} cy={y} r={2.6 * r} fill={S} />
      <Circle cx={x + 7 * r} cy={y} r={2.6 * r} fill={S} />
      <Path d={`M${x - 5 * r} ${y + 7 * r} q${5 * r} ${5 * r} ${10 * r} 0`} fill="none" stroke={S} strokeWidth={2.2} strokeLinecap="round" />
      <Circle cx={x - 13 * r} cy={y + 6 * r} r={3 * r} fill="#F4A9A0" opacity={0.8} />
      <Circle cx={x + 13 * r} cy={y + 6 * r} r={3 * r} fill="#F4A9A0" opacity={0.8} />
    </G>
  );
}

const ART: Record<ArtName, () => React.ReactElement> = {
  /** A smiling kite on a long string over the hills. "Free, and free to go." */
  kite: () => (
    <G>
      <Path d="M10 200 C 70 170, 120 186, 170 194 S 250 176, 292 196" fill="none" stroke={S} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M206 20 L 250 64 L 206 120 L 162 64 Z" fill={A} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M206 20 V 120 M162 64 H 250" stroke={S} strokeWidth={1.8} />
      <Face x={206} y={62} />
      <Path d="M206 120 C 196 140, 216 150, 204 168 C 194 182, 150 186, 120 192" fill="none" stroke={S} strokeWidth={1.8} strokeDasharray="3 5" strokeLinecap="round" />
      <Path d="M210 134 l10 -4 -2 10z M198 154 l10 2 -6 8z" fill={P} stroke={S} strokeWidth={1.6} strokeLinejoin="round" />
      <Bricks x={30} y={40} />
      <Path d="M70 100 a14 14 0 0 1 26 -6 a12 12 0 0 1 18 12 h-48 a8 8 0 0 1 4 -6z" fill={W} stroke={S} strokeWidth={2.4} strokeLinejoin="round" />
    </G>
  ),
  /** A happy gift box with its bow popping. "You're in." */
  gift: () => (
    <G>
      <Bricks x={24} y={60} />
      <Bricks x={248} y={150} />
      <Rect x={94} y={96} width={112} height={100} rx={10} fill={W} stroke={S} strokeWidth={sw} />
      <Rect x={84} y={78} width={132} height={30} rx={8} fill={A} stroke={S} strokeWidth={sw} />
      <Rect x={140} y={78} width={20} height={118} fill={P} stroke={S} strokeWidth={2.4} />
      <Path d="M150 78 C 126 50, 104 62, 118 78 Z M150 78 C 174 50, 196 62, 182 78 Z" fill={P} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Face x={150} y={146} r={1.1} />
      <Path d="M60 110 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z M244 54 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill={B} stroke={S} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M86 40 l6 10 M214 30 l-4 12 M248 96 l12 -4" stroke={S} strokeWidth={2.4} strokeLinecap="round" />
    </G>
  ),
  /** A door left ajar with a friendly key beside it. "Your way out, if you need it." */
  door: () => (
    <G>
      <Bricks x={22} y={150} />
      <Bricks x={250} y={40} />
      <Rect x={96} y={20} width={110} height={186} rx={8} fill={M} stroke={S} strokeWidth={sw} />
      <Path d="M96 20 L 146 34 L 146 196 L 96 206 Z" fill={W} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Circle cx={136} cy={118} r={4} fill={S} />
      <Path d="M150 40 L 200 40 L 200 196 L 150 196" fill="none" stroke={A} strokeWidth={6} opacity={0.5} />
      <G transform="rotate(-20 236 150)">
        <Circle cx={236} cy={124} r={22} fill={A} stroke={S} strokeWidth={sw} />
        <Face x={236} y={120} r={0.8} />
        <Path d="M236 146 V 196 M236 176 h12 M236 188 h10" stroke={S} strokeWidth={sw} strokeLinecap="round" />
      </G>
      <Dots d="M214 110 C 196 100, 176 104, 160 114" />
    </G>
  ),
  /** A cat curled asleep on a face-down phone. "Rest. The phone can wait." */
  cat: () => (
    <G>
      <Path d="M40 12 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill={W} stroke={S} strokeWidth={1.6} />
      <SvgText x={232} y={56} fill={S} fontFamily={fonts.bold} fontSize={18}>z</SvgText>
      <SvgText x={250} y={36} fill={S} fontFamily={fonts.bold} fontSize={24}>z</SvgText>
      <Rect x={50} y={176} width={200} height={26} rx={10} fill={S} />
      <Rect x={58} y={180} width={184} height={8} rx={4} fill="#4A4E55" />
      <Path d="M70 176 C 60 120, 110 96, 160 98 C 210 100, 240 130, 230 176 Z" fill={W} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M220 172 C 250 170, 262 150, 246 140" fill="none" stroke={S} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={106} cy={132} r={34} fill={W} stroke={S} strokeWidth={sw} />
      <Path d="M80 112 L 76 82 L 100 100 Z M118 100 L 138 82 L 136 112 Z" fill={W} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M82 92 L 84 102 M130 92 L 128 102" stroke="#F4A9A0" strokeWidth={4} strokeLinecap="round" />
      <Path d="M90 132 q6 5 12 0 M110 132 q6 5 12 0" fill="none" stroke={S} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx={88} cy={144} r={4} fill="#F4A9A0" opacity={0.8} />
      <Circle cx={126} cy={144} r={4} fill="#F4A9A0" opacity={0.8} />
      <Path d="M104 142 l2 3 2 -3" fill="none" stroke={S} strokeWidth={2} strokeLinecap="round" />
      <Path d="M160 120 C 176 112, 196 116, 206 130" fill="none" stroke={A} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
    </G>
  ),
  /** A smiling cloud with a little sun peeking. "Nothing here yet — and that's fine." */
  cloud: () => (
    <G>
      <Circle cx={200} cy={70} r={30} fill={A} stroke={S} strokeWidth={sw} />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = -Math.PI + (i / 5) * Math.PI;
        return <Line key={i} x1={200 + Math.cos(a) * 40} y1={70 + Math.sin(a) * 40} x2={200 + Math.cos(a) * 52} y2={70 + Math.sin(a) * 52} stroke={S} strokeWidth={sw} strokeLinecap="round" />;
      })}
      <Path d="M70 170 a34 34 0 0 1 20 -60 a44 44 0 0 1 84 -4 a34 34 0 0 1 50 30 a32 32 0 0 1 -4 34 z" fill={W} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Face x={146} y={138} r={1.2} />
      <Bricks x={30} y={50} />
      <Path d="M90 196 l-6 12 M130 196 l-6 12 M170 196 l-6 12" stroke={B} strokeWidth={3} strokeLinecap="round" />
    </G>
  ),
  /** A hand holds the phone; the feeds bounce off its lock. "Block what pulls at you." */
  handPhone: () => (
    <G>
      <Bricks x={226} y={190} />
      <G transform="rotate(-6 160 110)">
        <Rect x={118} y={14} width={104} height={184} rx={22} fill={W} stroke={S} strokeWidth={sw} />
        <Line x1={152} y1={28} x2={188} y2={28} stroke={S} strokeWidth={sw} strokeLinecap="round" />
        <Line x1={136} y1={60} x2={204} y2={60} stroke={M} strokeWidth={2} />
        <Line x1={136} y1={76} x2={190} y2={76} stroke={M} strokeWidth={2} />
        <Rect x={150} y={100} width={40} height={34} rx={7} fill={A} stroke={S} strokeWidth={sw} />
        <Path d="M158 100v-10a12 12 0 0 1 24 0v10" fill="none" stroke={S} strokeWidth={sw} />
        <Circle cx={170} cy={116} r={4} fill={S} />
        <SvgText x={170} y={168} fill={S} fontFamily={fonts.semibold} fontSize={12} textAnchor="middle">Locked</SvgText>
      </G>
      {/* hand from the left edge, thumb over the phone */}
      <Path d="M-6 230 L-6 150 C 20 140, 48 132, 74 128 C 96 124, 112 126, 124 134 C 136 142, 132 156, 118 158 L 92 160 C 104 168, 104 182, 92 186 L 60 196 C 40 214, 20 226, -6 230 Z" fill={W} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M92 160 C 80 160, 70 156, 64 150" fill="none" stroke={S} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M88 186 C 76 186, 66 182, 60 176" fill="none" stroke={S} strokeWidth={2.4} strokeLinecap="round" />
      <Rect x={20} y={20} width={40} height={40} rx={11} fill={P} stroke={S} strokeWidth={sw} />
      <Path d="M34 32l14 8-14 8z" fill={W} stroke={S} strokeWidth={2} strokeLinejoin="round" />
      <Label x={40} y={78}>Reels</Label>
      <Dots d="M64 38 C 86 36, 100 48, 114 62" />
      <Path d="M108 54 l8 8 -10 4" fill="none" stroke={S} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={266} cy={56} r={24} fill={B} stroke={S} strokeWidth={sw} />
      <Path d="M254 50h24M254 58h24M254 66h14" stroke={W} strokeWidth={3} strokeLinecap="round" />
      <Label x={266} y={98}>Feeds</Label>
      <Dots d="M240 64 C 230 76, 228 86, 226 96" />
      <Path d="M232 90 l-6 8 -4 -10" fill="none" stroke={S} strokeWidth={1.6} strokeLinecap="round" />
    </G>
  ),
  /** A person with what they care about floating up from their head. "Your why." */
  thinker: () => (
    <G>
      <Bricks x={20} y={150} />
      <Bricks x={250} y={140} />
      <Path d="M70 222 C 74 182, 104 164, 132 160 L 132 112 C 132 98, 140 90, 152 90 L 176 90 C 186 90, 192 98, 192 108 L 210 126 L 192 130 L 192 160 C 220 166, 240 186, 244 222 Z" fill={W} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M132 92 C 148 84, 176 84, 192 92" fill="none" stroke={S} strokeWidth={sw} />
      <Path d="M134 92 C 150 98, 174 98, 190 92 C 174 86, 150 86, 134 92 Z" fill={A} stroke={S} strokeWidth={2} />
      <Circle cx={170} cy={112} r={2.6} fill={S} />
      <Circle cx={182} cy={112} r={2.6} fill={S} />
      <Path d="M166 132 q10 8 20 0" fill="none" stroke={S} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M150 160 l-4 18 M214 186 l-6 16" stroke={S} strokeWidth={2.4} strokeLinecap="round" />
      <Dots d="M150 84 C 140 64, 110 60, 96 40" />
      <Dots d="M162 82 C 164 62, 160 44, 162 28" />
      <Dots d="M176 84 C 190 64, 214 58, 228 40" />
      <G transform="rotate(-14 80 30)">
        <Path d="M60 22 h40 v30 h-40z" fill={B} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
        <Path d="M80 22 v30" stroke={S} strokeWidth={2} />
      </G>
      <Path d="M148 6 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0" fill={A} stroke={S} strokeWidth={2.4} />
      <G transform="rotate(12 240 26)">
        <Path d="M228 26 a8 8 0 0 1 12 -6 a8 8 0 0 1 12 6 c0 10 -12 18 -12 18 s-12 -8 -12 -18z" fill={P} stroke={S} strokeWidth={2.4} />
      </G>
    </G>
  ),
  /** In bed, lit by the phone, the clock past midnight. "When the phone wins." */
  nightBed: () => (
    <G>
      <Path d="M236 36 a22 22 0 1 0 22 30 a17 17 0 0 1 -22 -30z" fill={B} stroke={S} strokeWidth={2.4} />
      <Path d="M40 28 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z M280 110 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill={W} stroke={S} strokeWidth={1.6} />
      <Path d="M20 190 h260 v20 h-260z" fill={W} stroke={S} strokeWidth={sw} />
      <Path d="M30 190 C 40 150, 90 140, 150 146 L 270 150 L 270 190 Z" fill={P} stroke={S} strokeWidth={sw} strokeLinejoin="round" opacity={0.95} />
      <Path d="M40 150 C 40 130, 70 124, 86 132 L 84 158 C 66 160, 46 160, 40 150 Z" fill={W} stroke={S} strokeWidth={sw} />
      <Circle cx={100} cy={124} r={22} fill={W} stroke={S} strokeWidth={sw} />
      <Path d="M92 122 q4 3 8 0 M106 122 q4 3 8 0" fill="none" stroke={S} strokeWidth={2} strokeLinecap="round" />
      <G transform="rotate(-18 136 108)">
        <Rect x={124} y={84} width={26} height={44} rx={6} fill={S} />
        <Rect x={127} y={88} width={20} height={34} rx={3} fill={A} />
      </G>
      <Path d="M150 96 L 196 70 L 200 120 Z" fill={A} opacity={0.18} />
      <Circle cx={60} cy={60} r={30} fill={W} stroke={S} strokeWidth={sw} />
      <Line x1={60} y1={60} x2={60} y2={40} stroke={S} strokeWidth={3} strokeLinecap="round" />
      <Line x1={60} y1={60} x2={72} y2={64} stroke={S} strokeWidth={3} strokeLinecap="round" />
      <SvgText x={60} y={108} fill={S} fontFamily={fonts.semibold} fontSize={12} textAnchor="middle">1:30 am</SvgText>
    </G>
  ),
  /** Push-ups beside the phone: the unlock is a few reps. "Move to unlock." */
  pushup: () => (
    <G>
      <Bricks x={240} y={30} />
      <Line x1={10} y1={196} x2={290} y2={196} stroke={S} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx={196} cy={120} r={18} fill={W} stroke={S} strokeWidth={sw} />
      <Circle cx={202} cy={116} r={2.4} fill={S} />
      <Path d="M60 186 L 176 134" stroke={S} strokeWidth={22} strokeLinecap="round" />
      <Path d="M60 186 L 176 134" stroke={W} strokeWidth={16} strokeLinecap="round" />
      <Path d="M168 140 L 176 196 M186 136 L 196 196" stroke={S} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M60 186 L 34 194" stroke={S} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M58 180 C 90 170, 130 152, 170 134" fill="none" stroke={A} strokeWidth={4} strokeLinecap="round" opacity={0.9} />
      <G transform="rotate(10 252 150)">
        <Rect x={236} y={124} width={34} height={58} rx={8} fill={W} stroke={S} strokeWidth={sw} />
        <Path d="M246 146 v-6 a7 7 0 0 1 14 0 v6" fill="none" stroke={S} strokeWidth={2.2} />
        <Rect x={243} y={146} width={20} height={16} rx={4} fill={A} stroke={S} strokeWidth={2} />
      </G>
      <Dots d="M214 112 C 226 100, 240 104, 246 118" />
      <SvgText x={120} y={110} fill={S} fontFamily={fonts.bold} fontSize={16} textAnchor="middle">8 / 10</SvgText>
      <Path d="M150 80 l0 -14 M144 72 l6 -6 6 6" stroke={S} strokeWidth={2.2} fill="none" strokeLinecap="round" />
    </G>
  ),
  /** A sprout in a pot with a rising line behind it. "Small days add up." */
  sprout: () => (
    <G>
      <Bricks x={22} y={60} />
      <Path d="M30 170 C 80 160, 110 120, 150 120 S 230 70, 272 30" fill="none" stroke={A} strokeWidth={4} strokeLinecap="round" strokeDasharray="1 0" />
      <Path d="M262 28 l12 0 -2 12" fill="none" stroke={A} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M112 150 h76 l-8 60 h-60z" fill={P} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M106 150 h88" stroke={S} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M150 150 C 150 120, 150 100, 150 80" stroke={S} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d="M150 112 C 130 112, 112 98, 108 78 C 130 78, 148 92, 150 112 Z" fill={W} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M150 96 C 170 96, 190 82, 194 60 C 170 60, 152 76, 150 96 Z" fill={W} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
      <Label x={60} y={196}>Day 1</Label>
      <Label x={250} y={70}>Day 30</Label>
    </G>
  ),
  /** The phone rings a bell when time is up. "We'll tell you when it ends." */
  bellPhone: () => (
    <G>
      <Bricks x={24} y={170} />
      <Bricks x={244} y={176} />
      <G transform="rotate(6 130 110)">
        <Rect x={84} y={20} width={96} height={180} rx={20} fill={W} stroke={S} strokeWidth={sw} />
        <Rect x={100} y={52} width={64} height={30} rx={8} fill={M} stroke={S} strokeWidth={2} />
        <Path d="M108 64h40M108 72h26" stroke={S} strokeWidth={2} strokeLinecap="round" />
        <SvgText x={132} y={130} fill={S} fontFamily={fonts.bold} fontSize={22} textAnchor="middle">0:00</SvgText>
      </G>
      <G transform="rotate(14 236 76)">
        <Path d="M212 96 C 212 70, 220 52, 236 52 C 252 52, 260 70, 260 96 L 268 104 L 204 104 Z" fill={A} stroke={S} strokeWidth={sw} strokeLinejoin="round" />
        <Circle cx={236} cy={112} r={7} fill={W} stroke={S} strokeWidth={2.4} />
        <Line x1={236} y1={44} x2={236} y2={52} stroke={S} strokeWidth={sw} strokeLinecap="round" />
      </G>
      <Path d="M276 60 q10 10 0 24 M286 52 q16 18 0 40" fill="none" stroke={S} strokeWidth={2} strokeLinecap="round" />
      <Dots d="M206 104 C 196 110, 190 116, 184 120" />
    </G>
  ),
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
        <Face x={150} y={170} />
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
      <Face x={150} y={92} r={1.2} />
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
