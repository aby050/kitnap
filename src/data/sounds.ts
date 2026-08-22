export type SoundKey = 'focus' | 'sleep' | 'ambient' | 'breathe';

export type SoundDef = {
  key: SoundKey;
  name: string;
  description: string;
  glyph: string;
  /** SF Symbol shown instead of `glyph` on iOS. */
  sf: string;
  source: number;
};

/** All four are short synthesized loops (no third-party audio), generated to
 *  seamlessly repeat — see assets/sounds and the generation note there. */
export const SOUNDS: SoundDef[] = [
  {
    key: 'focus',
    name: 'Focus drone',
    description: 'Low dual-tone hum. Good under a work or study session.',
    glyph: '🎯',
    sf: 'scope',
    source: require('../../assets/sounds/focus.wav'),
  },
  {
    key: 'ambient',
    name: 'Rain ambient',
    description: 'Soft filtered noise, like light rain against a window.',
    glyph: '🌧',
    sf: 'cloud.rain',
    source: require('../../assets/sounds/ambient.wav'),
  },
  {
    key: 'sleep',
    name: 'Deep rumble',
    description: 'Very low brown-noise rumble for winding down.',
    glyph: '🌙',
    sf: 'moon.stars',
    source: require('../../assets/sounds/sleep.wav'),
  },
  {
    key: 'breathe',
    name: 'Breathing cue',
    description: 'One 8-second inhale/exhale tone, loops as a pacer.',
    glyph: '🫁',
    sf: 'lungs',
    source: require('../../assets/sounds/breathe.wav'),
  },
];

export const getSound = (key: SoundKey) => SOUNDS.find((s) => s.key === key) ?? SOUNDS[0];
