export type ThemeKey = 'deepWork' | 'health' | 'presence' | 'craft' | 'learning' | 'quiet';

export type AppTheme = {
  key: ThemeKey;
  name: string;
  forWho: string;
  /** Shield voice — shown verbatim on the block screen. */
  lines: string[];
  palette: [string, string];
  glyph: string;
};

export const THEMES: AppTheme[] = [
  {
    key: 'deepWork',
    name: 'Deep Work',
    forWho: 'Career, focus, output',
    lines: [
      'The work you said mattered is still waiting.',
      'Nothing on the other side of this is your job.',
      'You were in the middle of something.',
    ],
    palette: ['#1b3a4b', '#0a1620'],
    glyph: '🗼',
  },
  {
    key: 'health',
    name: 'Health & Sleep',
    forWho: 'Late-night scrolling, rest',
    lines: [
      'Tomorrow starts in 6 hours.',
      'Your body is keeping score of this.',
      'Nothing here is worth the morning.',
    ],
    palette: ['#232946', '#0b0e1c'],
    glyph: '🌙',
  },
  {
    key: 'presence',
    name: 'Presence',
    forWho: 'Relationships, family',
    lines: [
      'Someone in this room is real.',
      'They will remember whether you looked up.',
      'This will still be here. They might not be.',
    ],
    palette: ['#3d2b1f', '#150d08'],
    glyph: '🏡',
  },
  {
    key: 'craft',
    name: 'Craft',
    forWho: 'Creative practice',
    lines: [
      'Nothing you make is on the other side of this.',
      'The blank page is not going to fill itself.',
      'Consumption is not practice.',
    ],
    palette: ['#1e3a2f', '#08150f'],
    glyph: '🌿',
  },
  {
    key: 'learning',
    name: 'Learning',
    forWho: 'Study, exams, skills',
    lines: [
      "You're 4 sessions from finishing the chapter.",
      'Nobody has ever learned anything from a feed.',
      'The exam does not care how you felt.',
    ],
    palette: ['#2b2440', '#0e0a18'],
    glyph: '📚',
  },
  {
    key: 'quiet',
    name: 'Quiet',
    forWho: 'General scroll reduction',
    lines: [
      'Nothing new since you last checked.',
      'You already saw this.',
      'There is no bottom to this.',
    ],
    palette: ['#2a2a2a', '#0a0a0a'],
    glyph: '🌫',
  },
];

export const getTheme = (key: ThemeKey) => THEMES.find((t) => t.key === key) ?? THEMES[0];

export type IntensityKey = 'gentle' | 'steady' | 'strict';

export type Intensity = {
  key: IntensityKey;
  name: string;
  /** Unlock number at which the friction ladder begins. */
  ladderStartsAt: number;
  maxQuestions: number;
  grantMinutes: number;
  settingsDelay: string;
  dailyCap: string;
};

export const INTENSITIES: Intensity[] = [
  { key: 'gentle', name: 'Gentle', ladderStartsAt: 4, maxQuestions: 3, grantMinutes: 15, settingsDelay: 'Instant', dailyCap: 'None' },
  { key: 'steady', name: 'Steady', ladderStartsAt: 2, maxQuestions: 5, grantMinutes: 5, settingsDelay: '1 hour delay', dailyCap: 'Soft warning' },
  { key: 'strict', name: 'Strict', ladderStartsAt: 1, maxQuestions: 5, grantMinutes: 3, settingsDelay: '24 hour delay', dailyCap: 'Hard stop' },
];

export const getIntensity = (key: IntensityKey) => INTENSITIES.find((i) => i.key === key) ?? INTENSITIES[1];
