import React from 'react';
import { Ionicons } from '@expo/vector-icons';

/**
 * App icons come from Ionicons (open source, MIT) via @expo/vector-icons.
 * The previous version drew every glyph by hand as SVG paths, which looked
 * uneven; names are kept so no call site changes.
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

const GLYPH: Record<IconName, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  grid: 'grid-outline',
  list: 'list-outline',
  timer: 'timer-outline',
  clock: 'time-outline',
  user: 'person-outline',
  settings: 'settings-outline',
  sliders: 'options-outline',
  search: 'search-outline',
  filter: 'funnel-outline',
  check: 'checkmark',
  checkCircle: 'checkmark-circle-outline',
  close: 'close',
  closeCircle: 'close-circle-outline',
  chevronLeft: 'chevron-back',
  chevronRight: 'chevron-forward',
  chevronDown: 'chevron-down',
  chevronUp: 'chevron-up',
  arrowRight: 'arrow-forward',
  arrowUpRight: 'arrow-up-outline',
  plus: 'add',
  minus: 'remove',
  more: 'ellipsis-horizontal',
  refresh: 'refresh',
  download: 'download-outline',
  edit: 'create-outline',
  trash: 'trash-outline',
  share: 'share-outline',
  info: 'information-circle-outline',
  help: 'help-circle-outline',
  alert: 'warning-outline',
  backspace: 'backspace-outline',
  shield: 'shield-outline',
  shieldOff: 'shield-half-outline',
  lock: 'lock-closed-outline',
  unlock: 'lock-open-outline',
  key: 'key-outline',
  eye: 'eye-outline',
  eyeOff: 'eye-off-outline',
  door: 'exit-outline',
  phone: 'phone-portrait-outline',
  phoneOff: 'close-circle-outline',
  hourglass: 'hourglass-outline',
  calendar: 'calendar-outline',
  moon: 'moon-outline',
  sun: 'sunny-outline',
  sunrise: 'partly-sunny-outline',
  leaf: 'leaf-outline',
  flame: 'flame-outline',
  heart: 'heart-outline',
  book: 'book-outline',
  mist: 'cloud-outline',
  tower: 'business-outline',
  play: 'play',
  pause: 'pause',
  stop: 'stop',
  skip: 'play-skip-forward',
  bell: 'notifications-outline',
  bellOff: 'notifications-off-outline',
  volume: 'volume-high-outline',
  volumeOff: 'volume-mute-outline',
  headphones: 'headset-outline',
  mic: 'mic-outline',
  target: 'locate-outline',
  pulse: 'pulse-outline',
  chart: 'stats-chart-outline',
  bars: 'bar-chart-outline',
  trendUp: 'trending-up-outline',
  trendDown: 'trending-down-outline',
  award: 'ribbon-outline',
  note: 'document-text-outline',
  quote: 'chatbox-ellipses-outline',
  bolt: 'flash-outline',
  gift: 'gift-outline',
  rocket: 'rocket-outline',
  camera: 'camera-outline',
  image: 'image-outline',
  globe: 'globe-outline',
  message: 'chatbubble-outline',
  card: 'card-outline',
  pin: 'pin-outline',
  wallet: 'wallet-outline',
  math: 'calculator-outline',
  brainQuiz: 'help-buoy-outline',
  breathe: 'cloud-outline',
  activity: 'pulse-outline',
};

export default function Icon({
  name,
  size = 20,
  color = '#FFFFFF',
  opacity,
}: {
  name: IconName;
  size?: number;
  color?: string;
  /** Accepted for compatibility with the old stroke-drawn set; unused. */
  strokeWidth?: number;
  opacity?: number;
}) {
  const glyph = GLYPH[name];
  if (!glyph) return null;
  return <Ionicons name={glyph} size={size} color={color} style={opacity != null ? { opacity } : undefined} />;
}
