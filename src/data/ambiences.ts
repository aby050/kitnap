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
 * the user is exactly the interchangeable surface Kitnap was flagged for under
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
    key: 'think',
    title: 'Deep work',
    intent: 'Three hours on one thing, no interruptions.',
    minutes: 180,
    theme: 'deepWork',
    mark: 'tower',
    band: 'long',
    wash: ['#1A1A26', '#4A4458', '#C09A78'],
  },
  {
    key: 'study',
    title: 'Study block',
    intent: 'Five hours, phone in another room.',
    minutes: 300,
    theme: 'learning',
    mark: 'hourglass',
    band: 'long',
    wash: ['#1C2630', '#3A5468', '#8AA6B8'],
  },
  {
    key: 'morning',
    title: 'Work day',
    intent: 'Eight hours. Finish the day before the phone does.',
    minutes: 480,
    theme: 'deepWork',
    mark: 'sunrise',
    band: 'long',
    wash: ['#3A2418', '#9A5A24', '#E8A55A'],
  },
  {
    key: 'peace',
    title: 'Long reset',
    intent: 'Twelve hours. Nothing is waiting for you.',
    minutes: 720,
    theme: 'quiet',
    mark: 'leaf',
    band: 'long',
    wash: ['#3E5E32', '#6E9456', '#AFCB8C'],
  },
  {
    key: 'night',
    title: 'One full day',
    intent: 'Sunrise to sunrise, phone down.',
    minutes: 1440,
    theme: 'health',
    mark: 'sun',
    band: 'long',
    wash: ['#0E1626', '#1E3050', '#4A6A96'],
  },
  {
    key: 'winddown',
    title: 'Weekend reset',
    intent: 'Three days away from the feed.',
    minutes: 4320,
    theme: 'presence',
    mark: 'moon',
    band: 'long',
    wash: ['#2A2140', '#5A4670', '#C79BB4'],
  },
];

/** One band: every room is a long block. A shelf of five-minute rooms made
 *  the app a meditation timer; the point here is a real stretch away. */
export const BANDS: { key: Ambience['band']; title: string; sub: string }[] = [
  { key: 'long', title: 'Long blocks', sub: 'Pick a length, then put the phone down.' },
];

export const inBand = (band: Ambience['band']) => AMBIENCES.filter((a) => a.band === band);

export const getAmbience = (key: string) =>
  AMBIENCES.find((a) => a.key === key) ?? AMBIENCES[0];


