import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Wend's icon set — one 24×24 grid, one stroke weight, no fills except where
 * a shape is genuinely solid.
 *
 * This replaces every emoji in the app. Emoji were being used three ways and
 * all three are covered here:
 *   1. chrome        — close, chevrons, play/pause, search
 *   2. semantic tags — moon for bedtime, key for an emergency token
 *   3. theme marks   — leaf/book/home/tower/mist for the six focus themes
 *
 * Rules for adding one: draw it on the 24 grid, keep the optical weight of
 * the neighbours, never add a face, never add colour inside the path. If a
 * concept needs an illustration rather than an icon, it does not belong here.
 */

export type IconName =
  // chrome
  | 'check'
  | 'checkCircle'
  | 'close'
  | 'closeCircle'
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronDown'
  | 'chevronUp'
  | 'arrowRight'
  | 'arrowUpRight'
  | 'plus'
  | 'minus'
  | 'more'
  | 'search'
  | 'filter'
  | 'refresh'
  | 'download'
  | 'edit'
  | 'trash'
  | 'share'
  | 'info'
  | 'help'
  | 'alert'
  | 'backspace'
  | 'bolt'
  | 'gift'
  | 'rocket'
  | 'door'
  | 'phoneOff'
  // blocking + access
  | 'shield'
  | 'shieldOff'
  | 'lock'
  | 'unlock'
  | 'key'
  | 'eye'
  | 'eyeOff'
  // time
  | 'clock'
  | 'timer'
  | 'hourglass'
  | 'calendar'
  | 'moon'
  | 'sun'
  | 'sunrise'
  // controls
  | 'play'
  | 'pause'
  | 'stop'
  | 'skip'
  | 'sliders'
  | 'settings'
  | 'bell'
  | 'bellOff'
  | 'volume'
  | 'volumeOff'
  | 'headphones'
  | 'mic'
  // data + reflection
  | 'chart'
  | 'bars'
  | 'trendUp'
  | 'trendDown'
  | 'pulse'
  | 'target'
  | 'flame'
  | 'award'
  | 'note'
  | 'quote'
  // navigation / objects
  | 'home'
  | 'grid'
  | 'list'
  | 'phone'
  | 'folder'
  | 'user'
  | 'camera'
  | 'image'
  | 'globe'
  | 'message'
  | 'card'
  | 'pin'
  | 'wallet'
  // challenge kinds
  | 'math'
  | 'brainQuiz'
  | 'breathe'
  | 'activity'
  // theme marks
  | 'tower'
  | 'leaf'
  | 'book'
  | 'mist'
  | 'heart';

type Geo = { c: string; w: number };

/** Stroked path on the shared grid. Round caps everywhere — it is the single
 *  biggest factor in a set looking drawn by one hand. */
const S = ({ d, c, w, cap = 'round' }: { d: string; c: string; w: number; cap?: 'round' | 'butt' }) => (
  <Path d={d} stroke={c} strokeWidth={w} strokeLinecap={cap} strokeLinejoin="round" fill="none" />
);

/** Solid path, for the few marks that read wrong as outlines (play, flame). */
const F = ({ d, c }: { d: string; c: string }) => <Path d={d} fill={c} />;

const shapes: Record<IconName, (g: Geo) => React.ReactNode> = {
  /* ── chrome ──────────────────────────────────────────────────── */
  check: ({ c, w }) => <S d="M4.5 12.5l5 5 10-11" c={c} w={w + 0.25} />,
  checkCircle: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={w} fill="none" />
      <S d="M8 12.3l2.8 2.8L16.2 9.5" c={c} w={w} />
    </>
  ),
  close: ({ c, w }) => <S d="M5.5 5.5l13 13M18.5 5.5l-13 13" c={c} w={w} />,
  closeCircle: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={w} fill="none" />
      <S d="M9 9l6 6M15 9l-6 6" c={c} w={w} />
    </>
  ),
  chevronLeft: ({ c, w }) => <S d="M14.5 5l-7 7 7 7" c={c} w={w} />,
  chevronRight: ({ c, w }) => <S d="M9.5 5l7 7-7 7" c={c} w={w} />,
  chevronDown: ({ c, w }) => <S d="M5 9.5l7 7 7-7" c={c} w={w} />,
  chevronUp: ({ c, w }) => <S d="M5 14.5l7-7 7 7" c={c} w={w} />,
  arrowRight: ({ c, w }) => <S d="M4 12h15M13 6l6 6-6 6" c={c} w={w} />,
  arrowUpRight: ({ c, w }) => <S d="M7 17L17 7M8.5 7H17v8.5" c={c} w={w} />,
  plus: ({ c, w }) => <S d="M12 5v14M5 12h14" c={c} w={w} />,
  minus: ({ c, w }) => <S d="M5 12h14" c={c} w={w} />,
  more: ({ c }) => (
    <>
      <Circle cx="5.5" cy="12" r="1.5" fill={c} />
      <Circle cx="12" cy="12" r="1.5" fill={c} />
      <Circle cx="18.5" cy="12" r="1.5" fill={c} />
    </>
  ),
  search: ({ c, w }) => (
    <>
      <Circle cx="10.8" cy="10.8" r="6.3" stroke={c} strokeWidth={w} fill="none" />
      <S d="M15.6 15.6L20.5 20.5" c={c} w={w} />
    </>
  ),
  filter: ({ c, w }) => <S d="M4 7h16M7 12h10M10 17h4" c={c} w={w} />,
  refresh: ({ c, w }) => <S d="M19.5 12a7.5 7.5 0 1 1-2.6-5.7M19.5 4.5V10h-5.4" c={c} w={w} />,
  download: ({ c, w }) => <S d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 19.5h15" c={c} w={w} />,
  edit: ({ c, w }) => <S d="M4 20h4l11-11a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5V20zM14.5 6.5L17.5 9.5" c={c} w={w} />,
  trash: ({ c, w }) => <S d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l1 12.2h9l1-12.2M10.5 10.5v6M13.5 10.5v6" c={c} w={w} />,
  share: ({ c, w }) => <S d="M12 3.5v11M8 7l4-3.5L16 7M5 14v5.5h14V14" c={c} w={w} />,
  info: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={w} fill="none" />
      <S d="M12 11v6" c={c} w={w} />
      <Circle cx="12" cy="7.6" r="1.15" fill={c} />
    </>
  ),
  help: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={w} fill="none" />
      <S d="M9.4 9.2a2.7 2.7 0 1 1 3.9 2.4c-.8.5-1.3 1-1.3 2" c={c} w={w} />
      <Circle cx="12" cy="17" r="1.1" fill={c} />
    </>
  ),
  alert: ({ c, w }) => (
    <>
      <S d="M12 4.2L21 19.6H3L12 4.2z" c={c} w={w} />
      <S d="M12 10v4" c={c} w={w} />
      <Circle cx="12" cy="16.8" r="1.05" fill={c} />
    </>
  ),

  /* ── blocking + access ───────────────────────────────────────── */
  shield: ({ c, w }) => <S d="M12 3.2l7.5 3.1v5.6c0 4.6-3.1 8-7.5 9.2-4.4-1.2-7.5-4.6-7.5-9.2V6.3L12 3.2z" c={c} w={w} />,
  shieldOff: ({ c, w }) => (
    <>
      <S d="M12 3.2l7.5 3.1v5.6c0 4.6-3.1 8-7.5 9.2-4.4-1.2-7.5-4.6-7.5-9.2V6.3L12 3.2z" c={c} w={w} />
      <S d="M4 4l16 16" c={c} w={w} />
    </>
  ),
  lock: ({ c, w }) => (
    <>
      <S d="M7.2 10.5V8a4.8 4.8 0 1 1 9.6 0v2.5" c={c} w={w} />
      <Rect x="4.6" y="10.5" width="14.8" height="9.6" rx="2.4" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="12" cy="15.3" r="1.5" fill={c} />
    </>
  ),
  unlock: ({ c, w }) => (
    <>
      <S d="M7.2 10.5V8a4.8 4.8 0 0 1 9.3-1.6" c={c} w={w} />
      <Rect x="4.6" y="10.5" width="14.8" height="9.6" rx="2.4" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="12" cy="15.3" r="1.5" fill={c} />
    </>
  ),
  key: ({ c, w }) => (
    <>
      <Circle cx="8" cy="16" r="4.2" stroke={c} strokeWidth={w} fill="none" />
      <S d="M11 13L20 4M17 4h3v3" c={c} w={w} />
    </>
  ),
  eye: ({ c, w }) => (
    <>
      <S d="M2.5 12S6 6.2 12 6.2 21.5 12 21.5 12 18 17.8 12 17.8 2.5 12 2.5 12z" c={c} w={w} />
      <Circle cx="12" cy="12" r="3.1" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  eyeOff: ({ c, w }) => (
    <>
      <S d="M4.2 8.4C3 9.7 2.5 12 2.5 12s3.5 5.8 9.5 5.8c1.5 0 2.8-.35 4-.9M9.2 6.6c.9-.25 1.8-.4 2.8-.4 6 0 9.5 5.8 9.5 5.8s-.9 1.5-2.5 3" c={c} w={w} />
      <S d="M9.9 9.9a3.1 3.1 0 0 0 4.3 4.3M3.5 3.5l17 17" c={c} w={w} />
    </>
  ),

  /* ── time ────────────────────────────────────────────────────── */
  clock: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="8.6" stroke={c} strokeWidth={w} fill="none" />
      <S d="M12 7.2V12l3.4 2.1" c={c} w={w} />
    </>
  ),
  timer: ({ c, w }) => (
    <>
      <Circle cx="12" cy="13.6" r="7.6" stroke={c} strokeWidth={w} fill="none" />
      <S d="M12 9.8v3.8l2.7 1.7M9.4 2.6h5.2M12 2.6V6" c={c} w={w} />
    </>
  ),
  hourglass: ({ c, w }) => <S d="M6.5 3.5h11v3.2L12 12l5.5 5.3v3.2h-11v-3.2L12 12 6.5 6.7V3.5z" c={c} w={w} />,
  calendar: ({ c, w }) => (
    <>
      <Rect x="3.8" y="5.4" width="16.4" height="15" rx="2.6" stroke={c} strokeWidth={w} fill="none" />
      <S d="M3.8 10.2h16.4M8.4 3.2v4M15.6 3.2v4" c={c} w={w} />
    </>
  ),
  moon: ({ c, w }) => <S d="M20 14.6A8.8 8.8 0 0 1 9.4 4 9.2 9.2 0 1 0 20 14.6z" c={c} w={w} />,
  sun: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="4.4" stroke={c} strokeWidth={w} fill="none" />
      <S d="M12 2.6v2.4M12 19v2.4M4.3 4.3l1.7 1.7M18 18l1.7 1.7M2.6 12h2.4M19 12h2.4M4.3 19.7L6 18M18 6l1.7-1.7" c={c} w={w} />
    </>
  ),
  sunrise: ({ c, w }) => (
    <>
      <S d="M7.6 15.4a4.6 4.6 0 1 1 8.8 0M2.6 19.4h18.8M12 2.6v3.6M4.8 6.4l1.8 1.8M19.2 6.4l-1.8 1.8" c={c} w={w} />
    </>
  ),

  /* ── controls ────────────────────────────────────────────────── */
  play: ({ c }) => <F d="M8 5.4a1 1 0 0 1 1.53-.85l9 6.05a1 1 0 0 1 0 1.66l-9 6.05A1 1 0 0 1 8 17.46V5.4z" c={c} />,
  pause: ({ c }) => (
    <>
      <Rect x="7.2" y="5.2" width="3.4" height="13.6" rx="1.5" fill={c} />
      <Rect x="13.4" y="5.2" width="3.4" height="13.6" rx="1.5" fill={c} />
    </>
  ),
  stop: ({ c }) => <Rect x="6.4" y="6.4" width="11.2" height="11.2" rx="2.6" fill={c} />,
  skip: ({ c, w }) => <S d="M6 5.5l8 6.5-8 6.5V5.5zM18 5.5v13" c={c} w={w} />,
  sliders: ({ c, w }) => (
    <>
      <S d="M4 8h16M4 16h16" c={c} w={w} />
      <Circle cx="9.5" cy="8" r="2.6" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="15" cy="16" r="2.6" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  settings: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="3.2" stroke={c} strokeWidth={w} fill="none" />
      <S
        d="M12 2.8l1.5 2.3 2.7-.5.5 2.7 2.3 1.5-1.3 2.4 1.3 2.4-2.3 1.5-.5 2.7-2.7-.5L12 21.2l-1.5-2.3-2.7.5-.5-2.7-2.3-1.5L6.3 12 5 9.6l2.3-1.5.5-2.7 2.7.5L12 2.8z"
        c={c}
        w={w}
      />
    </>
  ),
  bell: ({ c, w }) => <S d="M6.4 10.4a5.6 5.6 0 1 1 11.2 0c0 4 1.6 5.6 1.6 5.6H4.8s1.6-1.6 1.6-5.6zM10 19a2.2 2.2 0 0 0 4 0" c={c} w={w} />,
  bellOff: ({ c, w }) => (
    <>
      <S d="M8.2 6.2A5.6 5.6 0 0 1 17.6 10.4c0 4 1.6 5.6 1.6 5.6H8M5.4 16s1-1.7 1-5.6M10 19a2.2 2.2 0 0 0 4 0" c={c} w={w} />
      <S d="M3.5 3.5l17 17" c={c} w={w} />
    </>
  ),
  volume: ({ c, w }) => <S d="M4 9.6h3.2L12 5.4v13.2L7.2 14.4H4V9.6zM15.6 9.4a3.6 3.6 0 0 1 0 5.2M18.2 6.8a7.2 7.2 0 0 1 0 10.4" c={c} w={w} />,
  volumeOff: ({ c, w }) => <S d="M4 9.6h3.2L12 5.4v13.2L7.2 14.4H4V9.6zM16 10l4.5 4.5M20.5 10L16 14.5" c={c} w={w} />,
  headphones: ({ c, w }) => (
    <>
      <S d="M4 14.4v-2a8 8 0 0 1 16 0v2" c={c} w={w} />
      <Rect x="2.8" y="13.6" width="4.4" height="6.6" rx="2.2" stroke={c} strokeWidth={w} fill="none" />
      <Rect x="16.8" y="13.6" width="4.4" height="6.6" rx="2.2" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  mic: ({ c, w }) => (
    <>
      <Rect x="9" y="2.6" width="6" height="10.4" rx="3" stroke={c} strokeWidth={w} fill="none" />
      <S d="M5.8 11.4a6.2 6.2 0 0 0 12.4 0M12 17.6v3.8" c={c} w={w} />
    </>
  ),

  /* ── data + reflection ───────────────────────────────────────── */
  chart: ({ c, w }) => <S d="M4 4v16h16M8 15.5l3.4-4.2 2.8 2.4L19.5 7" c={c} w={w} />,
  bars: ({ c, w }) => <S d="M5.5 20V13M12 20V4.5M18.5 20V9.5" c={c} w={w + 0.4} />,
  trendUp: ({ c, w }) => <S d="M3.5 17.5l6-6 3.6 3.6L20.5 8M15 8h5.5v5.5" c={c} w={w} />,
  trendDown: ({ c, w }) => <S d="M3.5 7l6 6 3.6-3.6L20.5 16M15 16h5.5v-5.5" c={c} w={w} />,
  pulse: ({ c, w }) => <S d="M2.5 12h4l2.4-6 3.4 12 2.6-6h6.6" c={c} w={w} />,
  target: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="8.6" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="12" cy="12" r="4.4" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="12" cy="12" r="1.4" fill={c} />
    </>
  ),
  flame: ({ c }) => (
    <F
      d="M12.6 2.2c.4 2.6-1 3.9-2.4 5.3C8.6 9 7 10.6 7 13.4A6.2 6.2 0 0 0 13.2 21c3.4 0 6-2.7 6-6.1 0-4-2.6-6-4-7.5-.5 1.4-1.3 2.1-2.2 2.4.5-2.6.6-5.3-.4-7.6z"
      c={c}
    />
  ),
  award: ({ c, w }) => (
    <>
      <Circle cx="12" cy="9.4" r="5.9" stroke={c} strokeWidth={w} fill="none" />
      <S d="M8.4 14.4L7 21.4l5-2.6 5 2.6-1.4-7" c={c} w={w} />
    </>
  ),
  note: ({ c, w }) => (
    <>
      <S d="M6 3.4h8.6L19 7.9V20.6H6V3.4z" c={c} w={w} />
      <S d="M14 3.6V8h4.6M9 12.4h6M9 16h4" c={c} w={w} />
    </>
  ),
  quote: ({ c, w }) => <S d="M9.4 6.6C6.6 8 5 10.4 5 13.4c0 2.3 1.4 3.9 3.3 3.9 1.7 0 2.9-1.2 2.9-2.9 0-1.6-1.1-2.8-2.6-2.8-.3 0-.5 0-.7.1.3-1.6 1.3-3 3-4zM19 6.6c-2.8 1.4-4.4 3.8-4.4 6.8 0 2.3 1.4 3.9 3.3 3.9 1.7 0 2.9-1.2 2.9-2.9 0-1.6-1.1-2.8-2.6-2.8-.3 0-.5 0-.7.1.3-1.6 1.3-3 3-4z" c={c} w={w} />,

  /* ── navigation / objects ────────────────────────────────────── */
  home: ({ c, w }) => <S d="M3.6 10.4L12 3.4l8.4 7v10.2h-5.6v-6.2H9.2v6.2H3.6V10.4z" c={c} w={w} />,
  grid: ({ c, w }) => (
    <>
      <Rect x="4" y="4" width="7" height="7" rx="2.2" stroke={c} strokeWidth={w} fill="none" />
      <Rect x="13" y="4" width="7" height="7" rx="2.2" stroke={c} strokeWidth={w} fill="none" />
      <Rect x="4" y="13" width="7" height="7" rx="2.2" stroke={c} strokeWidth={w} fill="none" />
      <Rect x="13" y="13" width="7" height="7" rx="2.2" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  list: ({ c, w }) => (
    <>
      <S d="M9 6.5h11M9 12h11M9 17.5h11" c={c} w={w} />
      <Circle cx="4.6" cy="6.5" r="1.3" fill={c} />
      <Circle cx="4.6" cy="12" r="1.3" fill={c} />
      <Circle cx="4.6" cy="17.5" r="1.3" fill={c} />
    </>
  ),
  phone: ({ c, w }) => (
    <>
      <Rect x="6" y="2.6" width="12" height="18.8" rx="3" stroke={c} strokeWidth={w} fill="none" />
      <S d="M10.4 5.4h3.2" c={c} w={w} />
      <Circle cx="12" cy="18" r="1.2" fill={c} />
    </>
  ),
  folder: ({ c, w }) => <S d="M3.6 6.6a2 2 0 0 1 2-2h3.3l2.1 2.4h7.4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2v-11.4z" c={c} w={w} />,
  user: ({ c, w }) => (
    <>
      <Circle cx="12" cy="8.2" r="4" stroke={c} strokeWidth={w} fill="none" />
      <S d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0" c={c} w={w} />
    </>
  ),
  camera: ({ c, w }) => (
    <>
      <S d="M3.6 8.8a2 2 0 0 1 2-2h2.2l1.4-2.2h5.6l1.4 2.2h2.2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2v-9z" c={c} w={w} />
      <Circle cx="12" cy="13" r="3.6" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  image: ({ c, w }) => (
    <>
      <Rect x="3.6" y="4.8" width="16.8" height="14.4" rx="2.6" stroke={c} strokeWidth={w} fill="none" />
      <S d="M4 16.2l4.6-4.6 4 4 2.6-2.4 4.8 4.4" c={c} w={w} />
      <Circle cx="8.8" cy="9.4" r="1.5" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  globe: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="8.6" stroke={c} strokeWidth={w} fill="none" />
      <S d="M3.4 12h17.2M12 3.4c2.4 2.4 3.6 5.4 3.6 8.6s-1.2 6.2-3.6 8.6c-2.4-2.4-3.6-5.4-3.6-8.6S9.6 5.8 12 3.4z" c={c} w={w} />
    </>
  ),
  message: ({ c, w }) => <S d="M4 6.4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3.4v-3.4H6a2 2 0 0 1-2-2v-8z" c={c} w={w} />,
  card: ({ c, w }) => (
    <>
      <Rect x="3.4" y="5.6" width="17.2" height="12.8" rx="2.6" stroke={c} strokeWidth={w} fill="none" />
      <S d="M3.4 9.8h17.2M6.8 14.4h4" c={c} w={w} />
    </>
  ),
  pin: ({ c, w }) => (
    <>
      <S d="M12 21.4c4-4.2 6-7.6 6-10.4a6 6 0 1 0-12 0c0 2.8 2 6.2 6 10.4z" c={c} w={w} />
      <Circle cx="12" cy="10.6" r="2.4" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  wallet: ({ c, w }) => (
    <>
      <S d="M3.6 7.6a2 2 0 0 1 2-2h11.8a1.6 1.6 0 0 1 1.6 1.6v1.2M3.6 7.6v9.8a2 2 0 0 0 2 2h13a1.6 1.6 0 0 0 1.6-1.6v-6.4a1.6 1.6 0 0 0-1.6-1.6H5.6a2 2 0 0 1-2-2z" c={c} w={w} />
      <Circle cx="16.6" cy="13.4" r="1.3" fill={c} />
    </>
  ),

  /* ── challenge kinds ─────────────────────────────────────────── */
  math: ({ c, w }) => (
    <>
      <Rect x="3.8" y="3.8" width="16.4" height="16.4" rx="3" stroke={c} strokeWidth={w} fill="none" />
      <S d="M7.4 8.6h4M9.4 6.6v4M13 8.6h3.6M13 14.4h3.6M13 17h3.6M7.4 13.4l3.2 3.2M10.6 13.4l-3.2 3.2" c={c} w={w} />
    </>
  ),
  brainQuiz: ({ c, w }) => (
    <>
      <S d="M4 12.4a3.6 3.6 0 0 1 2-3.2 3.4 3.4 0 0 1 6-2.4 3.4 3.4 0 0 1 6 2.4 3.6 3.6 0 0 1 2 3.2c0 2-1.6 3.6-3.6 3.6H7.6C5.6 16 4 14.4 4 12.4z" c={c} w={w} />
      <S d="M9 19.4h6M12 16v3.4" c={c} w={w} />
    </>
  ),
  breathe: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="3.2" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="12" cy="12" r="7" stroke={c} strokeWidth={w * 0.7} fill="none" opacity={0.6} />
      <Circle cx="12" cy="12" r="10.4" stroke={c} strokeWidth={w * 0.55} fill="none" opacity={0.3} />
    </>
  ),
  activity: ({ c, w }) => (
    <>
      <S d="M2.8 12h2.4M18.8 12h2.4M12 12h-1.2" c={c} w={w} />
      <Rect x="5.2" y="8.2" width="3.2" height="7.6" rx="1.4" stroke={c} strokeWidth={w} fill="none" />
      <Rect x="15.6" y="8.2" width="3.2" height="7.6" rx="1.4" stroke={c} strokeWidth={w} fill="none" />
      <S d="M8.4 12h7.2" c={c} w={w} />
    </>
  ),

  /* ── theme marks ─────────────────────────────────────────────── */
  tower: ({ c, w }) => <S d="M12 2.6v18.8M12 2.6L6 21.4M12 2.6l6 18.8M8.4 14.4h7.2M7 18.4h10M4 21.4h16" c={c} w={w} />,
  leaf: ({ c, w }) => <S d="M20 4C10.6 4 4.6 8.4 4.6 15a5.4 5.4 0 0 0 5.4 5.4C16.6 20.4 20 13.4 20 4zM10 20.4C11.4 14 14.4 9.6 19 6.6" c={c} w={w} />,
  book: ({ c, w }) => <S d="M4 4.4h5.4A2.6 2.6 0 0 1 12 7v13a2.2 2.2 0 0 0-2.2-2.2H4V4.4zM20 4.4h-5.4A2.6 2.6 0 0 0 12 7v13a2.2 2.2 0 0 1 2.2-2.2H20V4.4z" c={c} w={w} />,
  mist: ({ c, w }) => <S d="M3.4 8h11.4M17.6 8h3M3.4 12h4M9.6 12h11M3.4 16h13.4M19.6 16h1" c={c} w={w} />,
  heart: ({ c, w }) => <S d="M12 20.4S3.6 15.4 3.6 9.6a4.8 4.8 0 0 1 8.4-3.2 4.8 4.8 0 0 1 8.4 3.2c0 5.8-8.4 10.8-8.4 10.8z" c={c} w={w} />,

  /* ── new icons ──────────────────────────────────────────────── */
  backspace: ({ c, w }) => (
    <>
      <S d="M4.4 12l5-6.4h10.2a1.4 1.4 0 0 1 1.4 1.4v10a1.4 1.4 0 0 1-1.4 1.4H9.4l-5-6.4z" c={c} w={w} />
      <S d="M13 9l4.6 6M17.6 9L13 15" c={c} w={w} />
    </>
  ),
  bolt: ({ c, w }) => <S d="M13.2 2.6L5 13.6h5.4L10.8 21.4 19 10.4h-5.4l-.4-7.8z" c={c} w={w} />,
  gift: ({ c, w }) => (
    <>
      <S d="M4.4 10h15.2v10H4.4z" c={c} w={w} />
      <S d="M12 10v10" c={c} w={w} />
      <S d="M4.4 13.6h15.2" c={c} w={w} />
      <S d="M12 10c-1.6-1.2-5-1.4-5-3.2A1.8 1.8 0 0 1 10.4 6.4c.8 0 1.4.6 1.6 3.6.2-3 1-3.6 1.6-3.6A1.8 1.8 0 0 1 17 6.8C17 8.6 13.6 8.8 12 10z" c={c} w={w} />
    </>
  ),
  rocket: ({ c, w }) => (
    <>
      <S d="M12 3c2.5 2.8 4.2 6.4 4.5 9.6l3.2 3.4-2.2 1.6-2.6-2c-.6 1.4-1.5 2.4-2.9 3-1.4-.6-2.3-1.6-2.9-3l-2.6 2-2.2-1.6 3.2-3.4c.3-3.2 2-6.8 4.5-9.6z" c={c} w={w} />
      <Circle cx="12" cy="9.4" r="2" stroke={c} strokeWidth={w} fill="none" />
      <S d="M8.4 16.4L6 20M15.6 16.4L18 20" c={c} w={w} />
    </>
  ),
  door: ({ c, w }) => (
    <>
      <Rect x="3.6" y="3.6" width="16.8" height="16.8" rx="2" stroke={c} strokeWidth={w} fill="none" />
      <Rect x="3.6" y="3.6" width="7.4" height="16.8" rx="2" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="9" cy="12" r="1.2" fill={c} />
    </>
  ),
  phoneOff: ({ c, w }) => (
    <>
      <Rect x="6" y="2.6" width="12" height="18.8" rx="3" stroke={c} strokeWidth={w} fill="none" />
      <S d="M10.4 5.4h3.2" c={c} w={w} />
      <Circle cx="12" cy="18" r="1.2" fill={c} />
      <S d="M4 4l16 16" c={c} w={w} />
    </>
  ),
};

export default function Icon({
  name,
  size = 20,
  color = '#FFFFFF',
  strokeWidth = 1.7,
  opacity,
}: {
  name: IconName;
  /** Box size in points. The grid scales, the stroke does not — pass a
   *  heavier strokeWidth for very small sizes if a mark disappears. */
  size?: number;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
}) {
  const draw = shapes[name];
  if (!draw) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" opacity={opacity}>
      {draw({ c: color, w: strokeWidth })}
    </Svg>
  );
}
