import { ThemeKey } from '../data/themes';

/** Nothing ever dies. Landmarks, once built, are permanent — and they survive a
 *  theme change, because punishing growth would be absurd. */
export type Landmark = {
  id: string;
  name: string;
  /** Cumulative hours reclaimed required to raise it. */
  atHours: number;
  blurb: string;
  glyph: string;
  /** Normalised position on the island, 0–1. */
  x: number;
  y: number;
};

export const LANDMARKS: Landmark[] = [
  { id: 'cairn', name: 'The First Cairn', atHours: 1, blurb: 'You stopped once. That was the hard part.', glyph: '🪨', x: 0.5, y: 0.62 },
  { id: 'path', name: 'The Worn Path', atHours: 4, blurb: 'Four hours back. A route is forming.', glyph: '🛤', x: 0.3, y: 0.68 },
  { id: 'grove', name: 'The Grove', atHours: 10, blurb: 'Ten hours. Something is growing here.', glyph: '🌳', x: 0.7, y: 0.58 },
  { id: 'well', name: 'The Deep Well', atHours: 20, blurb: 'Twenty hours. You are drawing from somewhere real.', glyph: '⛲', x: 0.22, y: 0.54 },
  { id: 'bridge', name: 'The Long Bridge', atHours: 35, blurb: 'Thirty-five hours. The gap is crossable now.', glyph: '🌉', x: 0.62, y: 0.45 },
  { id: 'tower', name: 'The Watchtower', atHours: 55, blurb: 'You can see the whole day from up here.', glyph: '🗼', x: 0.44, y: 0.36 },
  { id: 'orchard', name: 'The Orchard', atHours: 80, blurb: 'Eighty hours. It feeds you back now.', glyph: '🍎', x: 0.78, y: 0.42 },
  { id: 'library', name: 'The Quiet Library', atHours: 110, blurb: 'What you did instead is written down here.', glyph: '📖', x: 0.16, y: 0.38 },
  { id: 'observatory', name: 'The Observatory', atHours: 150, blurb: 'You stopped looking down.', glyph: '🔭', x: 0.55, y: 0.24 },
  { id: 'harbour', name: 'The Harbour', atHours: 200, blurb: 'Two hundred hours. Things arrive here now.', glyph: '⚓', x: 0.32, y: 0.28 },
  { id: 'beacon', name: 'The Beacon', atHours: 280, blurb: 'Other people can see this one.', glyph: '🔆', x: 0.7, y: 0.18 },
  { id: 'summit', name: 'The Summit', atHours: 400, blurb: 'You built a year of evenings into a mountain.', glyph: '⛰', x: 0.46, y: 0.12 },
];

export type Biome = { id: string; name: string; atDays: number; blurb: string };

export const BIOMES: Biome[] = [
  { id: 'shore', name: 'The Shore', atDays: 0, blurb: 'Where everyone starts.' },
  { id: 'highlands', name: 'The Highlands', atDays: 30, blurb: 'Opens after a full month.' },
  { id: 'wetlands', name: 'The Wetlands', atDays: 90, blurb: 'A season of consistency.' },
  { id: 'ridge', name: 'The Far Ridge', atDays: 180, blurb: 'Half a year of your evenings.' },
];

/** Weather reflects the day, not a score. A bad day is overcast, never dead. */
export type Weather = 'clear' | 'fair' | 'overcast' | 'rain' | 'night';

export function weatherFor(reclaimedToday: number, unlocksToday: number, hour: number): Weather {
  if (hour >= 21 || hour < 6) return 'night';
  if (unlocksToday >= 5) return 'rain';
  if (unlocksToday >= 3) return 'overcast';
  if (reclaimedToday >= 60) return 'clear';
  return 'fair';
}

export const WEATHER_COPY: Record<Weather, string> = {
  clear: 'Clear over the island.',
  fair: 'Fair. The light is holding.',
  overcast: 'Overcast. It passes.',
  rain: 'Rain today. Nothing here dies in the rain.',
  night: 'Night. The island keeps working while you sleep.',
};

/** Hours reclaimed, translated into things a person actually recognises. */
export const LEDGER_UNITS = [
  { per: 1.5, label: 'films you could have watched', glyph: '🎬' },
  { per: 0.75, label: 'proper walks', glyph: '🚶' },
  { per: 6, label: 'books, at average reading pace', glyph: '📚' },
  { per: 0.5, label: 'unhurried meals with someone', glyph: '🍽' },
  { per: 8, label: 'full nights of sleep', glyph: '😴' },
];

export type SeasonEvent = {
  id: string;
  name: string;
  window: string;
  blurb: string;
  glyph: string;
  rare?: boolean;
};

export const EVENTS: SeasonEvent[] = [
  { id: 'lowtide', name: 'Low Tide', window: 'Ends in 3 days', blurb: 'The shore is walkable. Reclaim 2h to find what washed up.', glyph: '🐚' },
  { id: 'meteor', name: 'Meteor Night', window: 'In 6 days · one night only', blurb: 'Visible only if the island is clear that evening.', glyph: '☄️', rare: true },
  { id: 'bloom', name: 'First Bloom', window: 'Next month', blurb: 'The grove flowers once a season. You cannot buy this one.', glyph: '🌸' },
  { id: 'aurora', name: 'Aurora', window: 'Rare · unannounced', blurb: 'Appears for people on a long quiet streak. Nobody knows when.', glyph: '🌌', rare: true },
];

/** Theme re-skins the world; the architecture underneath persists.
 *  sky: zenith → horizon (3 stops) · sun: the glow disc colour · land: lit → shadow
 *  landHigh: warm rim-light catching the ridge · water: base → far shimmer */
export type WorldPalette = {
  sky: [string, string, string];
  sun: string;
  land: [string, string];
  landHigh: string;
  water: [string, string];
};

export const WORLD_PALETTES: Record<ThemeKey, WorldPalette> = {
  deepWork: {
    sky: ['#0a1c26', '#153a4a', '#2c6478'],
    sun: '#8fe0e8',
    land: ['#2c5a6e', '#0c2029'],
    landHigh: '#7fd4e0',
    water: ['#123645', '#0a1e28'],
  },
  health: {
    sky: ['#0a0e24', '#181f4a', '#333a7a'],
    sun: '#c9b6ff',
    land: ['#333a72', '#12152e'],
    landHigh: '#a99bff',
    water: ['#1a2050', '#0c0f28'],
  },
  presence: {
    sky: ['#160d06', '#3a2414', '#7a4c26'],
    sun: '#ffcf8a',
    land: ['#5a3d24', '#1c1108'],
    landHigh: '#ffb870',
    water: ['#33200f', '#160c05'],
  },
  craft: {
    sky: ['#06150e', '#12351f', '#2c6a3c'],
    sun: '#b8f2a0',
    land: ['#2c5c3a', '#0b1f13'],
    landHigh: '#9be88a',
    water: ['#123a24', '#081f13'],
  },
  learning: {
    sky: ['#0c0a1e', '#231c47', '#463a86'],
    sun: '#b6a4ff',
    land: ['#3a3268', '#141026'],
    landHigh: '#a08cff',
    water: ['#201a48', '#0e0c22'],
  },
  quiet: {
    sky: ['#0a0a0a', '#1c1c1c', '#3a3a3a'],
    sun: '#e8e8e8',
    land: ['#3a3a3a', '#131313'],
    landHigh: '#c9c9c9',
    water: ['#1e1e1e', '#0a0a0a'],
  },
};
