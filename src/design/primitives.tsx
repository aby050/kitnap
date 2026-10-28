import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon, { IconName } from '../ui/Icon';
import AnimatedIcon from '../ui/AnimatedIcon';
import { tapLight } from '../ui/haptics';
import {
  control,
  fieldStyle,
  fonts,
  gradients,
  motion,
  palette,
  radius,
  space,
  type,
} from './tokens';

/**
 * Kitnap's primitives. Every screen is assembled from these — no screen defines
 * its own button, card, row or header.
 *
 * The reason is not tidiness, it's that the app previously had four different
 * buttons and five different card recipes, which is why adjacent tabs read as
 * different products. A primitive is the contract; a screen only chooses.
 */

/* ─────────────────────────────────────────────────────────────
 * PRESS FEEDBACK
 * One shared gesture feel: a fast dip on press-in, a spring back out. Applied
 * to everything tappable so the whole app responds with one hand.
 *
 * Scale alone is not enough feedback at these amounts (a Row moves 1.5%, which
 * is almost invisible on a phone), so the same clock also drives an `overlay`
 * opacity. A control opts into it by rendering `press.overlay` as an absolute
 * fill; scale and highlight then arrive and leave together instead of being two
 * separately tuned effects.
 * ───────────────────────────────────────────────────────────── */

function usePress(scale: number = motion.pressScale) {
  /** 0 at rest, 1 fully pressed — one value so everything stays in phase. */
  const s = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - s.value * (1 - scale) }],
  }));
  const overlay = useAnimatedStyle(() => ({ opacity: Math.max(0, s.value) }));
  return {
    style,
    overlay,
    /** The raw 0→1, for controls that want to ride the same press with a
     *  second gesture of their own (see `SectionHeader`'s chevron). */
    progress: s,
    onPressIn: () => {
      s.value = withTiming(1, { duration: motion.instant });
    },
    // Under-damped on the way out, so a control settles a hair past its resting
    // size. That tiny overshoot is what makes a press feel released rather than
    // merely ended — and `Math.max(0, …)` above keeps the highlight from
    // flickering back on when the spring dips below zero.
    onPressOut: () => {
      s.value = withSpring(0, motion.spring);
    },
  };
}

/* ─────────────────────────────────────────────────────────────
 * LIGHT
 * ───────────────────────────────────────────────────────────── */

/**
 * A soft radial bloom. This is how the app gets a light source instead of a
 * flat black void — placed behind a hero figure, the Shield's line, or bleeding
 * off the top of a screen.
 *
 * Deliberately SVG rather than a shadow: `shadowColor` is ignored on Android,
 * so a glow built from shadows would exist on iOS only.
 */
export function GlowField({
  size = 440,
  color = palette.accent,
  intensity = 0.2,
  style,
}: {
  size?: number;
  color?: string;
  /** Opacity at the centre. Above ~0.3 it stops reading as light and starts
   *  reading as a coloured circle. */
  intensity?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const id = React.useId();
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={intensity} />
            <Stop offset="45%" stopColor={color} stopOpacity={intensity * 0.3} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/**
 * The ground every screen sits on: near-black with the faintest azure lift at
 * the top. `bloom` adds a centred glow behind the content for hero screens
 * (Shield, running timer); leave it off for list screens.
 */
export function Screen({
  children,
  edges = ['top'],
  bloom = false,
  style,
}: {
  children: React.ReactNode;
  edges?: readonly Edge[];
  bloom?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={styles.screenRoot}>
      <LinearGradient
        colors={[...gradients.ground]}
        locations={[...gradients.groundLocations]}
        style={StyleSheet.absoluteFill}
      />
      {bloom && <GlowField size={520} style={styles.screenBloom} intensity={0.16} />}
      <SafeAreaView style={[styles.screenSafe, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
 * SURFACES
 * ───────────────────────────────────────────────────────────── */

/**
 * The one card. `tone` tints the fill and border for the three semantic hues
 * so a card can carry meaning without a screen hand-rolling colours.
 */
export function Card({
  children,
  tone = 'neutral',
  raised = false,
  padded = true,
  style,
  onPress,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'warn' | 'danger' | 'savings';
  /** Lifts the fill a step — use when a card sits *inside* another card. */
  raised?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const tones: Record<string, ViewStyle> = {
    neutral: {
      backgroundColor: raised ? palette.surfaceHigh : palette.surfaceRaised,
      borderColor: palette.border,
    },
    accent: { backgroundColor: palette.accentSoft, borderColor: palette.accentBorder },
    warn: { backgroundColor: palette.warnSoft, borderColor: palette.warnBorder },
    danger: { backgroundColor: palette.dangerSoft, borderColor: palette.dangerBorder },
  };

  const press = usePress(0.99);
  const body = (
    <View style={[styles.card, tones[tone], padded && styles.cardPadded, style]}>{children}</View>
  );

  if (!onPress) return body;
  return (
    <Animated.View style={press.style}>
      <Pressable onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
        {body}
      </Pressable>
    </Animated.View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={[styles.divider, { marginLeft: inset }]} />;
}

/* ─────────────────────────────────────────────────────────────
 * ACTIONS
 * ───────────────────────────────────────────────────────────── */

export type ButtonVariant =
  | 'primary'
  | 'accent'
  /** Lavender fill, indigo label — the reference's "Redeem". Use for the
   *  second-choice action beside a white primary, never as the only button. */
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

/**
 * Variants, and when to use which:
 *   primary  white fill — the single most likely action on a screen. One only.
 *   accent   azure fill — reserved for *starting* a session; nothing else.
 *   outline  hairline pill — every other affirmative action. The workhorse.
 *   ghost    text only — dismiss, skip, "not now".
 *   danger   coral — spending a token, unblocking early, deleting.
 */
export function Button({
  label,
  onPress,
  variant = 'outline',
  size = 'lg',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  full = true,
  haptic = true,
  labelHidden = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'lg' | 'md' | 'sm';
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  haptic?: boolean;
  /** Keeps the label in the layout (so the pill keeps its size and the
   *  accessibility label still reads) but stops painting it — for a caller
   *  drawing its own treated label on top, e.g. the knocked-out CTA on Home. */
  labelHidden?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const press = usePress();
  const height = size === 'lg' ? control.lg : size === 'md' ? control.md : control.sm;
  const pad = size === 'sm' ? space.base : space.lg;
  const filled = variant === 'primary' || variant === 'accent';

  const fg =
    // The reference's white pill carries deep indigo text, never black —
    // black on white above a blue ground reads as a system alert.
    variant === 'primary'
      ? palette.onLight
      : variant === 'accent'
        ? palette.textInverse
        : variant === 'secondary'
          ? palette.onSecondary
          : variant === 'danger'
        ? palette.danger
        : variant === 'ghost'
          ? palette.textSecondary
          : palette.text;

  const shell: ViewStyle =
    variant === 'outline'
      ? { borderWidth: 1, borderColor: palette.borderStrong, backgroundColor: 'transparent' }
      : variant === 'secondary'
        ? { backgroundColor: palette.secondary }
        : variant === 'danger'
          ? { borderWidth: 1, borderColor: palette.dangerBorder, backgroundColor: palette.dangerSoft }
          : variant === 'ghost'
            ? { backgroundColor: 'transparent' }
            : {};

  const labelStyle: TextStyle = {
    ...(size === 'sm' ? type.caption : type.bodyStrong),
    color: fg,
    letterSpacing: variant === 'ghost' ? 0 : -0.2,
  };

  return (
    <Animated.View style={[press.style, full ? styles.btnFull : styles.btnCompact, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        disabled={disabled || loading}
        onPress={() => {
          if (haptic) tapLight();
          onPress();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[
          styles.btn,
          shell,
          { height, paddingHorizontal: pad },
          full && styles.btnFillWidth,
          disabled && styles.btnDisabled,
        ]}
      >
        {filled && (
          <LinearGradient
            colors={variant === 'primary' ? gradients.light : gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]}
          />
        )}
        {/* Press highlight. A filled button darkens (it has nowhere brighter to
            go); an outline or ghost one gains a faint glass fill. */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.btnOverlay,
            {
              backgroundColor:
                filled || variant === 'secondary' ? 'rgba(255,255,255,0.16)' : palette.glass,
            },
            press.overlay,
          ]}
          pointerEvents="none"
        />
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : (
          <>
            {icon && <Icon name={icon} size={size === 'sm' ? 15 : 18} color={fg} />}
            <Text
              style={[labelStyle, styles.btnLabel, labelHidden && { opacity: 0 }]}
              numberOfLines={1}
              // Poppins sets ~8% wider than San Francisco, so labels that fit
              // before now truncate ("Start focus lo…"). Shrink to fit rather
              // than losing the end of the sentence.
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {label}
            </Text>
            {iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 18} color={fg} />}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

/** Single-line pill input. Matches a large Button so a field + Continue stack lines up. */
export function Field({ style, ...rest }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={palette.textTertiary}
      {...rest}
      style={[styles.field, style]}
    />
  );
}

/** Square tappable icon — nav back, close, overflow. Never carries a label. */
export function IconButton({
  name,
  glyph,
  onPress,
  size = 20,
  color = palette.text,
  bordered = false,
  accessibilityLabel,
  style,
}: {
  /** Omit when passing `glyph`. */
  name?: IconName;
  /** A custom mark to draw instead of an icon-set glyph — for the few marks
   *  the app owns (the Bailout coin) that must not degrade to a generic key
   *  just because they sit in a round button. */
  glyph?: React.ReactNode;
  onPress: () => void;
  size?: number;
  color?: string;
  /** A hairline circle around it — for controls floating over content. */
  bordered?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  const press = usePress(0.92);
  return (
    <Animated.View style={[press.style, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={10}
        onPress={() => {
          tapLight();
          onPress();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[styles.iconBtn, bordered && styles.iconBtnBordered]}
      >
        {glyph ?? (name ? <Icon name={name} size={size} color={color} /> : null)}
      </Pressable>
    </Animated.View>
  );
}

/** Small non-interactive tag, or a selectable chip when `onPress` is given. */
export function Pill({
  label,
  icon,
  tone = 'neutral',
  selected,
  onPress,
  style,
}: {
  label: string;
  icon?: IconName;
  tone?: 'neutral' | 'accent' | 'warn' | 'danger' | 'savings';
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  // 'savings' is the only solid-filled pill: it is a promotional chip, not a
  // state, so it reads as a sticker on top of the card rather than a tinted
  // label inside it — the same job the amber "Save 40%" chip does in the
  // reference.
  const restFg =
    tone === 'savings'
      ? palette.onSavings
      : tone === 'accent'
        ? palette.accent
        : tone === 'warn'
          ? palette.warn
          : tone === 'danger'
            ? palette.danger
            : palette.textSecondary;
  // Only a neutral pill brightens on selection; a toned one already carries its
  // meaning in the colour, so selection is shown by the border instead.
  const fg = tone === 'neutral' && selected ? palette.text : restFg;
  const bd =
    tone === 'savings'
      ? palette.savings
      : tone === 'accent'
        ? palette.accentBorder
      : tone === 'warn'
        ? palette.warnBorder
        : tone === 'danger'
          ? palette.dangerBorder
          : selected
            ? palette.borderStrong
            : palette.border;

  const press = usePress(0.94);

  const body = (
    <View
      style={[
        styles.pill,
        {
          borderColor: bd,
          backgroundColor:
            tone === 'savings'
              ? palette.savings
              : selected
                ? palette.glass
                : 'transparent',
        },
        style,
      ]}
    >
      {icon &&
        (selected === undefined ? (
          <Icon name={icon} size={13} color={fg} strokeWidth={1.9} />
        ) : (
          // Selectable: the glyph cross-fades to the selected colour and pops,
          // so a chip toggling reads as a reaction rather than a repaint.
          <AnimatedIcon
            name={icon}
            size={13}
            color={restFg}
            activeColor={fg}
            active={selected}
            pop={selected}
            strokeWidth={1.9}
          />
        ))}
      <Text
        style={[
          type.caption,
          { color: fg },
          // A promotional chip is shouted, not stated.
          tone === 'savings' && { fontFamily: fonts.bold, fontWeight: '700', letterSpacing: 0 },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) return body;
  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={() => {
          tapLight();
          onPress();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        hitSlop={6}
      >
        {body}
      </Pressable>
    </Animated.View>
  );
}

/* ─────────────────────────────────────────────────────────────
 * STRUCTURE
 * ───────────────────────────────────────────────────────────── */

/** Header for a pushed screen or full-screen overlay. ~20 overlays used to
 *  hand-roll this; they all use this now so back always sits in one place. */
export function ScreenHeader({
  title,
  onBack,
  right,
  subtitle,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {onBack && <IconButton name="chevronLeft" onPress={onBack} accessibilityLabel="Go back" />}
      </View>
      <View style={styles.headerMid}>
        {!!title && (
          <Text style={type.title3} numberOfLines={1}>
            {title}
          </Text>
        )}
        {!!subtitle && (
          <Text style={type.sub} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={[styles.headerSide, styles.headerRight]}>{right}</View>
    </View>
  );
}

/** Section label above a group. `action` is the optional trailing text link. */
export function SectionHeader({
  title,
  hint,
  actionLabel,
  onAction,
  style,
}: {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, style]}>
      <View style={styles.shrink}>
        <Text style={type.overline}>{title}</Text>
        {!!hint && <Text style={[type.sub, styles.sectionHint]}>{hint}</Text>}
      </View>
      {!!actionLabel && !!onAction && <SectionAction label={actionLabel} onPress={onAction} />}
    </View>
  );
}

/** The optional "See all" affordance on a {@link SectionHeader}. Split out so it
 *  can own the hooks a plain conditional branch can't. The chevron slides on the
 *  same press value that scales the label, so the arrow leads the tap. */
function SectionAction({ label, onPress }: { label: string; onPress: () => void }) {
  const press = usePress(0.94);
  const nudge = useAnimatedStyle(() => ({ transform: [{ translateX: press.progress.value * 3 }] }));
  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={() => {
          tapLight();
          onPress();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        hitSlop={8}
        style={styles.sectionAction}
      >
        <Text style={[type.caption, { color: palette.accent }]}>{label}</Text>
        <Animated.View style={nudge}>
          <Icon name="chevronRight" size={13} color={palette.accent} strokeWidth={2} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** List row: leading icon tile, title + subtitle, trailing value or control. */
export function Row({
  title,
  subtitle,
  icon,
  iconColor = palette.textSecondary,
  value,
  right,
  onPress,
  chevron,
  destructive = false,
  style,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const press = usePress(0.985);
  const showChevron = chevron ?? !!onPress;

  const inner = (
    <View style={[styles.row, style]}>
      {icon && (
        <View style={styles.rowIcon}>
          <Icon name={icon} size={18} color={destructive ? palette.danger : iconColor} />
        </View>
      )}
      <View style={styles.shrink}>
        <Text style={[type.body, destructive && { color: palette.danger }]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[type.sub, styles.rowSub]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {!!value && (
        <Text style={[type.callout, styles.rowValue]} numberOfLines={1}>
          {value}
        </Text>
      )}
      {right}
      {showChevron && <Icon name="chevronRight" size={17} color={palette.textQuaternary} />}
    </View>
  );

  if (!onPress) return inner;
  return (
    <Animated.View style={press.style}>
      <Pressable
        accessibilityRole="button"
        onPress={() => { tapLight(); onPress(); }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
      >
        {inner}
        {/* A row moves too little for scale alone to register as a press. */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.rowOverlay, press.overlay]}
          pointerEvents="none"
        />
      </Pressable>
    </Animated.View>
  );
}

/* ─────────────────────────────────────────────────────────────
 * DATA
 * ───────────────────────────────────────────────────────────── */

/**
 * The app's signature figure treatment: a large light numeral with a small dim
 * unit beside it, baseline-aligned. Never bake the unit into `value` — the
 * size contrast between the two is the whole effect.
 */
export function Stat({
  value,
  unit,
  label,
  color = palette.text,
  align = 'flex-start',
  compact = false,
  style,
}: {
  value: string;
  unit?: string;
  /** Eyebrow above the figure. */
  label?: string;
  color?: string;
  align?: 'flex-start' | 'center';
  /** Title-sized rather than hero-sized, for a grid of several. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ alignItems: align }, style]}>
      {!!label && <Text style={[type.overline, styles.statLabel]}>{label}</Text>}
      <View style={styles.statRow}>
        <Text style={[compact ? type.title1 : type.hero, { color }]}>{value}</Text>
        {!!unit && <Text style={[type.unit, compact && styles.statUnitCompact]}>{unit}</Text>}
      </View>
    </View>
  );
}

/**
 * The editorial pair — dim italic serif setting up an accent roman serif.
 * This is the app speaking in its own voice; use it for one line per screen,
 * never for labels or data.
 */
export function Editorial({
  lead,
  emphasis,
  align = 'left',
  color = palette.accent,
  style,
  voice = false,
  compact = false,
}: {
  lead: string;
  emphasis?: string;
  align?: 'left' | 'center';
  color?: string;
  style?: StyleProp<TextStyle>;
  /** Sets the pair in the serif italic instead of the geometric sans.
   *  For the app speaking — block screens, focus rooms — rather than the app
   *  labelling. See `type.voice`. */
  voice?: boolean;
  /** Smaller pair, for screens where the headline should not dominate. */
  compact?: boolean;
}) {
  const size = compact ? { fontSize: 22, lineHeight: 28, letterSpacing: -0.5 } : null;
  const base = [voice ? type.voice : type.editorial, size];
  const strong = [voice ? type.voiceStrong : type.editorialStrong, size];
  return (
    <Text style={[...base, { textAlign: align }, style]}>
      {lead}
      {!!emphasis && (
        <>
          {' '}
          <Text style={[...strong, { color }]}>{emphasis}</Text>
        </>
      )}
    </Text>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Circular progress. Children render centred inside — usually a Stat.
 *  Progress changes animate smoothly via a spring so the ring never jumps. */
export function Ring({
  progress,
  size = 200,
  thickness = 5,
  color = palette.accent,
  track = palette.hairline,
  children,
}: {
  /** 0–1, clamped. */
  progress: number;
  size?: number;
  thickness?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));

  // Animate the dash offset so progress changes glide rather than jump.
  const animP = useSharedValue(p);
  React.useEffect(() => {
    animP.value = withTiming(p, { duration: motion.hero, easing: Easing.out(Easing.cubic) });
  }, [p]);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - animP.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={thickness} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          animatedProps={animProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

/**
 * Horizontal bar. Used for daily usage and any single-value comparison.
 *
 * The fill grows into place and re-animates whenever `progress` changes, so a
 * usage bar updating mid-session reads as movement rather than a jump — the
 * same treatment `Ring` gets.
 *
 * This is the one place in the design system that animates a layout property:
 * `scaleX` on a full-width bar would stretch the right-hand rounded cap into an
 * oval. It's a single short animation on a small view, so the cost is a
 * non-issue; nothing else should copy the pattern.
 */
export function Meter({
  progress,
  color = palette.accent,
  height = 6,
  animate = true,
  style,
}: {
  progress: number;
  color?: string;
  height?: number;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const p = Math.max(0, Math.min(1, progress));
  const t = useSharedValue(animate ? 0 : p);

  React.useEffect(() => {
    if (!animate) {
      t.value = p;
      return;
    }
    t.value = withTiming(p, { duration: motion.hero, easing: Easing.out(Easing.cubic) });
  }, [p, animate, t]);

  const fill = useAnimatedStyle(() => ({ width: `${t.value * 100}%` }));

  return (
    <View style={[styles.meterTrack, { height, borderRadius: height / 2 }, style]}>
      <Animated.View
        style={[
          { height: '100%', borderRadius: height / 2, backgroundColor: color },
          fill,
        ]}
      />
    </View>
  );
}

/** Tab switcher with a spring-animated sliding pill indicator. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const idx = options.findIndex((o) => o.value === value);
  const pillX = useSharedValue(idx);

  React.useEffect(() => {
    pillX.value = withSpring(idx, { damping: 22, stiffness: 280, mass: 0.8 });
  }, [idx]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value * (100 / options.length) + '%' as unknown as number }],
    width: `${100 / options.length}%`,
  }));

  return (
    <View style={[styles.segment, style]}>
      {/* Sliding background pill */}
      <Animated.View style={[styles.segPill, pillStyle]} pointerEvents="none" />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) tapLight();
              onChange(o.value);
            }}
            style={styles.segItem}
          >
            <Text
              style={[type.caption, active ? styles.segTextActive : undefined]}
              numberOfLines={1}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Honest empty state. Kitnap's principle is "no fake numbers", so a screen with
 * nothing in it says so plainly rather than showing placeholder data.
 */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        {/* Presents itself rather than being already-there: an empty screen is
            the one place a little motion is reassuring rather than noisy. */}
        <AnimatedIcon name={icon} size={22} color={palette.textTertiary} delay={90} />
      </View>
      <Text style={[type.title3, styles.emptyTitle]}>{title}</Text>
      <Text style={[type.callout, styles.emptyBody]}>{body}</Text>
      {!!actionLabel && !!onAction && (
        <Button label={actionLabel} onPress={onAction} variant="outline" size="md" full={false} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shrink: { flex: 1, minWidth: 0 },

  screenRoot: { flex: 1, backgroundColor: palette.base },
  screenBloom: { position: 'absolute', alignSelf: 'center', top: -140 },
  screenSafe: { flex: 1 },

  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardPadded: { padding: space.lg },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(46,49,54,0.14)' },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  btnFull: { alignSelf: 'stretch', width: '100%' },
  btnCompact: { alignSelf: 'center' },
  btnFillWidth: { width: '100%' },
  btnLabel: { includeFontPadding: false, textAlignVertical: 'center' },
  btnOverlay: { borderRadius: radius.pill },
  btnDisabled: { opacity: 0.38 },
  field: {
    ...fieldStyle,
    width: '100%',
    alignSelf: 'stretch',
  },

  iconBtn: {
    width: control.touch,
    height: control.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnBordered: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.glass,
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.sm - 1,
    borderRadius: radius.pill,
    borderWidth: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: control.lg,
    paddingHorizontal: space.md,
  },
  headerSide: { minWidth: control.touch, justifyContent: 'center' },
  headerRight: { alignItems: 'flex-end' },
  headerMid: { flex: 1, alignItems: 'center' },

  section: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.md,
    marginTop: space.xxl,
    marginBottom: space.md,
  },
  sectionHint: { marginTop: space.xs },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: space.xs },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 60,
    paddingVertical: space.md,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowSub: { marginTop: space.xxs },
  rowOverlay: { backgroundColor: 'rgba(46,49,54,0.05)', borderRadius: radius.base },
  rowValue: { maxWidth: 130, textAlign: 'right' },

  statLabel: { marginBottom: space.sm },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs + 2 },
  statUnitCompact: { fontSize: 12 },

  meterTrack: { width: '100%', backgroundColor: palette.hairline, overflow: 'hidden' },

  segment: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.pill,
    padding: 3,
    position: 'relative',
  },
  segPill: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceHigh,
    zIndex: 0,
  },
  segItem: {
    flex: 1,
    height: control.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    zIndex: 1,
  },
  segTextActive: { color: palette.text },

  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.huge },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  emptyTitle: { textAlign: 'center' },
  emptyBody: { textAlign: 'center', maxWidth: 290, marginBottom: space.sm },
});
