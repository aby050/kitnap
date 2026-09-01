import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Ellipse,
  Path,
  Rect,
  Line,
  Defs,
  LinearGradient as SvgGradient,
  RadialGradient,
  Stop,
  G,
} from 'react-native-svg';
import Icon, { IconName } from '../../ui/Icon';
import { palette } from '../../design/tokens';
import Medal from './Medal';
import { AchievementDef } from '../../data/progress';

/**
 * The Profile visual language — an "Opal"-style focus dashboard rendered
 * entirely in vector so it ships with the app (no bitmaps, no emoji).
 *
 *  · GemHero      the iridescent focus crystal + glow bloom (screen centrepiece)
 *  · IntensityBars two-tone stacked bar chart (mint = held, coral = slip)
 *  · Donut         segmented ring for the device-usage breakdown
 *  · Sparkline     inline trend line for a metric mini-card
 *  · SegmentBar    3-step level indicator ("Low / Med / High")
 *  · GradientMeter horizontal gradient fill for a 0–max value
 *  · DotProgress   pip row counting toward a target
 *  · TierThumb     the reward-timeline medallion tile + laurel
 *  · TierConnector the ↓ link drawn between reward tiers
 */

let _uid = 0;
/** Stable-per-mount id so stacked SVG gradients never collide. useId isn't
 *  available in every RN path here, and a module counter is deterministic
 *  within a render pass. */
function useGid(prefix: string) {
  return React.useMemo(() => `${prefix}-${++_uid}`, [prefix]);
}

/* ─────────────────────────────────────────────────────────────
 * GEM HERO — the iridescent crystal that anchors the screen
 * ───────────────────────────────────────────────────────────── */

export function GemHero({ size = 208, glow = palette.accent }: { size?: number; glow?: string }) {
  const g = useGid('gem');
  const h = size * 1.06;
  return (
    <View style={{ width: size, height: h, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={h} viewBox="0 0 200 212">
        <Defs>
          {/* Ambient bloom behind the gem — this is the screen's light source. */}
          <RadialGradient id={`${g}-glow`} cx="50%" cy="44%" r="52%">
            <Stop offset="0%" stopColor={glow} stopOpacity={0.42} />
            <Stop offset="42%" stopColor={glow} stopOpacity={0.12} />
            <Stop offset="100%" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
          {/* Play-of-colour: mint → teal → blue → violet → gold, the opal spectrum. */}
          <SvgGradient id={`${g}-body`} x1="0.12" y1="0.05" x2="0.9" y2="0.98">
            <Stop offset="0" stopColor="#D6FCEA" />
            <Stop offset="0.24" stopColor="#7CF5B0" />
            <Stop offset="0.46" stopColor="#6FE3E8" />
            <Stop offset="0.66" stopColor="#8FA9FF" />
            <Stop offset="0.84" stopColor="#C79BFF" />
            <Stop offset="1" stopColor="#FFE29A" />
          </SvgGradient>
          <SvgGradient id={`${g}-flash`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.0} />
            <Stop offset="0.5" stopColor="#BFFFF0" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#8FA9FF" stopOpacity={0.0} />
          </SvgGradient>
          <SvgGradient id={`${g}-ped`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1C1C21" />
            <Stop offset="1" stopColor="#050506" />
          </SvgGradient>
        </Defs>

        {/* Glow field */}
        <Rect x="0" y="0" width="200" height="212" fill={`url(#${g}-glow)`} />

        {/* Pedestal */}
        <Ellipse cx="100" cy="192" rx="46" ry="9" fill="#000000" opacity={0.6} />
        <Rect x="66" y="176" width="68" height="16" rx="6" fill={`url(#${g}-ped)`} />

        {/* Crystal body — an irregular rounded opal silhouette */}
        <G>
          <Path
            d="M100 20 C132 26 170 50 172 94 C174 132 146 168 100 176 C56 168 26 134 28 96 C30 52 68 26 100 20 Z"
            fill={`url(#${g}-body)`}
          />
          {/* Colour flashes — soft internal iridescence */}
          <Path d="M74 44 C104 40 142 66 138 104 C120 92 96 84 70 96 C58 74 62 52 74 44 Z" fill={`url(#${g}-flash)`} />
          <Path d="M118 118 C136 120 150 138 138 156 C120 150 104 150 92 158 C104 132 106 120 118 118 Z" fill="#8FA9FF" opacity={0.28} />
          <Path d="M50 108 C66 104 86 116 84 138 C68 138 56 132 46 140 C42 126 42 114 50 108 Z" fill="#FFE29A" opacity={0.22} />
          {/* Facet lines */}
          <Path d="M100 24 L100 172 M40 92 L160 100 M60 46 L150 150 M150 52 L54 148" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={1} />
          {/* Top highlight */}
          <Ellipse cx="80" cy="58" rx="22" ry="12" fill="#FFFFFF" opacity={0.5} transform="rotate(-24 80 58)" />
          {/* Rim */}
          <Path
            d="M100 20 C132 26 170 50 172 94 C174 132 146 168 100 176 C56 168 26 134 28 96 C30 52 68 26 100 20 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.3}
            strokeWidth={1.5}
          />
        </G>
      </Svg>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
 * INTENSITY BARS — two-tone stacked columns (Opal home chart)
 * ───────────────────────────────────────────────────────────── */

export function IntensityBars({
  data,
  width,
  height = 132,
  style,
}: {
  /** Each column: `value` mint minutes; `flag` marks a slip (hard-unlock) day
   *  with a fixed coral notch — a marker, never a fabricated magnitude. */
  data: { value: number; flag?: boolean }[];
  width: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const g = useGid('bars');
  const n = Math.max(1, data.length);
  const gap = n > 24 ? 2 : n > 14 ? 3 : 6;
  const bw = Math.max(3, (width - gap * (n - 1)) / n);
  const max = Math.max(1, ...data.map((d) => d.value));
  const minStub = 4; // empty days still show a faint stub, like the reference
  const notch = 6; // fixed coral marker height for a slip day

  return (
    <View style={style}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id={`${g}-good`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#B9FF6A" />
            <Stop offset="0.55" stopColor="#7CF5B0" />
            <Stop offset="1" stopColor="#4FCB92" />
          </SvgGradient>
          <SvgGradient id={`${g}-bad`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F0604A" />
            <Stop offset="1" stopColor="#C2410C" />
          </SvgGradient>
        </Defs>
        {data.map((d, i) => {
          const x = i * (bw + gap);
          const r = Math.min(bw / 2, 5);
          const barH = d.value > 0 ? Math.max(minStub, (d.value / max) * (height - notch - 2)) : minStub;
          const nodes: React.ReactNode[] = [];
          // mint focus column
          nodes.push(
            <Rect
              key="v"
              x={x}
              y={height - barH - (d.flag ? notch + 2 : 0)}
              width={bw}
              height={barH}
              rx={r}
              fill={d.value > 0 ? `url(#${g}-good)` : palette.textQuaternary}
              opacity={d.value > 0 ? 1 : 0.5}
            />,
          );
          // coral slip marker pinned to the baseline
          if (d.flag) {
            nodes.push(
              <Rect key="f" x={x} y={height - notch} width={bw} height={notch} rx={r} fill={`url(#${g}-bad)`} />,
            );
          }
          return <G key={i}>{nodes}</G>;
        })}
      </Svg>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
 * DONUT — segmented usage ring
 * ───────────────────────────────────────────────────────────── */

export function Donut({
  segments,
  size = 132,
  thickness = 16,
  children,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
}) {
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const total = Math.max(1, segments.reduce((s, x) => s + x.value, 0));
  let acc = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={r} stroke={palette.hairline} strokeWidth={thickness} fill="none" />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = Math.max(0, circ * frac - 3);
          const offset = -circ * acc;
          acc += frac;
          if (dash <= 0) return null;
          return (
            <Circle
              key={i}
              cx={c}
              cy={c}
              r={r}
              stroke={s.color}
              strokeWidth={thickness}
              fill="none"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${c} ${c})`}
            />
          );
        })}
      </Svg>
      {children}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
 * SPARKLINE — inline metric trend
 * ───────────────────────────────────────────────────────────── */

export function Sparkline({
  values,
  width,
  height = 40,
  color = palette.accent,
  fill = true,
}: {
  values: number[];
  width: number;
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  const g = useGid('spark');
  const n = Math.max(1, values.length - 1);
  const max = Math.max(1, ...values);
  const min = Math.min(...values, 0);
  const span = Math.max(1, max - min);
  const pad = 3;
  const pts = values.map((v, i) => {
    const x = (i / n) * width;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return { x, y };
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const last = pts[pts.length - 1];
  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id={`${g}-f`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.24} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      {fill && <Path d={area} fill={`url(#${g}-f)`} />}
      <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {last && <Circle cx={last.x} cy={last.y} r={3} fill={color} />}
    </Svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * SEGMENT BAR — discrete level (Low / Med / High)
 * ───────────────────────────────────────────────────────────── */

export function SegmentBar({
  level,
  segments = 3,
  color = palette.accent,
  style,
}: {
  /** How many segments are lit, 0..segments. */
  level: number;
  segments?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segRow, style]}>
      {Array.from({ length: segments }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.segCell,
            { backgroundColor: i < level ? color : palette.surfaceHigh },
            i === 0 && { borderTopLeftRadius: 999, borderBottomLeftRadius: 999 },
            i === segments - 1 && { borderTopRightRadius: 999, borderBottomRightRadius: 999 },
          ]}
        />
      ))}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
 * GRADIENT METER — horizontal fill for a 0..1 value
 * ───────────────────────────────────────────────────────────── */

export function GradientMeter({
  progress,
  colors = ['#8FA9FF', palette.accent] as const,
  height = 8,
  style,
}: {
  progress: number;
  colors?: readonly [string, string];
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const p = Math.max(0.04, Math.min(1, progress));
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: palette.surfaceHigh, overflow: 'hidden' }, style]}>
      <View style={{ width: `${p * 100}%`, height: '100%' }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
 * DOT PROGRESS — pips counting toward a target
 * ───────────────────────────────────────────────────────────── */

export function DotProgress({
  filled,
  total,
  color = palette.accent,
  style,
}: {
  filled: number;
  total: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = Math.max(1, Math.min(28, total));
  return (
    <View style={[styles.dotRow, style]}>
      {Array.from({ length: t }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, { backgroundColor: i < filled ? color : palette.surfaceHigh }]}
        />
      ))}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
 * REWARD TIMELINE — medallion tile + laurel, and the ↓ connector
 * ───────────────────────────────────────────────────────────── */

function Laurel({ size, color, opacity }: { size: number; color: string; opacity: number }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
      <G opacity={opacity}>
        {/* two symmetric wreath arcs */}
        <Path d="M30 78 C14 64 14 40 26 24" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d="M70 78 C86 64 86 40 74 24" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        {[26, 38, 50, 62].map((y, i) => (
          <G key={i}>
            <Ellipse cx={22 - i} cy={y} rx={5} ry={2.6} fill={color} transform={`rotate(${-40 + i * 6} ${22 - i} ${y})`} />
            <Ellipse cx={78 + i} cy={y} rx={5} ry={2.6} fill={color} transform={`rotate(${40 - i * 6} ${78 + i} ${y})`} />
          </G>
        ))}
        <Circle cx={c} cy={20} r={2.4} fill={color} />
      </G>
    </Svg>
  );
}

export function TierThumb({
  def,
  earned,
  size = 92,
}: {
  def: AchievementDef;
  earned: boolean;
  size?: number;
}) {
  return (
    <View style={[styles.thumb, { width: size, height: size, borderRadius: 20 }]}>
      {earned ? (
        <>
          <LinearGradient
            colors={['#8BEFBC', '#5FE0D6', '#8FA9FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Laurel size={size} color="#04140c" opacity={0.16} />
          <Medal medal={def.medal} size={size * 0.62} id={`tier-${def.id}`} />
        </>
      ) : (
        <>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.surfaceHigh }]} />
          <Laurel size={size} color={palette.text} opacity={0.05} />
          <Medal medal={def.medal} size={size * 0.6} locked id={`tier-${def.id}`} />
        </>
      )}
    </View>
  );
}

export function TierConnector() {
  return (
    <View style={styles.connector}>
      <Svg width={16} height={26} viewBox="0 0 16 26">
        <Line x1="8" y1="0" x2="8" y2="20" stroke={palette.border} strokeWidth={1.5} />
        <Path d="M3 16 L8 22 L13 16" stroke={palette.textTertiary} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
 * APP GLYPH — a coloured tile with the app's initial, for usage lists
 * (UsageStatsManager gives us no icon bitmap, only a package name).
 * ───────────────────────────────────────────────────────────── */

const APP_COLORS = ['#F0604A', '#8FA9FF', palette.accent, '#E9AE62', '#C79BFF', '#5FE0D6'];

export function appColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return APP_COLORS[h % APP_COLORS.length];
}

export function AppGlyphTile({
  label,
  color,
  size = 44,
  icon,
}: {
  label: string;
  color: string;
  size?: number;
  icon?: IconName;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon ? (
        <Icon name={icon} size={size * 0.5} color="#04140c" strokeWidth={2} />
      ) : (
        <View style={{ width: size * 0.5, height: size * 0.5, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24">
            {/* letterform drawn as vector so we never depend on a font glyph */}
            <Circle cx="12" cy="12" r="11" fill="#04140c" opacity={0.16} />
          </Svg>
          <LetterMark char={label.charAt(0).toUpperCase() || '?'} size={size * 0.42} />
        </View>
      )}
    </View>
  );
}

/** A single initial, rendered as bold text on the tile. Text here is a
 *  typographic mark (an initial), not an emoji or pictograph. */
function LetterMark({ char, size }: { char: string; size: number }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <TileChar char={char} size={size} />
      </View>
    </View>
  );
}

function TileChar({ char, size }: { char: string; size: number }) {
  return <Text style={{ color: '#04140c', fontSize: size, fontWeight: '800' }}>{char}</Text>;
}

const styles = StyleSheet.create({
  segRow: { flexDirection: 'row', gap: 4, height: 8 },
  segCell: { flex: 1 },
  dotRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  dot: { width: 9, height: 9, borderRadius: 5 },
  thumb: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  connector: { alignItems: 'center', height: 26, marginVertical: 2 },
});
