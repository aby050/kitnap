import { Platform, TextStyle, ViewStyle } from 'react-native';
import { appearance } from './appearance';

/**
 * The two colour schemes, and the one bit of indirection that makes them
 * switchable. Only the hues that actually differ live here — surfaces, text
 * and hairlines are shared, because a scheme that changed everything would be
 * two apps rather than two skins.
 *
 * `appearance` is resolved synchronously at import (see appearance.ts), so
 * `SCHEME` is already correct by the time any screen's StyleSheet.create runs.
 * That is the whole reason switching requires a reload: styles capture these
 * values once, at module evaluation.
 */
const SCHEMES = {
  /** Sampled from the reference motion study. */
  blue: {
    accent: '#476BEB',
    accentPressed: '#3355D4',
    accentSoft: 'rgba(71,107,235,0.14)',
    accentBorder: 'rgba(71,107,235,0.30)',
    accentRamp: 'rgba(71,107,235,0.38)',
    accentRampMid: '#8B9CF2',
    onLight: '#251C82',
    secondary: '#ABBCF9',
    onSecondary: '#4661CC',
    surface: '#090C10',
    surfaceRaised: '#101620',
    surfaceHigh: '#182030',
    ground: ['#0E0E10', '#0E0E10', '#141037', '#1D156D', '#2119AA', '#2C20F1', '#3943E6', '#4A67E2'],
    rise: ['rgba(14,14,16,0)', 'rgba(20,16,55,0.75)', 'rgba(29,21,109,0.9)', 'rgba(33,25,170,0.95)', 'rgba(44,32,241,0.97)', 'rgba(57,67,230,0.98)', 'rgba(74,103,226,1)'],
    bloom: ['rgba(71,107,235,0.26)', 'rgba(71,107,235,0.06)', 'rgba(0,0,0,0)'],
    accentFill: ['#6E8CF5', '#3355D4'],
    /* Vertical ramp for a chart bar, light top → deep base. Hand-picked per
       scheme rather than derived: a programmatic tint of the accent goes
       muddy at the dark end, and this is the one place the app draws a
       four-stop gradient at small sizes where that shows. */
    chartGood: ['#C7E4FF', '#6E8CF5', '#3355D4', '#0F3B73'],
  },
  /** The Byre mark's own mint — the app's original scheme. */
  green: {
    accent: '#6FE3A9',
    accentPressed: '#5AD095',
    accentSoft: 'rgba(111,227,169,0.12)',
    accentBorder: 'rgba(111,227,169,0.26)',
    accentRamp: 'rgba(111,227,169,0.38)',
    accentRampMid: '#B9D97A',
    onLight: '#07301F',
    secondary: '#9FEFC9',
    onSecondary: '#0B5638',
    surface: '#0B0B0D',
    surfaceRaised: '#131317',
    surfaceHigh: '#1C1C21',
    // Same ramp shape as blue — flat hold, steep climb, lightening tail — so
    // the two schemes feel like one app in two colourways rather than two
    // different gradients that happen to share a screen.
    ground: ['#08100C', '#08100C', '#0A2418', '#0C3D28', '#0E6642', '#12A87C', '#2FC795', '#5FDDB1'],
    rise: ['rgba(8,16,12,0)', 'rgba(10,36,24,0.75)', 'rgba(12,61,40,0.9)', 'rgba(14,102,66,0.95)', 'rgba(18,168,124,0.97)', 'rgba(47,199,149,0.98)', 'rgba(95,221,177,1)'],
    bloom: ['rgba(111,227,169,0.22)', 'rgba(111,227,169,0.05)', 'rgba(0,0,0,0)'],
    accentFill: ['#8BEFBC', '#4FCB92'],
    chartGood: ['#D6FCEA', '#6FE3A9', '#2FA97B', '#0C3D28'],
  },
} as const;

const SCHEME = SCHEMES[appearance];

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
 *   accent (periwinkle) → active, on, positive, "you held the line"
 *   warn   (amber)   → caution, bedtime, approaching a limit
 *   danger (crimson) → cost, overuse, break-glass
 *
 * Primary actions are white-on-black rather than accent-coloured. High
 * contrast, never garish, and it keeps periwinkle meaningful as a *state* colour.
 *
 * Azure was chosen deliberately over both the cool mint/green that most
 * focus-and-blocking apps default to (that similarity is what got Byre's
 * last submission rejected under App Review 4.3(a)) and over warm
 * red/orange, so the brand doesn't drift into either a competitor's
 * territory or a "warning" register. ──────────────────────────────────── */

export const palette = {
  /* Surfaces, darkest → lightest */
  base: '#000000',
  surface: SCHEME.surface,
  surfaceRaised: SCHEME.surfaceRaised,
  surfaceHigh: SCHEME.surfaceHigh,
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

  /* Accent — periwinkle, sampled from the reference motion study (the
     highlighted headline line reads #476BEB there). Chosen over the mint of
     the logo mark because the app ground is now that study's electric blue:
     mint on that ground is a clash, and the mark keeps its own colour, so
     the green still appears exactly where the brand lives. */
  accent: SCHEME.accent,
  accentPressed: SCHEME.accentPressed,
  accentSoft: SCHEME.accentSoft,
  accentBorder: SCHEME.accentBorder,

  /* Label colour for a white primary control. The reference's white pill
     carries deep indigo text (#251C82), never black — black on white over a
     blue ground reads as a system alert rather than part of the screen. */
  onLight: SCHEME.onLight,

  /* ── On-colour surfaces ────────────────────────────────────────
   * The ground saturates in the bottom third, and the dark glass fills used
   * everywhere else (rgba black over black) simply vanish against it — a
   * "translucent dark" chip on electric blue is just blue. Controls that
   * live down there use these instead: white at low alpha, which reads as
   * frosted on any hue and therefore works unchanged in both schemes. */
  onColor: 'rgba(255,255,255,0.12)',
  onColorPressed: 'rgba(255,255,255,0.20)',
  onColorBorder: 'rgba(255,255,255,0.24)',
  onColorText: 'rgba(255,255,255,0.92)',
  onColorTextDim: 'rgba(255,255,255,0.66)',

  /* Secondary control — the lavender pill in the reference ("Redeem").
     Sampled fill #ABBCF9 with a #4661CC label. It sits between the white
     primary and a bare ghost link: still obviously tappable, clearly not the
     thing you are being pushed toward. */
  secondary: SCHEME.secondary,
  onSecondary: SCHEME.onSecondary,

  /* Savings / promotional badge — the amber "Save 40%" chip.
     ⚠️ ESTIMATED, not sampled: no frame in either reference video contains
     the badge, so this is matched by eye from the still. Adjust if it reads
     wrong beside the real thing. */
  savings: '#FFD24A',
  onSavings: '#3A2A00',

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
 * (calm periwinkle at low usage, crimson at high) so the colour itself reads as
 * "this is getting worse" without needing a legend.
 */
export const dataRamp = [
  SCHEME.accentRamp,
  palette.accent,
  SCHEME.accentRampMid,
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
/**
 * Poppins — the geometric sans from the reference motion study. Loaded in
 * App.tsx via @expo-google-fonts/poppins.
 *
 * ⚠️ With a custom font, `fontWeight` does NOT pick the face. React Native
 * only synthesises weights for the system font; for a bundled family you must
 * name the exact family per weight or every weight renders as Regular on
 * Android and as a faux-bold smear on iOS. That is why this is a map of
 * weight → family name rather than one `sans` entry, and why every `type`
 * entry below carries an explicit `fontFamily`.
 *
 * `system` stays available for the two places a bundled font is wrong: the
 * numeric tabular figures in countdowns (Poppins has no tabular set, so digits
 * jitter as a timer counts down) and any text that must match OS chrome.
 */
export const fonts = {
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extrabold: 'Poppins_800ExtraBold',
  /** OS font. Keep for tabular numerals — see above. */
  system: Platform.select({ ios: 'System', default: 'sans-serif' }) as string,
  /* The voice face. Not a bundled webfont: Georgia ships with iOS and has a
   * true italic cut, and Android's generic `serif` resolves to Noto Serif,
   * which has one too. A downloaded serif would cost ~180 KB and two more
   * font files to buy a difference nobody would name. */
  serif: Platform.select({ ios: 'Georgia', default: 'serif' }) as string,
} as const;

/**
 * Tabular figures for anything that counts. Deliberately also forces the OS
 * font: Poppins ships no tabular set, so a countdown rendered in it both
 * *jitters* (each digit is a different width, so "30" and "11" don't occupy
 * the same box) and runs noticeably wider than San Francisco at the same
 * size — wide enough that the unit label beside a hero figure was being
 * clipped to "mir".
 *
 * Spread this LAST in a type entry so it wins over the entry's own
 * fontFamily. Numerals are the one place the brand typeface is the wrong
 * tool.
 */
export const numeric: TextStyle = {
  fontVariant: ['tabular-nums'],
  fontFamily: fonts.system,
};

export const type = {
  /** Countdowns and hero figures only — one per screen, maximum. */
  display: {
    fontSize: 64,
    lineHeight: 68,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: -2,
    color: palette.text,
    ...numeric,
  } as TextStyle,
  /** Screen titles ("Home", "Apps"). */
  title1: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: palette.text,
  } as TextStyle,
  /** The Shield's single line of copy; large stat values. */
  title2: {
    fontSize: 24,
    lineHeight: 31,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: palette.text,
  } as TextStyle,
  /** Section headers, card titles. */
  title3: {
    fontSize: 19,
    lineHeight: 25,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: palette.text,
  } as TextStyle,
  /** Row titles, button labels. */
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.medium,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: palette.text,
  } as TextStyle,
  bodyStrong: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: palette.text,
  } as TextStyle,
  /** Paragraph copy — the explanatory voice the app relies on heavily. */
  callout: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    fontWeight: '400',
    color: palette.textSecondary,
  } as TextStyle,
  /** Row subtitles, helper text. */
  sub: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.regular,
    fontWeight: '400',
    color: palette.textTertiary,
  } as TextStyle,
  /** Pills, badges, metadata. */
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: palette.textTertiary,
  } as TextStyle,
  /** Eyebrow labels above a value. Uppercase + wide tracking is the only
   *  place we letterspace positively. */
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fonts.bold,
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
    fontFamily: fonts.light,
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
    fontFamily: fonts.medium,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: palette.textTertiary,
  } as TextStyle,

  /* ── Editorial voice ───────────────────────────────────────────
   * Used as a pair on one line: the dim line sets up, the accent line lands.
   * "You said you wanted" / "the mornings back".
   *
   * Was a Georgia italic. The reference motion study sets its headlines as
   * heavy lowercase geometric sans on very tight leading, with one line
   * coloured to carry the emphasis — so the italic is gone and the contrast
   * is now weight and colour instead of slant. Leading is deliberately
   * tighter than the fontSize ratio used elsewhere (1.1 vs ~1.3): the stacked
   * two-tone headline only reads as one object when the lines nearly touch.
   *
   * No italic face is referenced anywhere. Naming a non-italic family with
   * fontStyle:'italic' gives a faux-slanted smear, not a real italic. */
  editorial: {
    fontFamily: fonts.extrabold,
    fontSize: 30,
    lineHeight: 33,
    fontWeight: '800',
    letterSpacing: -0.9,
    color: palette.textSecondary,
  } as TextStyle,
  /**
   * The app speaking rather than labelling — block screens and focus rooms.
   *
   * Geometric sans is right for every functional surface in the app and wrong
   * for this one: a sentence that is meant to land as a thought should not be
   * set in the same face as the row labels. The serif italic reads as a
   * remark, which is the one thing this text has to do.
   *
   * A real italic cut, not `fontStyle: 'italic'` over a sans — that gives a
   * faux-slanted smear. Georgia and Noto Serif both have genuine italics,
   * which is why they are the two named in `fonts.serif`.
   */
  voice: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontSize: 27,
    lineHeight: 35,
    letterSpacing: -0.2,
    color: palette.textSecondary,
  } as TextStyle,
  voiceStrong: {
    fontFamily: fonts.serif,
    fontStyle: 'italic',
    fontWeight: '700',
    fontSize: 27,
    lineHeight: 35,
    letterSpacing: -0.2,
    color: palette.accent,
  } as TextStyle,
  editorialStrong: {
    fontFamily: fonts.extrabold,
    fontSize: 30,
    lineHeight: 33,
    fontWeight: '800',
    letterSpacing: -0.9,
    color: palette.accent,
  } as TextStyle,
  /** Pull-quotes of the user's own typed words. */
  quote: {
    fontFamily: fonts.medium,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
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
  /** Bottom padding that clears the floating tab bar.
   *
   *  The bar genuinely floats now — it is a glass pill inset from the edges,
   *  not a slab pinned to the bottom — so nothing in the layout reserves
   *  space for it and every scrolling screen has to pad by this. 116 was
   *  already too small for the old slab (the last row was showing through
   *  it); the pill sits higher still, since it clears the home indicator by
   *  the safe-area inset plus a gap. */
  tabClearance: 150,
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
 * The background is not flat black — a periwinkle bloom bleeds up from behind the
 * content, so the screen has a light source. This is the difference between
 * "dark mode" and a designed dark surface. Rendered with a radial gradient
 * (see GlowField in primitives), never with a shadow: shadowColor is ignored
 * on Android, so a "glow" built from shadows exists on iOS only.
 * ───────────────────────────────────────────────────────────── */

export const gradients = {
  /** App ground — sampled directly from the reference motion study rather
   *  than eyeballed, which is why it is eight stops and not three. The ramp
   *  is not linear: it holds a flat near-black for the top fifth, climbs
   *  steeply through indigo, peaks in saturation around 0.67 (#2C20F1), then
   *  *lightens and desaturates* toward the bottom edge (#4A67E2). That final
   *  lift is the part a 3-stop approximation always misses — without it the
   *  screen reads as a flat blue wash instead of a light source sitting just
   *  below the bottom bezel.
   *
   *  Must be used with `groundLocations` — the stops are unevenly spaced and
   *  evenly distributing them collapses the whole effect. */
  ground: SCHEME.ground as unknown as readonly [string, string, ...string[]],
  /** Chart bar ramp for the active scheme — see SCHEMES.chartGood. */
  chartGood: SCHEME.chartGood as unknown as readonly [string, string, string, string],
  /** Stop positions for `ground`, measured off the same reference frame. */
  /**
   * Where each `ground` stop sits, top → bottom.
   *
   * Colour is confined to the **bottom 40%**: black holds flat to 0.60, then
   * the whole ramp — the climb, the 0.85 saturation peak and the lightening
   * tail — is compressed into the last third. The reference frame these
   * colours were sampled from spreads the same ramp over roughly half the
   * screen; this is deliberately tighter, which reads as a light source just
   * under the bezel rather than a wash over the lower half.
   *
   * The two stops at 0.60/0.64 are both near-black by design: a single hard
   * stop from flat black into indigo bands visibly on an OLED gradient.
   */
  groundLocations: [0, 0.6, 0.64, 0.69, 0.74, 0.83, 0.91, 1] as readonly [number, number, ...number[]],
  /** The ground's rise on its own, transparent at the top — layered over an
   *  existing dark background (onboarding's PersistentBackground) that paints
   *  its own black rather than re-painting it. */
  groundRise: SCHEME.rise as unknown as readonly [string, string, ...string[]],
  /** Stop positions for `groundRise`, tracking `groundLocations` from its
   *  second stop. Transparent until 0.58 so onboarding's animated black shows
   *  through the top ~60% untouched. */
  groundRiseLocations: [0, 0.58, 0.64, 0.69, 0.78, 0.88, 1] as readonly [number, number, ...number[]],
  /** Behind a hero figure or the Shield's line — a stronger centred bloom. */
  bloom: SCHEME.bloom as unknown as readonly [string, string, string],
  /** Fill for a primary white control, so it isn't a dead flat rectangle. */
  light: ['#FFFFFF', '#F2F3FF'] as readonly [string, string],
  /** Fill for an accent-filled control. */
  accent: SCHEME.accentFill as unknown as readonly [string, string],
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
