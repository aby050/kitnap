import React from 'react';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

/**
 * Premium Icon System (SF Symbols & Lucide aesthetic)
 * 24×24 balanced grid, consistent optical weight, geometric harmony.
 */

export type IconName =
  // navigation & core
  | 'home'
  | 'grid'
  | 'list'
  | 'timer'
  | 'clock'
  | 'user'
  | 'settings'
  | 'sliders'
  | 'search'
  | 'filter'
  // status & chrome
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
  | 'refresh'
  | 'download'
  | 'edit'
  | 'trash'
  | 'share'
  | 'info'
  | 'help'
  | 'alert'
  | 'backspace'
  // blocking & security
  | 'shield'
  | 'shieldOff'
  | 'lock'
  | 'unlock'
  | 'key'
  | 'eye'
  | 'eyeOff'
  | 'door'
  | 'phone'
  | 'phoneOff'
  // time & nature
  | 'hourglass'
  | 'calendar'
  | 'moon'
  | 'sun'
  | 'sunrise'
  | 'leaf'
  | 'flame'
  | 'heart'
  | 'book'
  | 'mist'
  | 'tower'
  // controls
  | 'play'
  | 'pause'
  | 'stop'
  | 'skip'
  | 'bell'
  | 'bellOff'
  | 'volume'
  | 'volumeOff'
  | 'headphones'
  | 'mic'
  // metrics & badges
  | 'target'
  | 'pulse'
  | 'chart'
  | 'bars'
  | 'trendUp'
  | 'trendDown'
  | 'award'
  | 'note'
  | 'quote'
  | 'bolt'
  | 'gift'
  | 'rocket'
  | 'camera'
  | 'image'
  | 'globe'
  | 'message'
  | 'card'
  | 'pin'
  | 'wallet'
  | 'math'
  | 'brainQuiz'
  | 'breathe'
  | 'activity';

type Geo = { c: string; w: number };

const S = ({ d, c, w, cap = 'round' }: { d: string; c: string; w: number; cap?: 'round' | 'butt' | 'square' }) => (
  <Path d={d} stroke={c} strokeWidth={w} strokeLinecap={cap} strokeLinejoin="round" fill="none" />
);

const F = ({ d, c }: { d: string; c: string }) => <Path d={d} fill={c} />;

const shapes: Record<IconName, (g: Geo) => React.ReactNode> = {
  /* ── Navigation & Core ──────────────────────────────────────── */
  home: ({ c, w }) => (
    <>
      <Path
        d="M3.5 10.5L12 3.5L20.5 10.5V19.5C20.5 20.05 20.05 20.5 19.5 20.5H15.5V14.5C15.5 13.95 15.05 13.5 14.5 13.5H9.5C8.95 13.5 8.5 13.95 8.5 14.5V20.5H4.5C3.95 20.5 3.5 20.05 3.5 19.5V10.5Z"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  grid: ({ c, w }) => (
    <>
      <Rect x="3.5" y="3.5" width="7" height="7" rx="2.2" stroke={c} strokeWidth={w} fill="none" />
      <Rect x="13.5" y="3.5" width="7" height="7" rx="2.2" stroke={c} strokeWidth={w} fill="none" />
      <Rect x="3.5" y="13.5" width="7" height="7" rx="2.2" stroke={c} strokeWidth={w} fill="none" />
      <Rect x="13.5" y="13.5" width="7" height="7" rx="2.2" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  list: ({ c, w }) => (
    <>
      <S d="M8.5 6.5H20.5M8.5 12H20.5M8.5 17.5H20.5" c={c} w={w} />
      <Circle cx="4.5" cy="6.5" r="1.3" fill={c} />
      <Circle cx="4.5" cy="12" r="1.3" fill={c} />
      <Circle cx="4.5" cy="17.5" r="1.3" fill={c} />
    </>
  ),
  timer: ({ c, w }) => (
    <>
      <Circle cx="12" cy="13.5" r="7.5" stroke={c} strokeWidth={w} fill="none" />
      <S d="M12 9.5V13.5L14.8 15.2M9.5 2.5H14.5M12 2.5V6" c={c} w={w} />
    </>
  ),
  clock: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="8.5" stroke={c} strokeWidth={w} fill="none" />
      <S d="M12 7.5V12L15.2 14" c={c} w={w} />
    </>
  ),
  user: ({ c, w }) => (
    <>
      <Circle cx="12" cy="8" r="4" stroke={c} strokeWidth={w} fill="none" />
      <Path d="M4.5 20C4.5 16.13 7.86 13 12 13C16.14 13 19.5 16.13 19.5 20" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),
  settings: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="3.2" stroke={c} strokeWidth={w} fill="none" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={c}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  sliders: ({ c, w }) => (
    <>
      <S d="M4 7H14M18 7H20M4 17H6M10 17H20" c={c} w={w} />
      <Circle cx="16" cy="7" r="2.2" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="8" cy="17" r="2.2" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  search: ({ c, w }) => (
    <>
      <Circle cx="11" cy="11" r="6.8" stroke={c} strokeWidth={w} fill="none" />
      <S d="M16 16L20.5 20.5" c={c} w={w} />
    </>
  ),
  filter: ({ c, w }) => <S d="M3.5 5.5H20.5L14 13.5V19.5L10 17.5V13.5L3.5 5.5Z" c={c} w={w} />,

  /* ── Status & Chrome ────────────────────────────────────────── */
  check: ({ c, w }) => <S d="M4.5 12.5L9.5 17.5L19.5 7" c={c} w={w + 0.3} />,
  checkCircle: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="8.8" stroke={c} strokeWidth={w} fill="none" />
      <S d="M8.2 12.2L10.8 14.8L15.8 9.5" c={c} w={w + 0.2} />
    </>
  ),
  close: ({ c, w }) => <S d="M6 6L18 18M18 6L6 18" c={c} w={w} />,
  closeCircle: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="8.8" stroke={c} strokeWidth={w} fill="none" />
      <S d="M9 9L15 15M15 9L9 15" c={c} w={w} />
    </>
  ),
  chevronLeft: ({ c, w }) => <S d="M14.5 5.5L8 12L14.5 18.5" c={c} w={w + 0.2} />,
  chevronRight: ({ c, w }) => <S d="M9.5 5.5L16 12L9.5 18.5" c={c} w={w + 0.2} />,
  chevronDown: ({ c, w }) => <S d="M5.5 9.5L12 16L18.5 9.5" c={c} w={w + 0.2} />,
  chevronUp: ({ c, w }) => <S d="M5.5 15.5L12 9L18.5 15.5" c={c} w={w + 0.2} />,
  arrowRight: ({ c, w }) => <S d="M4.5 12H19.5M13.5 6L19.5 12L13.5 18" c={c} w={w} />,
  arrowUpRight: ({ c, w }) => <S d="M6.5 17.5L17.5 6.5M8 6.5H17.5V16" c={c} w={w} />,
  plus: ({ c, w }) => <S d="M12 4.5V19.5M4.5 12H19.5" c={c} w={w} />,
  minus: ({ c, w }) => <S d="M4.5 12H19.5" c={c} w={w} />,
  more: ({ c }) => (
    <>
      <Circle cx="5" cy="12" r="1.6" fill={c} />
      <Circle cx="12" cy="12" r="1.6" fill={c} />
      <Circle cx="19" cy="12" r="1.6" fill={c} />
    </>
  ),
  refresh: ({ c, w }) => (
    <>
      <Path d="M20 12A8 8 0 1 1 17.6 6.4L20 4V9H15" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  download: ({ c, w }) => <S d="M12 3.5V14.5M7.5 10L12 14.5L16.5 10M4.5 19.5H19.5" c={c} w={w} />,
  edit: ({ c, w }) => (
    <>
      <Path d="M16.5 3.5A2.12 2.12 0 0 1 19.5 6.5L7 19H3.5V15.5L16.5 3.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  trash: ({ c, w }) => (
    <>
      <S d="M3.5 6.5H20.5M9 6.5V4C9 3.45 9.45 3 10 3H14C14.55 3 15 3.45 15 4V6.5M5.5 6.5L6.8 19.2C6.9 19.9 7.5 20.5 8.2 20.5H15.8C16.5 20.5 17.1 19.9 17.2 19.2L18.5 6.5" c={c} w={w} />
      <S d="M10 10.5V16.5M14 10.5V16.5" c={c} w={w} />
    </>
  ),
  share: ({ c, w }) => (
    <>
      <S d="M12 3.5V14.5M7.5 7.5L12 3.5L16.5 7.5M4.5 13.5V19.5C4.5 20.05 4.95 20.5 5.5 20.5H18.5C19.05 20.5 19.5 20.05 19.5 19.5V13.5" c={c} w={w} />
    </>
  ),
  info: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="8.8" stroke={c} strokeWidth={w} fill="none" />
      <S d="M12 11V16" c={c} w={w} />
      <Circle cx="12" cy="7.8" r="1.1" fill={c} />
    </>
  ),
  help: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="8.8" stroke={c} strokeWidth={w} fill="none" />
      <Path d="M9.5 9A2.5 2.5 0 0 1 14 10.5C14 12 12.5 12.5 12 14" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Circle cx="12" cy="16.5" r="1.1" fill={c} />
    </>
  ),
  alert: ({ c, w }) => (
    <>
      <Path d="M12 3L21.5 19.5H2.5L12 3Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <S d="M12 9.5V14" c={c} w={w} />
      <Circle cx="12" cy="16.8" r="1.1" fill={c} />
    </>
  ),
  backspace: ({ c, w }) => (
    <>
      <Path d="M4 12L8.8 5.5H20.5C21.05 5.5 21.5 5.95 21.5 6.5V17.5C21.5 18.05 21.05 18.5 20.5 18.5H8.8L4 12Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <S d="M12.5 9.5L16.5 14.5M16.5 9.5L12.5 14.5" c={c} w={w} />
    </>
  ),

  /* ── Blocking & Security ────────────────────────────────────── */
  shield: ({ c, w }) => (
    <Path
      d="M12 3L19.5 6.2V11.5C19.5 16.2 16.3 19.6 12 21C7.7 19.6 4.5 16.2 4.5 11.5V6.2L12 3Z"
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  shieldOff: ({ c, w }) => (
    <>
      <Path d="M12 3L19.5 6.2V11.5C19.5 16.2 16.3 19.6 12 21C7.7 19.6 4.5 16.2 4.5 11.5V6.2L12 3Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <S d="M3.5 3.5L20.5 20.5" c={c} w={w} />
    </>
  ),
  lock: ({ c, w }) => (
    <>
      <Path d="M7 10V7.5C7 4.74 9.24 2.5 12 2.5C14.76 2.5 17 4.74 17 7.5V10" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Rect x="4.5" y="10" width="15" height="11" rx="3" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="12" cy="15" r="1.6" fill={c} />
    </>
  ),
  unlock: ({ c, w }) => (
    <>
      <Path d="M7 10V7.5C7 4.74 9.24 2.5 12 2.5C14.76 2.5 17 4.74 17 7.5" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Rect x="4.5" y="10" width="15" height="11" rx="3" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="12" cy="15" r="1.6" fill={c} />
    </>
  ),
  key: ({ c, w }) => (
    <>
      <Circle cx="7.5" cy="15.5" r="4.2" stroke={c} strokeWidth={w} fill="none" />
      <S d="M10.5 12.5L20.5 2.5M17.5 2.5H20.5V5.5M14.5 5.5L17.5 8.5" c={c} w={w} />
    </>
  ),
  eye: ({ c, w }) => (
    <>
      <Path d="M2.5 12C2.5 12 6 5.5 12 5.5C18 5.5 21.5 12 21.5 12C21.5 12 18 18.5 12 18.5C6 18.5 2.5 12 2.5 12Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx="12" cy="12" r="3.2" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  eyeOff: ({ c, w }) => (
    <>
      <Path d="M4 8.5C2.8 10 2.5 12 2.5 12C2.5 12 6 18.5 12 18.5C14 18.5 15.8 17.8 17.3 16.7M8.5 6C9.6 5.7 10.8 5.5 12 5.5C18 5.5 21.5 12 21.5 12C21.5 12 20.3 14.2 18.2 16" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <S d="M3 3L21 21" c={c} w={w} />
    </>
  ),
  door: ({ c, w }) => (
    <>
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={c} strokeWidth={w} fill="none" />
      <Path d="M4 3L13 5V19L4 21V3Z" stroke={c} strokeWidth={w} strokeLinejoin="round" fill="none" />
      <Circle cx="10.5" cy="12" r="1.2" fill={c} />
    </>
  ),
  phone: ({ c, w }) => (
    <>
      <Rect x="6" y="2.5" width="12" height="19" rx="3" stroke={c} strokeWidth={w} fill="none" />
      <S d="M10.5 5.5H13.5" c={c} w={w} />
      <Circle cx="12" cy="18" r="1.1" fill={c} />
    </>
  ),
  phoneOff: ({ c, w }) => (
    <>
      <Rect x="6" y="2.5" width="12" height="19" rx="3" stroke={c} strokeWidth={w} fill="none" />
      <S d="M3.5 3.5L20.5 20.5" c={c} w={w} />
    </>
  ),

  /* ── Time & Nature ──────────────────────────────────────────── */
  hourglass: ({ c, w }) => <S d="M6 3H18M6 21H18M6.5 3.5L12 12L6.5 20.5M17.5 3.5L12 12L17.5 20.5" c={c} w={w} />,
  calendar: ({ c, w }) => (
    <>
      <Rect x="3.5" y="4.5" width="17" height="16" rx="3" stroke={c} strokeWidth={w} fill="none" />
      <S d="M3.5 9.5H20.5M8 2.5V5.5M16 2.5V5.5" c={c} w={w} />
    </>
  ),
  moon: ({ c, w }) => <Path d="M20.5 13.8A8.5 8.5 0 0 1 10.2 3.5A8.5 8.5 0 1 0 20.5 13.8Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  sun: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="4.8" stroke={c} strokeWidth={w} fill="none" />
      <S d="M12 2.5V4.5M12 19.5V21.5M4.5 4.5L6 6M18 18L19.5 19.5M2.5 12H4.5M19.5 12H21.5M4.5 19.5L6 18M18 6L19.5 4.5" c={c} w={w} />
    </>
  ),
  sunrise: ({ c, w }) => (
    <>
      <Path d="M6.5 15.5A5.5 5.5 0 0 1 17.5 15.5M2.5 19.5H21.5M12 2.5V5.5M4.5 6.5L6.5 8.5M19.5 6.5L17.5 8.5" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),
  leaf: ({ c, w }) => (
    <Path
      d="M20.5 3.5C10.5 3.5 4.5 8.5 4.5 15.5C4.5 18.5 7 20.5 10 20.5C17 20.5 20.5 13.5 20.5 3.5ZM9.5 20.5C11 14 14.5 9.5 19.5 6.5"
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  flame: ({ c }) => (
    <Path
      d="M12 2C15.2 5.5 17.5 8.2 18 11C18.8 14.8 16 18.5 12 22C8 18.5 5.2 14.8 6 11C6.5 8.2 8.8 5.5 12 2ZM12 13C10.8 13 9.8 14.2 10.2 15.8C10.5 17.2 12 18.8 12 18.8C12 18.8 13.5 17.2 13.8 15.8C14.2 14.2 13.2 13 12 13Z"
      fill={c}
    />
  ),
  heart: ({ c, w }) => (
    <Path
      d="M12 20.5S3.5 15 3.5 9C3.5 5.5 6.2 3.5 9.2 3.5C10.8 3.5 12 4.5 12 4.5C12 4.5 13.2 3.5 14.8 3.5C17.8 3.5 20.5 5.5 20.5 9C20.5 15 12 20.5 12 20.5Z"
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  book: ({ c, w }) => (
    <>
      <Path d="M4 4.5H9C10.66 4.5 12 5.84 12 7.5V20.5C12 19.4 10.66 18.5 9 18.5H4V4.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M20 4.5H15C13.34 4.5 12 5.84 12 7.5V20.5C12 19.4 13.34 18.5 15 18.5H20V4.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  mist: ({ c, w }) => <S d="M3.5 8H14.5M18.5 8H20.5M3.5 12H7.5M11.5 12H20.5M3.5 16H15.5M19.5 16H20.5" c={c} w={w} />,
  tower: ({ c, w }) => (
    <>
      <Path d="M12 2.5V21.5M12 2.5L5.5 21.5M12 2.5L18.5 21.5M8 14.5H16M6.5 18.5H17.5M3.5 21.5H20.5" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),

  /* ── Controls ───────────────────────────────────────────────── */
  play: ({ c }) => <Path d="M7.5 4.8A1.2 1.2 0 0 1 9.3 3.8L18.8 10.8A1.2 1.2 0 0 1 18.8 13.2L9.3 20.2A1.2 1.2 0 0 1 7.5 19.2V4.8Z" fill={c} />,
  pause: ({ c }) => (
    <>
      <Rect x="6.5" y="4.5" width="3.5" height="15" rx="1.6" fill={c} />
      <Rect x="14" y="4.5" width="3.5" height="15" rx="1.6" fill={c} />
    </>
  ),
  stop: ({ c }) => <Rect x="5.5" y="5.5" width="13" height="13" rx="2.5" fill={c} />,
  skip: ({ c, w }) => (
    <>
      <Path d="M5.5 5.5L14.5 12L5.5 18.5V5.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <S d="M18.5 5.5V18.5" c={c} w={w} />
    </>
  ),
  bell: ({ c, w }) => (
    <>
      <Path d="M18 8.5C18 5.2 15.3 2.5 12 2.5C8.7 2.5 6 5.2 6 8.5C6 14 3.5 16.5 3.5 16.5H20.5C20.5 16.5 18 14 18 8.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M10 19.5C10.5 20.7 11.5 21.5 12 21.5C12.5 21.5 13.5 20.7 14 19.5" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),
  bellOff: ({ c, w }) => (
    <>
      <Path d="M18 8.5C18 5.2 15.3 2.5 12 2.5C8.7 2.5 6 5.2 6 8.5C6 14 3.5 16.5 3.5 16.5H20.5C20.5 16.5 18 14 18 8.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <S d="M3.5 3.5L20.5 20.5" c={c} w={w} />
    </>
  ),
  volume: ({ c, w }) => (
    <>
      <Path d="M4 9.5H7.5L12 5.5V18.5L7.5 14.5H4V9.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M15.5 9A4.5 4.5 0 0 1 15.5 15M18.5 6.5A8.5 8.5 0 0 1 18.5 17.5" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),
  volumeOff: ({ c, w }) => (
    <>
      <Path d="M4 9.5H7.5L12 5.5V18.5L7.5 14.5H4V9.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <S d="M16 10L20 14M20 10L16 14" c={c} w={w} />
    </>
  ),
  headphones: ({ c, w }) => (
    <>
      <Path d="M3.5 14V11.5C3.5 6.8 7.3 3 12 3C16.7 3 20.5 6.8 20.5 11.5V14" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Rect x="2.5" y="13.5" width="4" height="6.5" rx="2" stroke={c} strokeWidth={w} fill="none" />
      <Rect x="17.5" y="13.5" width="4" height="6.5" rx="2" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  mic: ({ c, w }) => (
    <>
      <Rect x="9" y="2.5" width="6" height="11" rx="3" stroke={c} strokeWidth={w} fill="none" />
      <Path d="M5.5 10.5C5.5 14.1 8.4 17 12 17C15.6 17 18.5 14.1 18.5 10.5M12 17V21.5M8 21.5H16" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),

  /* ── Metrics & Badges ───────────────────────────────────────── */
  target: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="8.5" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="12" cy="12" r="4.5" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="12" cy="12" r="1.5" fill={c} />
    </>
  ),
  pulse: ({ c, w }) => <Path d="M2.5 12H6L8.5 5.5L12 18.5L15 8.5L17.5 12H21.5" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  chart: ({ c, w }) => <Path d="M3.5 3.5V20.5H20.5M7.5 15.5L11.5 11.5L14.5 14.5L19.5 7.5" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  bars: ({ c, w }) => <S d="M5.5 20V12M12 20V4M18.5 20V8" c={c} w={w + 0.3} />,
  trendUp: ({ c, w }) => <Path d="M3.5 17.5L9.5 11.5L13.5 15.5L20.5 7.5M15.5 7.5H20.5V12.5" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  trendDown: ({ c, w }) => <Path d="M3.5 6.5L9.5 12.5L13.5 8.5L20.5 16.5M15.5 16.5H20.5V11.5" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  award: ({ c, w }) => (
    <>
      <Circle cx="12" cy="9.5" r="5.5" stroke={c} strokeWidth={w} fill="none" />
      <Path d="M8.5 14L7 21L12 18L17 21L15.5 14" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  note: ({ c, w }) => (
    <>
      <Path d="M5.5 3.5H14.5L19.5 8.5V20.5H5.5V3.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M14.5 3.5V8.5H19.5M9.5 13H15.5M9.5 16.5H13.5" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),
  quote: ({ c, w }) => (
    <>
      <Path d="M9.5 6.5C6.7 8 5 10.5 5 13.5C5 15.8 6.5 17.5 8.5 17.5C10.2 17.5 11.5 16.2 11.5 14.5C11.5 12.8 10.2 11.5 8.5 11.5C8.2 11.5 8 11.5 7.8 11.6C8.2 10 9.2 8.5 11 7.5M19 6.5C16.2 8 14.5 10.5 14.5 13.5C14.5 15.8 16 17.5 18 17.5C19.7 17.5 21 16.2 21 14.5C21 12.8 19.7 11.5 18 11.5C17.7 11.5 17.5 11.5 17.3 11.6C17.7 10 18.7 8.5 20.5 7.5" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  bolt: ({ c, w }) => <Path d="M13 2.5L4.5 13.5H11.5L10.5 21.5L19.5 10.5H12.5L13 2.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />,
  gift: ({ c, w }) => (
    <>
      <Rect x="4" y="9.5" width="16" height="11" rx="2" stroke={c} strokeWidth={w} fill="none" />
      <S d="M12 9.5V20.5M4 13.5H20" c={c} w={w} />
      <Path d="M12 9.5C10.5 8.2 7 8 7 6.2C7 4.5 8.5 4.5 10 5.8C11.2 6.8 12 9.5 12 9.5ZM12 9.5C13.5 8.2 17 8 17 6.2C17 4.5 15.5 4.5 14 5.8C12.8 6.8 12 9.5 12 9.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
    </>
  ),
  rocket: ({ c, w }) => (
    <>
      <Path d="M12 2.5C15 5.5 17 9 17.5 12.5L20.5 15.5L18.5 17L16 15C15.2 16.5 14.2 17.5 12.5 18C10.8 17.5 9.8 16.5 9 15L6.5 17L4.5 15.5L7.5 12.5C8 9 10 5.5 12 2.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx="12" cy="9.5" r="2" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  camera: ({ c, w }) => (
    <>
      <Path d="M3.5 8.5A2 2 0 0 1 5.5 6.5H8L9.5 4.5H14.5L16 6.5H18.5A2 2 0 0 1 20.5 8.5V18.5A2 2 0 0 1 18.5 20.5H5.5A2 2 0 0 1 3.5 18.5V8.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx="12" cy="13.5" r="3.5" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  image: ({ c, w }) => (
    <>
      <Rect x="3.5" y="4.5" width="17" height="15" rx="3" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="8.5" cy="9.5" r="1.6" fill={c} />
      <Path d="M4 16.5L8.5 12L12.5 16L15.5 13L20 17.5" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  globe: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="8.8" stroke={c} strokeWidth={w} fill="none" />
      <Path d="M3.2 12H20.8M12 3.2C14.5 5.7 15.8 8.8 15.8 12C15.8 15.2 14.5 18.3 12 20.8C9.5 18.3 8.2 15.2 8.2 12C8.2 8.8 9.5 5.7 12 3.2Z" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  message: ({ c, w }) => (
    <Path
      d="M4 6.5A2.5 2.5 0 0 1 6.5 4H17.5A2.5 2.5 0 0 1 20 6.5V14.5A2.5 2.5 0 0 1 17.5 17H9L4.5 20.5V6.5Z"
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  card: ({ c, w }) => (
    <>
      <Rect x="3.5" y="5.5" width="17" height="13" rx="2.8" stroke={c} strokeWidth={w} fill="none" />
      <S d="M3.5 10H20.5M7 14.5H11" c={c} w={w} />
    </>
  ),
  pin: ({ c, w }) => (
    <>
      <Path d="M12 21.5C16 17.5 18 14 18 10.5A6 6 0 1 0 6 10.5C6 14 8 17.5 12 21.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />
      <Circle cx="12" cy="10.5" r="2.2" stroke={c} strokeWidth={w} fill="none" />
    </>
  ),
  wallet: ({ c, w }) => (
    <>
      <Path d="M4 7.5A2 2 0 0 1 6 5.5H18C18.8 5.5 19.5 6.2 19.5 7V8M4 7.5V18.5C4 19.6 4.9 20.5 6 20.5H18C19.1 20.5 20 19.6 20 18.5V11.5C20 10.4 19.1 9.5 18 9.5H6C4.9 9.5 4 8.6 4 7.5Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx="16" cy="15" r="1.3" fill={c} />
    </>
  ),
  math: ({ c, w }) => (
    <>
      <Rect x="3.5" y="3.5" width="17" height="17" rx="3.2" stroke={c} strokeWidth={w} fill="none" />
      <S d="M7 8.5H11M9 6.5V10.5M13.5 8.5H17M13.5 14H17M13.5 16.5H17M7 13.5L10.5 17M10.5 13.5L7 17" c={c} w={w} />
    </>
  ),
  brainQuiz: ({ c, w }) => (
    <>
      <Path d="M4 12C4 9.8 5.8 8 8 8C8.5 8 9 8.1 9.4 8.3C10 6.4 11.8 5 14 5C16.8 5 19 7.2 19 10C19.6 10.4 20 11.2 20 12C20 13.3 19 14.4 17.8 14.5C17.4 16.5 15.6 18 13.5 18H8C5.8 18 4 16.2 4 14V12Z" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <S d="M9 19.5H15M12 18V21.5" c={c} w={w} />
    </>
  ),
  breathe: ({ c, w }) => (
    <>
      <Circle cx="12" cy="12" r="3.2" stroke={c} strokeWidth={w} fill="none" />
      <Circle cx="12" cy="12" r="6.8" stroke={c} strokeWidth={w * 0.75} fill="none" opacity={0.6} />
      <Circle cx="12" cy="12" r="10.2" stroke={c} strokeWidth={w * 0.55} fill="none" opacity={0.3} />
    </>
  ),
  activity: ({ c, w }) => (
    <>
      <Path d="M2.5 12H6.5L9 6.5L12 17.5L15 9.5L17.5 12H21.5" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
