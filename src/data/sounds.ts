import { IconName } from '../ui/Icon';

export type SoundKey = 'focus' | 'sleep' | 'ambient' | 'breathe';

export type SoundDef = {
  key: SoundKey;
  name: string;
  description: string;
  /** Line icon for the sound. Replaced an emoji + parallel SF-symbol field;
   *  one cross-platform vector icon is simpler and renders identically on
   *  Android, which is the primary target. */
  mark: IconName;
  source: number;
};

/** All four are short synthesized loops (no third-party audio), generated to
 *  seamlessly repeat — see assets/sounds and the generation note there. */
export const SOUNDS: SoundDef[] = [
  {
    key: 'focus',
    name: 'Focus drone',
    description: 'Low dual-tone hum. Good under a work or study session.',
    mark: 'target',
    source: require('../../assets/sounds/focus.wav'),
  },
  {
    key: 'ambient',
    name: 'Rain ambient',
    description: 'Soft filtered noise, like light rain against a window.',
    mark: 'mist',
    source: require('../../assets/sounds/ambient.wav'),
  },
  {
    key: 'sleep',
    name: 'Deep rumble',
    description: 'Very low brown-noise rumble for winding down.',
    mark: 'moon',
    source: require('../../assets/sounds/sleep.wav'),
  },
  {
    key: 'breathe',
    name: 'Breathing cue',
    description: 'One 8-second inhale/exhale tone, loops as a pacer.',
    mark: 'breathe',
    source: require('../../assets/sounds/breathe.wav'),
  },
];

export const getSound = (key: SoundKey) => SOUNDS.find((s) => s.key === key) ?? SOUNDS[0];
