import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Byre design tokens — the single source of truth for colour, type, spacing,
 * radius, elevation and motion.
 *
 * Why this file exists: the app had grown six competing accent colours (mint,
 * orange, amber, coral, pink, neon-lime) and a half-point ad-hoc font scale,
 * so adjacent tabs read as different products. Every surface now pulls from
 * here. If a value isn't in this file, it shouldn't be in a StyleSheet.
 */

/* ─────────────────────────────────────────────────────────────
 * COLOUR
 *
 * Neutrals are true-black-based: Byre is a full-screen interrupt running on
 * OLED Android hardware, and #000 is the only value that actually goes dark.
 * Elevation is expressed by lifting the surface a few points, never by a
 * drop shadow on a dark background (shadows are invisible there).
 *
 * Chromatic colour is rationed to three hues with one meaning each, so a
 * colour on screen always carries information instead of decoration:
 *   accent (azure)   → active, on, positive, "you held the line"
 *   warn   (amber)   → caution, bedtime, approaching a limit
 *   danger (crimson) → cost, overuse, break-glass
 *
 * Primary actions are white-on-black rather than accent-coloured. High
 * contrast, never garish, and it keeps azure meaningful as a *state* colour.
 *
 * Azure was chosen deliberately over both the cool mint/green that most
 * focus-and-blocking apps default to (that similarity is what got Byre's
 * last submission rejected under App Review 4.3(a)) and over warm
 * red/orange, so the brand doesn't drift into either a competitor's
 * territory or a "warning" register. ──────────────────────────────────── */

export const palette = {
  /* Surfaces, darkest → lightest */
  base: '#000000',
  surface: '#090C10',
  surfaceRaised: '#101620',
  surfaceHigh: '#182030',
  surfaceInverse: '#FFFFFF',

  /* Text, most → least prominent. Alpha-based so it composes over any surface. */
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.64)',
  textTertiary: 'rgba(255,255,255,0.44)',
  textQuaternary: 'rgba(255,255,255,0.28)',
  textInverse: '#000000',

  /* Hairlines. `hairline` is for dividers inside a card, `border` for the
   * card edge itself, `borderStrong` only for a focused/selected edge. */
  hairline: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.11)',
  borderStrong: 'rgba(255,255,255,0.18)',

  /* Accent — azure. Active states, positive data, brand moments. */
  accent: '#4C9EFF',
  accentPressed: '#2F7FE0',
  accentSoft: 'rgba(76,158,255,0.12)',
  accentBorder: 'rgba(76,158,255,0.26)',

  /* Warn — amber/gold. Caution, bedtime, nearing a limit. */
  warn: '#E9B23E',
  warnSoft: 'rgba(233,178,62,0.12)',
  warnBorder: 'rgba(233,178,62,0.26)',

  /* Danger — deep crimson. Cost, overuse, break-glass. Never used decoratively. */
  danger: '#E23A4E',
  dangerSoft: 'rgba(226,58,78,0.12)',
  dangerBorder: 'rgba(226,58,78,0.26)',

  /* Translucent fills for controls sitting on unknown backgrounds (e.g. the
   * themed Shield gradient), where a fixed surface colour would clash. */
  glass: 'rgba(255,255,255,0.09)',
  glassPressed: 'rgba(255,255,255,0.15)',
  scrim: 'rgba(0,0,0,0.78)',
} as const;

/**
 * Sequential ramp for usage/intensity data, low → high. Semantically ordered
 * (calm azure at low usage, crimson at high) so the colour itself reads as
 * "this is getting worse" without needing a legend.
 */
export const dataRamp = [
  'rgba(76,158,255,0.38)',
  palette.accent,
  '#6FB3FF',
  palette.warn,
  palette.danger,
] as const;

/* ─────────────────────────────────────────────────────────────
 * TYPE
 *
 * One scale, integer sizes, negative tracking that tightens as size grows —
 * the standard optical correction that keeps large text from looking loose.
 * Line heights are ~1.3 for headings and ~1.45 for body copy.
 *
 * `numeric` applies tabular figures instead of switching to a monospace
 * family. Both system fonts (SF, Roboto) ship tabular numerals, so counters
 * stop jittering as digits change without the app looking like a terminal.
 * ───────────────────────────────────────────────────────────── */

/**
 * Two families, deliberately paired.
 *
 * Geometric sans carries every functional label — rows, buttons, data. A serif
 * carries the app's *own voice*: the Shield's one line, the reflection prompts,
 * the moments where Byre is talking to you rather than reporting to you. That
 * split is what stops a wall of sans from reading like a settings menu.
 *
 * Both faces ship with the OS, so there is no font download, no flash of
 * unstyled text and no bundle cost.
 */
export const fonts = {
  sans: Platform.select({ ios: 'System', default: 'sans-serif' }) as string,
  /** Hairline weights only render on Android via the explicitly named family. */
  sansLight: Platform.select({ ios: 'System', default: 'sans-serif-light' }) as string,
  serif: Platform.select({ ios: 'Georgia', default: 'serif' }) as string,
} as const;

export const numeric: TextStyle = { fontVariant: ['tabular-nums'] };

export const type = {
  /** Countdowns and hero figures only — one per screen, maximum. */
  display: {
    fontSize: 64,
    lineHeight: 68,
    fontWeight: '700',
    letterSpacing: -2,
    color: palette.text,
    ...numeric,
  } as TextStyle,
  /** Screen titles ("Home", "Apps"). */
  title1: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: palette.text,
  } as TextStyle,
  /** The Shield's single line of copy; large stat values. */
  title2: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: palette.text,
  } as TextStyle,
  /** Section headers, card titles. */
  title3: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: palette.text,
  } as TextStyle,
  /** Row titles, button labels. */
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: palette.text,
  } as TextStyle,
  bodyStrong: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: palette.text,
  } as TextStyle,
  /** Paragraph copy — the explanatory voice the app relies on heavily. */
  callout: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: palette.textSecondary,
  } as TextStyle,
  /** Row subtitles, helper text. */
  sub: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    color: palette.textTertiary,
  } as TextStyle,
  /** Pills, badges, metadata. */
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: palette.textTertiary,
  } as TextStyle,
  /** Eyebrow labels above a value. Uppercase + wide tracking is the only
   *  place we letterspace positively. */
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: palette.textTertiary,
  } as TextStyle,

  /* ── Hero figures ──────────────────────────────────────────────
   * A large figure at *light* weight reads as calm and expensive; the same
   * figure at 700 reads as an alarm clock. Byre counts down time you chose
   * to give up, so it should never shout. Always paired with `unit`, never
   * with the unit baked into the same string. */
  hero: {
    fontFamily: fonts.sansLight,
    fontSize: 78,
    lineHeight: 82,
    fontWeight: '200',
    letterSpacing: -3.5,
    color: palette.text,
    ...numeric,
  } as TextStyle,
  /** The small dim label sitting beside a `hero` figure ("min", "hr", "%"). */
  unit: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: palette.textTertiary,
  } as TextStyle,

  /* ── Editorial voice ───────────────────────────────────────────
   * Used as a pair on one line: the dim italic sets up, the accent roman
   * lands. "You said you wanted" / "the mornings back". */
  editorial: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontSize: 29,
    lineHeight: 39,
    fontWeight: '400',
    letterSpacing: -0.4,
    color: palette.textSecondary,
  } as TextStyle,
  editorialStrong: {
    fontFamily: fonts.serif,
    fontSize: 29,
    lineHeight: 39,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: palette.accent,
  } as TextStyle,
  /** Smaller serif, for pull-quotes of the user's own typed words. */
  quote: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '400',
    color: palette.text,
  } as TextStyle,
} as const;

/* ─────────────────────────────────────────────────────────────
 * SPACE / RADIUS
 * A 4pt grid. Named by role so screens read intentionally.
 * ───────────────────────────────────────────────────────────── */

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  /** Standard screen side padding — every screen uses this, nothing else. */
  gutter: 20,
  /** Bottom padding that clears the floating tab bar. */
  tabClearance: 116,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

/**
 * Control heights. Fixed so a button, an input and a segmented control all
 * line up when placed side by side.
 */
export const control = {
  lg: 56,
  md: 46,
  sm: 36,
  /** Minimum tappable square — below this we add hitSlop instead. */
  touch: 44,
} as const;

/** Single-line pill field — same height and radius as a large Button. */
export const fieldStyle: TextStyle = {
  height: control.lg,
  borderRadius: radius.pill,
  backgroundColor: palette.glass,
  paddingHorizontal: space.lg,
  color: palette.text,
  fontSize: 16,
  fontWeight: '500',
};

/* ─────────────────────────────────────────────────────────────
 * ELEVATION
 * Used sparingly: on a true-black background a shadow reads as haze, so
 * depth mostly comes from surface lightness. This is reserved for things
 * that genuinely float (bottom sheets, the live-activity bar, tab bar).
 * ───────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────
 * LIGHT
 *
 * The background is not flat black — an azure bloom bleeds up from behind the
 * content, so the screen has a light source. This is the difference between
 * "dark mode" and a designed dark surface. Rendered with a radial gradient
 * (see GlowField in primitives), never with a shadow: shadowColor is ignored
 * on Android, so a "glow" built from shadows exists on iOS only.
 * ───────────────────────────────────────────────────────────── */

export const gradients = {
  /** App ground. Faintest possible azure lift at the top, true black below. */
  ground: ['#050C16', '#000000', '#000000'] as readonly [string, string, string],
  /** Behind a hero figure or the Shield's line — a stronger centred bloom. */
  bloom: ['rgba(76,158,255,0.22)', 'rgba(76,158,255,0.05)', 'rgba(0,0,0,0)'] as readonly [string, string, string],
  /** Fill for a primary white control, so it isn't a dead flat rectangle. */
  light: ['#FFFFFF', '#E8ECEA'] as readonly [string, string],
  /** Fill for an accent-filled control. */
  accent: ['#8FC4FF', '#2F7FE0'] as readonly [string, string],
  /** Top-down scrim so content can scroll under the status bar legibly. */
  scrimTop: ['rgba(0,0,0,0.9)', 'rgba(0,0,0,0)'] as readonly [string, string],
} as const;

export const elevation = {
  floating: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
    },
    default: { elevation: 16 },
  }) as ViewStyle,
} as const;

/* ─────────────────────────────────────────────────────────────
 * MOTION
 *
 * Five durations, three springs. Byre's motion job is to make an interruption
 * feel deliberate rather than abrupt, so entrances are unhurried (320ms) while
 * feedback is near-instant (120ms). The behaviours built from these — entrances,
 * pops, ambient loops — live in `motion.ts`, so screens compose rather than
 * invent.
 * ───────────────────────────────────────────────────────────── */

export const motion = {
  /** Press feedback. */
  instant: 120,
  /** Element entrance, state cross-fade. */
  enter: 220,
  /** Screen / tab transition. */
  transition: 320,
  /** Hero moments — the Shield appearing, a session completing. */
  hero: 520,
  /** Brand moments only: the splash mark's reveal. Long enough to be watched. */
  brand: 900,
  /** The one spring, for anything that settles into place. */
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
  /**
   * Tighter and quicker, for something small that must land *now*: a tab
   * indicator sliding, a badge popping. The soft `spring` above reads as
   * sluggish at this size.
   */
  snap: { damping: 20, stiffness: 340, mass: 0.7 },
  /**
   * Heavier and slower, for large elements finding their place — a sheet, the
   * splash mark. Big things that move fast read as cheap.
   */
  settle: { damping: 22, stiffness: 130, mass: 1.1 },
  /** Per-item delay when a group animates in one after another. */
  stagger: 55,
  /** Scale a control drops to while held. */
  pressScale: 0.975,
} as const;

/** Convenience: the standard translucent-card recipe, used everywhere. */
export const cardStyle: ViewStyle = {
  backgroundColor: palette.surface,
  borderRadius: radius.xl,
  borderWidth: 1,
  borderColor: palette.border,
};

/** Legacy alias so files still importing `colors` from '../theme' keep
 *  compiling while they're migrated one at a time. */
export const colors = {
  bg: palette.base,
  bgTop: palette.surface,
  text: palette.text,
  textDim: palette.textSecondary,
  textFaint: palette.textTertiary,
  accent: palette.accent,
  accentDim: palette.accentBorder,
  cardBg: palette.surfaceRaised,
  cardBorder: palette.border,
  pillBg: palette.glass,
} as const;
