/**
 * The gate draws from five families so the sequence is never the same twice —
 * fixed questions get memorised and the friction evaporates within ~2 weeks.
 * A full 5-question gate always includes exactly one C and one D; those two
 * carry the weight and the rest are pacing.
 */
export type Family = 'A' | 'B' | 'C' | 'D' | 'E';

export type GateQuestion =
  | { family: 'A'; kind: 'tap'; prompt: string; options: string[] }
  | { family: 'B'; kind: 'dwell'; prompt: string; seconds: number }
  | { family: 'C'; kind: 'type'; prompt: string; minChars: number }
  | { family: 'D'; kind: 'recall'; prompt: string; body: string }
  | { family: 'E'; kind: 'hold'; prompt: string; seconds: number };

/** Family A — Intent. "I don't know" is always present, always largest, always a soft exit. */
export const FAMILY_A: GateQuestion[] = [
  {
    family: 'A',
    kind: 'tap',
    prompt: "What are you actually about to do?",
    options: ['Reply to someone', 'Look something up', 'Post something', "I don't know"],
  },
  {
    family: 'A',
    kind: 'tap',
    prompt: 'Is this the thing you picked up your phone for?',
    options: ['Yes, exactly this', 'Sort of', 'No', "I don't know"],
  },
  {
    family: 'A',
    kind: 'tap',
    prompt: 'How long do you think you need?',
    options: ['Under a minute', 'A few minutes', 'A while', "I don't know"],
  },
];

/** Family B — Cost. Display only; must dwell. */
export const FAMILY_B: GateQuestion[] = [
  { family: 'B', kind: 'dwell', prompt: "You've given this app 47 minutes today. This request makes it 52.", seconds: 4 },
  { family: 'B', kind: 'dwell', prompt: "That's 5 hours 12 minutes of screen time today. The day has 16 waking hours.", seconds: 4 },
  { family: 'B', kind: 'dwell', prompt: 'This is your 6th unlock request today. The first was at 7:40am.', seconds: 4 },
];

/** Family C — Self-confrontation. Typing defeats autopilot far better than tapping. */
export const FAMILY_C: GateQuestion[] = [
  { family: 'C', kind: 'type', prompt: "Type what you'll feel in ten minutes.", minChars: 15 },
  { family: 'C', kind: 'type', prompt: 'In your words: why did you install this app?', minChars: 15 },
  { family: 'C', kind: 'type', prompt: 'What are you avoiding right now?', minChars: 15 },
  { family: 'C', kind: 'type', prompt: 'Finish this sentence: "I am opening this because…"', minChars: 15 },
];

/** Family D — Their own history, played back. Falls back to generic examples
 *  only when the user never wrote a goal line. */
export const FAMILY_D: GateQuestion[] = [
  { family: 'D', kind: 'recall', prompt: '14 days ago you wrote:', body: 'I want my evenings back.' },
  {
    family: 'D',
    kind: 'recall',
    prompt: 'Last time you unlocked here, you typed:',
    body: 'just checking one thing.\n\nYou stayed 34 minutes.',
  },
  { family: 'D', kind: 'recall', prompt: 'When you set this up, you said you wanted:', body: 'To be present with my family in the evening.' },
];

export function familyDFor(goalLine: string): GateQuestion[] {
  if (!goalLine) return FAMILY_D;
  return [
    { family: 'D', kind: 'recall', prompt: 'When you set this up, you wrote:', body: goalLine },
    ...FAMILY_D,
  ];
}

/** Family E — Physical. The boredom is the intervention. */
export const FAMILY_E: GateQuestion[] = [
  { family: 'E', kind: 'hold', prompt: 'Hold to continue.', seconds: 30 },
  { family: 'E', kind: 'hold', prompt: 'One full breath. Hold while you take it.', seconds: 12 },
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Builds the gate for a given unlock number. Friction scales with how much the
 * user has already used today, never with elapsed time — the 1st unlock is
 * cheap and the 9th is expensive, which is what makes it feel fair.
 */
export function buildGate(
  unlockNumber: number,
  ladderStartsAt: number,
  maxQuestions: number,
  goalLine = '',
): GateQuestion[] {
  const step = unlockNumber - ladderStartsAt + 1;
  const familyD = familyDFor(goalLine);

  if (step <= 0) return [];
  if (step === 1) return [pick(FAMILY_A)];
  if (step === 2) return [pick(FAMILY_A), pick(FAMILY_C)];
  if (step === 3) return [pick(FAMILY_A), pick(FAMILY_C), pick(familyD)];

  const full: GateQuestion[] = [pick(FAMILY_A), pick(FAMILY_B), pick(FAMILY_C), pick(familyD), pick(FAMILY_E)];
  return full.slice(0, maxQuestions);
}

export const ESSENTIALS = [
  { name: 'Phone', glyph: '📞', locked: true, note: 'Guaranteed by iOS — can never be blocked' },
  { name: 'Emergency SOS', glyph: '🆘', locked: true, note: 'Guaranteed by iOS — can never be blocked' },
  { name: 'Messages', glyph: '💬', locked: false, note: '' },
  { name: 'Maps', glyph: '🗺', locked: false, note: 'Never blocked while navigating' },
  { name: 'Banking & UPI', glyph: '🏦', locked: false, note: 'A blocked OTP is a failed payment' },
  { name: 'Wallet', glyph: '👛', locked: false, note: '' },
  { name: 'Camera', glyph: '📷', locked: false, note: '' },
  { name: 'Clock', glyph: '⏰', locked: false, note: '' },
  { name: 'Health', glyph: '❤️', locked: false, note: '' },
];
