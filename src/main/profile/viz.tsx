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
  Text as SvgText,
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
 * INTENSITY BARS — two-tone stacked columns with capsule tracks
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
  const gap = n > 24 ? 2.5 : n > 14 ? 3.5 : 6;
  const bw = Math.max(4, (width - gap * (n - 1)) / n);
  const max = Math.max(1, ...data.map((d) => d.value));
  const minStub = 5; // empty days show a neat stub in the track
  const notch = 7; // fixed coral marker height for a slip day
  const cornerR = Math.min(bw / 2, 4);

  return (
    <View style={style}>
      <Svg width={width} height={height}>
        <Defs>
          {/* Main Focus gradient — vibrant lime to mint */}
          <SvgGradient id={`${g}-good`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#C9FFA0" />
            <Stop offset="25%" stopColor="#7CF5B0" />
            <Stop offset="80%" stopColor="#43C588" />
            <Stop offset="100%" stopColor="#258E5E" />
          </SvgGradient>
          {/* Slip / Hard Unlock warning gradient */}
          <SvgGradient id={`${g}-bad`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FF7A59" />
            <Stop offset="100%" stopColor="#DC2626" />
          </SvgGradient>
          {/* Frosted track background */}
          <SvgGradient id={`${g}-track`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </SvgGradient>
        </Defs>

        {/* Baseline guide line */}
        <Line
          x1={0}
          y1={height - 1}
          x2={width}
          y2={height - 1}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={1}
        />

        {data.map((d, i) => {
          const x = i * (bw + gap);
          const barMaxH = height - notch - 4;
          const barH = d.value > 0 ? Math.max(minStub, (d.value / max) * barMaxH) : minStub;
          const barY = height - barH - (d.flag ? notch + 3 : 0);

          return (
            <G key={i}>
              {/* Capsule background track channel */}
              <Rect
                x={x}
                y={0}
                width={bw}
                height={height - 2}
                rx={cornerR}
                fill={`url(#${g}-track)`}
              />

              {/* Focus Bar */}
              <Rect
                x={x}
                y={barY}
                width={bw}
                height={barH}
                rx={cornerR}
                fill={d.value > 0 ? `url(#${g}-good)` : 'rgba(255,255,255,0.08)'}
              />

              {/* Specular highlight cap on top of active bars */}
              {d.value > 0 && barH > 8 && (
                <Rect
                  x={x + 1}
                  y={barY + 1}
                  width={Math.max(1, bw - 2)}
                  height={2.5}
                  rx={1}
                  fill="#FFFFFF"
                  opacity={0.4}
                />
              )}

              {/* Coral slip marker pinned to baseline */}
              {d.flag && (
                <Rect
                  x={x}
                  y={height - notch - 1}
                  width={bw}
                  height={notch}
                  rx={Math.min(cornerR, 2.5)}
                  fill={`url(#${g}-bad)`}
                />
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
 * CALENDAR HEATMAP — 10-week squircle focus grid
 * ───────────────────────────────────────────────────────────── */

export function CalendarHeatmap({
  data,
  width,
  gap = 4.5,
  style,
}: {
  /** Oldest first, aligned so index 0 is the top-left cell. */
  data: { value: number; flag?: boolean; date?: string; today?: boolean }[];
  width: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const g = useGid('heat');
  const weeks = Math.max(1, Math.ceil(data.length / 7));
  const GUTTER = 22; // weekday initials
  const HEAD = 18; // month markers
  const cell = Math.max(9, (width - GUTTER - gap * (weeks - 1)) / weeks);
  const h = HEAD + 7 * (cell + gap) - gap;
  const max = Math.max(1, ...data.map((d) => d.value));
  const r = Math.min(5, cell * 0.3);

  // A month label sits above the first column that contains that month.
  const months: { x: number; label: string }[] = [];
  let lastMonth = '';
  for (let w = 0; w < weeks; w++) {
    const d = data[w * 7];
    if (!d?.date) continue;
    const m = d.date.slice(0, 7);
    if (m !== lastMonth) {
      lastMonth = m;
      const name = new Date(`${d.date}T00:00:00`).toLocaleString('en', { month: 'short' });
      months.push({ x: GUTTER + w * (cell + gap), label: name });
    }
  }

  const dayInitials = ['M', '', 'W', '', 'F', '', 'S'];

  return (
    <View style={style}>
      <Svg width={width} height={h}>
        <Defs>
          <SvgGradient id={`${g}-glow`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#C9FFA0" />
            <Stop offset="100%" stopColor="#6FE3A9" />
          </SvgGradient>
        </Defs>

        {months.map((m, i) => (
          <SvgText
            key={`m${i}`}
            x={m.x}
            y={HEAD - 6}
            fill="rgba(255,255,255,0.45)"
            fontSize={10}
            fontWeight="700"
            letterSpacing={0.5}
          >
            {m.label}
          </SvgText>
        ))}

        {dayInitials.map((t, row) =>
          t ? (
            <SvgText
              key={`d${row}`}
              x={2}
              y={HEAD + row * (cell + gap) + cell / 2 + 3.5}
              fill="rgba(255,255,255,0.35)"
              fontSize={9.5}
              fontWeight="700"
            >
              {t}
            </SvgText>
          ) : null,
        )}

        {data.map((d, i) => {
          const w = Math.floor(i / 7);
          const row = i % 7;
          const x = GUTTER + w * (cell + gap);
          const y = HEAD + row * (cell + gap);
          const t = d.value / max;

          // 4-stop emerald intensity
          let fillColor = 'rgba(255,255,255,0.05)';
          let opacity = 1;
          if (d.flag) {
            fillColor = '#F0604A';
            opacity = 0.92;
          } else if (d.value > 0) {
            fillColor = palette.accent;
            opacity = t > 0.75 ? 1 : t > 0.4 ? 0.68 : t > 0.15 ? 0.42 : 0.22;
          }

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={cell}
                height={cell}
                rx={r}
                fill={fillColor}
                fillOpacity={opacity}
              />

              {/* Peak focus shimmer cap for 80%+ days */}
              {d.value > 0 && t > 0.75 && !d.flag && (
                <Rect
                  x={x + 1}
                  y={y + 1}
                  width={cell - 2}
                  height={1.5}
                  rx={0.75}
                  fill="#FFFFFF"
                  fillOpacity={0.35}
                />
              )}

              {/* Slips carry a warning notch pip */}
              {d.flag && cell >= 11 && (
                <Rect
                  x={x + cell / 2 - cell * 0.18}
                  y={y + cell / 2 - 1}
                  width={cell * 0.36}
                  height={2}
                  rx={1}
                  fill="#000000"
                  fillOpacity={0.65}
                />
              )}

              {/* Today halo outline */}
              {d.today && (
                <Rect
                  x={x - 1.5}
                  y={y - 1.5}
                  width={cell + 3}
                  height={cell + 3}
                  rx={r + 1.5}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={1.6}
                  strokeOpacity={0.9}
                />
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
 * DONUT — modern Apple Activity / Opal segmented usage ring
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
        {/* Background track */}
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke="rgba(255, 255, 255, 0.07)"
          strokeWidth={thickness}
          fill="none"
        />

        {segments.map((s, i) => {
          const frac = s.value / total;
          const gapSize = segments.length > 1 ? 4 : 0;
          const dash = Math.max(0, circ * frac - gapSize);
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
 * SPARKLINE — smooth cubic Bézier spline with gradient area fill
 * ───────────────────────────────────────────────────────────── */

/** Helper to generate a smooth cubic Bézier path through points */
function buildSplinePath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  if (pts.length === 2) {
    return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;
  }

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2];

    const cp1x = p1.x + (p2.x - p0.x) / 5.5;
    const cp1y = p1.y + (p2.y - p0.y) / 5.5;
    const cp2x = p2.x - (p3.x - p1.x) / 5.5;
    const cp2y = p2.y - (p3.y - p1.y) / 5.5;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

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
  const safeVals = values.length >= 2 ? values : values.length === 1 ? [values[0], values[0]] : [0, 0];
  const n = safeVals.length - 1;
  const max = Math.max(1, ...safeVals);
  const min = Math.min(...safeVals, 0);
  const span = Math.max(1, max - min);
  const pad = 4;

  const pts = safeVals.map((v, i) => {
    const x = (i / n) * width;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return { x, y };
  });

  const spline = buildSplinePath(pts);
  const area = `${spline} L ${width.toFixed(1)} ${height} L 0 ${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id={`${g}-f`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <Stop offset="70%" stopColor={color} stopOpacity={0.06} />
          <Stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </SvgGradient>
      </Defs>

      {/* Gradient area fill */}
      {fill && <Path d={area} fill={`url(#${g}-f)`} />}

      {/* Smooth curve line */}
      <Path
        d={spline}
        stroke={color}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Glowing terminal node */}
      {last && (
        <G>
          {/* Outer glow aura */}
          <Circle cx={last.x} cy={last.y} r={5} fill={color} fillOpacity={0.3} />
          {/* Inner bright node */}
          <Circle cx={last.x} cy={last.y} r={2.5} fill="#FFFFFF" />
          <Circle cx={last.x} cy={last.y} r={2} fill={color} />
        </G>
      )}
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
 * ACTIVITY RINGS — Concentric Apple Fitness style focus rings
 * ───────────────────────────────────────────────────────────── */

export function ActivityRings({
  rings,
  size = 120,
  strokeWidth = 10,
  gap = 4,
}: {
  rings: {
    progress: number; // 0..1+
    color: string;
    bg?: string;
  }[];
  size?: number;
  strokeWidth?: number;
  gap?: number;
}) {
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {rings.map((ring, i) => {
          const r = center - strokeWidth / 2 - i * (strokeWidth + gap);
          if (r <= 0) return null;
          const circ = 2 * Math.PI * r;
          const p = Math.max(0, Math.min(1.5, ring.progress));
          const dash = Math.min(circ, circ * p);
          const bgStroke = ring.bg || 'rgba(255, 255, 255, 0.08)';

          return (
            <G key={i}>
              {/* Track */}
              <Circle
                cx={center}
                cy={center}
                r={r}
                stroke={bgStroke}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress Arc */}
              {dash > 0 && (
                <Circle
                  cx={center}
                  cy={center}
                  r={r}
                  stroke={ring.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${dash} ${circ}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${center} ${center})`}
                />
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
 * MINI BAR TREND — 7-bar micro sparkbar for cards
 * ───────────────────────────────────────────────────────────── */

export function MiniBarTrend({
  values,
  width = 72,
  height = 24,
  color = palette.accent,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const g = useGid('minibar');
  const safeVals = values.length ? values : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(1, ...safeVals);
  const gap = 2;
  const n = safeVals.length;
  const bw = Math.max(2, (width - gap * (n - 1)) / n);

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id={`${g}-c`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#C9FFA0" />
          <Stop offset="100%" stopColor={color} />
        </SvgGradient>
      </Defs>
      {safeVals.map((v, i) => {
        const x = i * (bw + gap);
        const bh = v > 0 ? Math.max(3, (v / max) * height) : 3;
        const by = height - bh;
        return (
          <Rect
            key={i}
            x={x}
            y={by}
            width={bw}
            height={bh}
            rx={bw / 2}
            fill={v > 0 ? `url(#${g}-c)` : 'rgba(255,255,255,0.1)'}
          />
        );
      })}
    </Svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * REWARD TIMELINE — medallion tile + laurel, and the ↓ connector
 * ───────────────────────────────────────────────────────────── */

export function TierThumb({
  def,
  earned,
  size = 92,
}: {
  def: AchievementDef;
  earned: boolean;
  size?: number;
}) {
  // No plate, no laurel, no gradient. The artwork carries its own shape, rim
  // and gloss — wrapping it in a coloured box put a second silhouette behind
  // the first and shrank the badge to 62% of the space it was given.
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Medal def={def} size={size} locked={!earned} id={`tier-${def.id}`} />
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
  connector: { alignItems: 'center', height: 26, marginVertical: 2 },
});
