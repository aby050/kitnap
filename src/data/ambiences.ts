import { IconName } from '../ui/Icon';
import { ThemeKey } from './themes';
export { mediaFor } from './ambienceMedia';

/**
 * Focus rooms.
 *
 * A room is a reason to put the phone down, with a place to look while you do
 * it: the block runs, a loop plays, and the countdown is the only thing on
 * screen. It is deliberately NOT the "For you / Digital detox" preset shelf
 * this category ships — two carousels of timer presets with no relationship to
 * the user is exactly the interchangeable surface Byre was flagged for under
 * 4.3(a). Every room here is named for a reason a person already has, and each
 * one maps to the block-screen voice that reason picked.
 */
export type Ambience = {
  key: string;
  title: string;
  /** The reason, in the user's words — not a feature description. */
  intent: string;
  minutes: number;
  /** Which block-screen voice this room speaks in while it runs. */
  theme: ThemeKey;
  mark: IconName;
  /** Which band of the browse grid this sits in. Rooms are chosen by how much
   *  time a person has before they are chosen by mood, so length leads. */
  band: 'short' | 'medium' | 'long';
  /** Painted until (and behind) the loop: a three-stop wash sampled to sit in
   *  the same family as the room's footage, so a room with no media yet still
   *  reads as itself rather than as a missing asset. */
  wash: [string, string, string];
};

export const AMBIENCES: Ambience[] = [
  {
    key: 'breathe',
    title: 'Just breathe',
    intent: 'Five minutes. Nothing asked of you.',
    minutes: 5,
    theme: 'quiet',
    mark: 'breathe',
    band: 'short',
    wash: ['#16302E', '#2E5A56', '#7FA8A2'],
  },
  {
    key: 'meditate',
    title: 'Meditation',
    intent: 'Ten quiet minutes. Nothing to check.',
    minutes: 10,
    theme: 'quiet',
    mark: 'mist',
    band: 'short',
    wash: ['#2C4A38', '#7A8A6E', '#E8B9AE'],
  },
  {
    key: 'morning',
    title: 'First light',
    intent: 'Start your day before the phone does.',
    minutes: 20,
    theme: 'health',
    mark: 'sunrise',
    band: 'short',
    wash: ['#3A2418', '#9A5A24', '#E8A55A'],
  },
  {
    key: 'reading',
    title: 'Reading',
    intent: 'A chapter, not a feed.',
    minutes: 30,
    theme: 'learning',
    mark: 'book',
    band: 'medium',
    wash: ['#24331E', '#4E7038', '#A8C070'],
  },
  {
    key: 'think',
    title: 'Deep thinking',
    intent: 'One problem, no interruptions.',
    minutes: 45,
    theme: 'deepWork',
    mark: 'tower',
    band: 'medium',
    wash: ['#1A1A26', '#4A4458', '#C09A78'],
  },
  {
    key: 'winddown',
    title: 'Wind down',
    intent: 'Screens off before bed.',
    minutes: 45,
    theme: 'health',
    mark: 'moon',
    band: 'medium',
    wash: ['#2A2140', '#5A4670', '#C79BB4'],
  },
  {
    key: 'family',
    title: 'Family time',
    intent: "They're in the room. Be in it too.",
    minutes: 60,
    theme: 'presence',
    mark: 'home',
    band: 'medium',
    wash: ['#1E4A6E', '#3E86C0', '#8FC8E8'],
  },
  {
    key: 'study',
    title: 'Deep study',
    intent: 'Chapter-sized, phone in another room.',
    minutes: 90,
    theme: 'learning',
    mark: 'hourglass',
    band: 'long',
    wash: ['#1C2630', '#3A5468', '#8AA6B8'],
  },
  {
    key: 'peace',
    title: 'Peace',
    intent: "A long reset. Nothing's waiting.",
    minutes: 120,
    theme: 'quiet',
    mark: 'leaf',
    band: 'long',
    wash: ['#3E5E32', '#6E9456', '#AFCB8C'],
  },
  {
    key: 'night',
    title: 'Night',
    intent: 'Give tomorrow a head start.',
    minutes: 480,
    theme: 'health',
    mark: 'sun',
    band: 'long',
    wash: ['#0E1626', '#1E3050', '#4A6A96'],
  },
];

/** Section headings for the browse grid, in order. */
export const BANDS: { key: Ambience['band']; title: string; sub: string }[] = [
  { key: 'short', title: 'A few minutes', sub: "When you've only got a gap." },
  { key: 'medium', title: 'An hour or so', sub: 'Long enough to get somewhere.' },
  { key: 'long', title: 'A long stretch', sub: 'A whole evening, or a night.' },
];

export const inBand = (band: Ambience['band']) => AMBIENCES.filter((a) => a.band === band);

export const getAmbience = (key: string) =>
  AMBIENCES.find((a) => a.key === key) ?? AMBIENCES[0];


