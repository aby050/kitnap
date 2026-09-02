import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '../design/tokens';

/**
 * Per-permission artwork for the boarding-pass ask.
 *
 * Each permission gets a drawn scene rather than a generic line icon in a
 * plate: the ask is the only thing on the screen, so a 52px glyph read as an
 * afterthought. Everything is SVG plus a couple of Reanimated loops — no
 * raster assets to ship at three densities, and it stays sharp at any size.
 *
 * The scenes share a frame (a soft mint ground, a 200pt stage) so stepping
 * between cards feels like one object changing rather than three unrelated
 * illustrations.
 */

const SIZE = 200;
const MINT = palette.accent;

type Props = { permission: string; size?: number };

export default function PermissionArt({ permission, size = SIZE }: Props) {
  const scale = size / SIZE;

  return (
    <View style={[styles.stage, { width: size, height: size }]}>
      <Glow size={size} />
      <View style={{ width: SIZE, height: SIZE, transform: [{ scale }] }}>
        <Scene permission={permission} />
      </View>
    </View>
  );
}

function Scene({ permission }: { permission: string }) {
  switch (permission) {
    case 'screenTime':
    case 'usage':
      return <ScreenTimeArt />;
    case 'notification':
      return <NotificationArt />;
    case 'camera':
      return <CameraArt />;
    case 'overlay':
      return <ShieldArt />;
    case 'battery':
      return <BatteryArt />;
    default:
      return <ShieldArt />;
  }
}

/* ── shared pieces ───────────────────────────────────────────── */

/** Soft mint ground so the drawing sits on the screen rather than floating. */
function Glow({ size }: { size: number }) {
  const breath = useBreath(3200);
  const style = useAnimatedStyle(() => ({
    opacity: 0.1 + breath.value * 0.06,
    transform: [{ scale: 0.94 + breath.value * 0.06 }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="ground" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={MINT} stopOpacity={1} />
            <Stop offset="1" stopColor={MINT} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#ground)" />
      </Svg>
    </Animated.View>
  );
}

/** 0 → 1 → 0, forever. The one loop every scene here is built out of. */
function useBreath(duration: number, delay = 0) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [v, duration, delay]);
  return v;
}

/** 0 → 1, restarting. For sweeps and ripples that shouldn't play backwards. */
function useSweep(duration: number, delay = 0) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [v, duration, delay]);
  return v;
}

/* ── Screen Time / usage access ──────────────────────────────── */

/**
 * A phone whose screen is a stack of usage bars, with a dial around it that
 * fills — the permission is "let us read the numbers", so the drawing is the
 * numbers arriving.
 */
function ScreenTimeArt() {
  const fill = useBreath(2600);
  const bars = [0.42, 0.66, 0.9, 0.58, 0.74];

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(fill.value, [0, 1], [-14, 14])}deg` }],
  }));

  return (
    <View style={styles.scene}>
      <Animated.View style={[StyleSheet.absoluteFill, ringStyle]}>
        <Svg width={SIZE} height={SIZE}>
          {/* Open dial: a ring with a gap, so it reads as a gauge not a plate. */}
          <Circle
            cx={100}
            cy={100}
            r={84}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={2}
            fill="none"
            strokeDasharray="6 10"
          />
          <Path
            d="M 100 20 A 80 80 0 0 1 176 78"
            stroke={MINT}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>

      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Rect x={66} y={40} width={68} height={120} rx={16} fill="#101014" stroke="rgba(255,255,255,0.16)" strokeWidth={2} />
        <Rect x={88} y={48} width={24} height={4} rx={2} fill="rgba(255,255,255,0.22)" />
        {bars.map((h, i) => (
          <Rect
            key={i}
            x={78 + i * 10}
            y={140 - 62 * h}
            width={6}
            height={62 * h}
            rx={3}
            fill={i === 2 ? MINT : 'rgba(111,227,169,0.34)'}
          />
        ))}
        <Line x1={74} y1={142} x2={126} y2={142} stroke="rgba(255,255,255,0.18)" strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/* ── Notifications ───────────────────────────────────────────── */

/** A bell with ripples leaving it, and one small card sliding in behind. */
function NotificationArt() {
  const swing = useBreath(1800);
  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(swing.value, [0, 1], [-9, 9])}deg` }],
  }));

  return (
    <View style={styles.scene}>
      <Ripple delay={0} />
      <Ripple delay={900} />

      <Animated.View style={[styles.centerLayer, bellStyle]}>
        <Svg width={112} height={112} viewBox="0 0 24 24">
          <Path
            d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
            fill="rgba(111,227,169,0.16)"
            stroke={MINT}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          <Path d="M13.7 21a2 2 0 0 1-3.4 0" stroke={MINT} strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>

      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Rect x={40} y={148} width={120} height={30} rx={10} fill="#131317" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
        <Circle cx={58} cy={163} r={7} fill={MINT} />
        <Rect x={72} y={157} width={54} height={4} rx={2} fill="rgba(255,255,255,0.34)" />
        <Rect x={72} y={166} width={34} height={4} rx={2} fill="rgba(255,255,255,0.16)" />
      </Svg>
    </View>
  );
}

function Ripple({ delay }: { delay: number }) {
  const t = useSweep(1800, delay);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.15, 1], [0, 0.5, 0]),
    transform: [{ scale: interpolate(t.value, [0, 1], [0.5, 1.25]) }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.ripple, style]}>
      <Svg width={140} height={140}>
        <Circle cx={70} cy={70} r={68} stroke={MINT} strokeWidth={2} fill="none" />
      </Svg>
    </Animated.View>
  );
}

/* ── Camera ──────────────────────────────────────────────────── */

/** A lens whose aperture ring turns, with a figure mid-stretch inside it. */
function CameraArt() {
  const turn = useSweep(9000);
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.value * 360}deg` }],
  }));
  const pulse = useBreath(2200);
  const irisStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.94 + pulse.value * 0.08 }] }));

  return (
    <View style={styles.scene}>
      <Animated.View style={[StyleSheet.absoluteFill, ringStyle]}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={100}
            cy={100}
            r={78}
            stroke="rgba(111,227,169,0.34)"
            strokeWidth={3}
            fill="none"
            strokeDasharray="30 22"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.centerLayer, irisStyle]}>
        <Svg width={132} height={132} viewBox="0 0 132 132">
          <Circle cx={66} cy={66} r={54} fill="#101014" stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
          <Circle cx={66} cy={66} r={38} stroke={MINT} strokeWidth={2} fill="rgba(111,227,169,0.08)" />
          {/* A person mid-move: the only thing the camera is ever used for. */}
          <Circle cx={66} cy={48} r={7} fill={MINT} />
          <Path
            d="M66 57 v20 M66 63 l-13 -8 M66 63 l13 -8 M66 77 l-11 16 M66 77 l11 16"
            stroke={MINT}
            strokeWidth={3.4}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={96} cy={40} r={4} fill="rgba(255,255,255,0.5)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* ── Android-only scenes ─────────────────────────────────────── */

function ShieldArt() {
  const pulse = useBreath(2600);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 0.96 + pulse.value * 0.05 }] }));
  return (
    <View style={styles.scene}>
      <Ripple delay={0} />
      <Animated.View style={[styles.centerLayer, style]}>
        <Svg width={124} height={124} viewBox="0 0 24 24">
          <Path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            fill="rgba(111,227,169,0.14)"
            stroke={MINT}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <Path d="M8.5 12.2l2.6 2.6 4.6-5" stroke={MINT} strokeWidth={1.8} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function BatteryArt() {
  const fill = useBreath(2400);
  const style = useAnimatedStyle(() => ({ opacity: 0.5 + fill.value * 0.5 }));
  return (
    <View style={styles.scene}>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Rect x={48} y={76} width={92} height={48} rx={14} fill="#101014" stroke="rgba(255,255,255,0.16)" strokeWidth={2} />
        <Rect x={144} y={92} width={8} height={16} rx={3} fill="rgba(255,255,255,0.28)" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, style]}>
        <Svg width={SIZE} height={SIZE}>
          <Rect x={56} y={84} width={64} height={32} rx={8} fill={MINT} opacity={0.85} />
          <Path d="M96 82 l-14 20 h10 l-6 16 18 -22 h-10 z" fill="#0B0B0D" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center' },
  scene: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  centerLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
