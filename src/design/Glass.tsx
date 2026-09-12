import React from 'react';
import { Platform, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { palette, radius } from './tokens';

/**
 * One glass surface, three tiers, best-available wins — the same
 * degrade-safely shape the activity detector uses.
 *
 *   1. iOS 26+  → real Liquid Glass (`GlassView`). Refracts and reacts to
 *                 what scrolls beneath it; this is the only tier that is
 *                 actually "liquid".
 *   2. Older iOS / Android → `BlurView`, a static frosted blur. Looks close
 *                 enough at a glance and costs nothing extra.
 *   3. Anywhere blur is unavailable or would cost too much (Android below
 *                 API 31 renders BlurView as a flat overlay anyway) → the
 *                 app's normal translucent surface.
 *
 * `isLiquidGlassAvailable()` is checked once at module scope, not per render:
 * it is a static capability of the OS, and calling it inside a list row's
 * render is a native bridge hop per item.
 *
 * IMPORTANT: glass is only glass if something is moving behind it. Use this
 * for surfaces that float *over* the gradient ground or over scrolling
 * content — tab bars, sheet headers, floating CTAs. On a flat black area it
 * renders as a dull grey box and is strictly worse than a plain surface.
 */
const LIQUID = Platform.OS === 'ios' && isLiquidGlassAvailable();

export type GlassProps = ViewProps & {
  /** 'regular' frosts more; 'clear' is nearly transparent with just an edge. */
  tone?: 'regular' | 'clear';
  /** Corner radius. Glass needs its own radius — the native view clips itself. */
  cornerRadius?: number;
  /** Reacts to touch with a liquid highlight. iOS 26 only, ignored elsewhere. */
  interactive?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export default function Glass({
  tone = 'regular',
  cornerRadius = radius.xl,
  interactive = false,
  style,
  children,
  ...rest
}: GlassProps) {
  const shape: ViewStyle = { borderRadius: cornerRadius, overflow: 'hidden' };

  if (LIQUID) {
    return (
      <GlassView
        glassEffectStyle={tone}
        isInteractive={interactive}
        colorScheme="dark"
        style={[shape, style]}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }

  // Platform.Version is string|number in RN's types (iOS reports '26.0').
  // Android is the only branch where the number matters.
  const androidApi = Platform.OS === 'android' ? Number(Platform.Version) : 0;
  if (Platform.OS === 'ios' || androidApi >= 31) {
    return (
      <View style={[shape, style]} {...rest}>
        <BlurView
          intensity={tone === 'clear' ? 22 : 48}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.edge} pointerEvents="none" />
        {children}
      </View>
    );
  }

  return (
    <View style={[shape, styles.fallback, style]} {...rest}>
      {children}
    </View>
  );
}

/** True when the current device renders tier 1. Lets a screen lean harder on
 *  the effect (thinner borders, less fill) only where it will actually land. */
export const liquidGlassAvailable = LIQUID;

const styles = StyleSheet.create({
  // Glass without a lit edge reads as a smudge. The hairline is what makes it
  // look like a physical pane rather than a blur filter.
  edge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 0,
  },
  fallback: {
    backgroundColor: palette.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
});
