import { IconName } from '../ui/Icon';
import { ThemeKey } from './themes';
import { AMBIENCE_MEDIA } from './ambienceMedia';

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
  /** Painted until (and behind) the loop: a three-stop wash sampled to sit in
   *  the same family as the room's footage, so a room with no media yet still
   *  reads as itself rather than as a missing asset. */
  wash: [string, string, string];
};

export const AMBIENCES: Ambience[] = [
  {
    key: 'family',
    title: 'Family time',
    intent: 'They are in the room. Be in it too.',
    minutes: 60,
    theme: 'presence',
    mark: 'home',
    wash: ['#1E4A6E', '#3E86C0', '#8FC8E8'],
  },
  {
    key: 'meditate',
    title: 'Meditation',
    intent: 'Ten quiet minutes with nothing to check.',
    minutes: 10,
    theme: 'quiet',
    mark: 'breathe',
    wash: ['#2C4A38', '#7A8A6E', '#E8B9AE'],
  },
  {
    key: 'think',
    title: 'Deep thinking',
    intent: 'One problem. No interruptions.',
    minutes: 90,
    theme: 'deepWork',
    mark: 'tower',
    wash: ['#0E1A22', '#1F4457', '#4F8CA8'],
  },
  {
    key: 'peace',
    title: 'Peace',
    intent: 'A long reset. Nothing is waiting.',
    minutes: 120,
    theme: 'quiet',
    mark: 'mist',
    wash: ['#3E5E32', '#6E9456', '#AFCB8C'],
  },
  {
    key: 'study',
    title: 'Deep study',
    intent: 'Chapter-sized. Phone in another room.',
    minutes: 90,
    theme: 'learning',
    mark: 'book',
    wash: ['#241B14', '#6B4A2A', '#C08F52'],
  },
  {
    key: 'winddown',
    title: 'Wind down',
    intent: 'Screens off before the bedroom.',
    minutes: 45,
    theme: 'health',
    mark: 'moon',
    wash: ['#2A2140', '#5A4670', '#C79BB4'],
  },
];

export const getAmbience = (key: string) =>
  AMBIENCES.find((a) => a.key === key) ?? AMBIENCES[0];

/** Media is looked up separately so a room renders — wash, title, countdown
 *  and all — before any footage exists for it. */
export const mediaFor = (key: string) => AMBIENCE_MEDIA[key] ?? {};
