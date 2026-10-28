import { Platform } from 'react-native';
/**
 * The gate draws from five families so the sequence is never the same twice —
 * fixed questions get memorised and the friction evaporates within ~2 weeks.
 * A full 5-question gate always includes exactly one C and one D; those two
 * carry the weight and the rest are pacing.
 */
import { IconName } from '../ui/Icon';

export type Family = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type GateQuestion =
  | { family: 'A'; kind: 'tap'; prompt: string; options: string[] }
  | { family: 'B'; kind: 'dwell'; prompt: string; seconds: number }
  | { family: 'C'; kind: 'type'; prompt: string; minChars: number }
  | { family: 'D'; kind: 'recall'; prompt: string; body: string }
  | { family: 'E'; kind: 'hold'; prompt: string; seconds: number }
  | { family: 'F'; kind: 'breathe'; prompt: string; cycles: number }
  | { family: 'F'; kind: 'math'; prompt: string; a: number; b: number; op: '+' | '−' | '×' }
  | { family: 'F'; kind: 'quiz'; prompt: string; options: string[]; correctIndex: number; explain: string };

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

/** Family D — Their own history, played back.
 *
 *  Deliberately has no hardcoded "quotes" — the whole point of this family is
 *  that it's the user's own words. Inventing plausible-sounding lines they
 *  never wrote ("I want my evenings back") reads as real to them and is a lie.
 *  If we have nothing of theirs, we fall back to a neutral prompt that makes
 *  no claim about what they said. */
export const FAMILY_D_NEUTRAL: GateQuestion[] = [
  {
    family: 'D',
    kind: 'recall',
    prompt: 'You set this up for a reason.',
    body: "You haven't written that reason down yet. Whatever it was, it still applies right now.",
  },
];

export type PastReflection = { date: string; text: string; unlocked: boolean };

function daysAgoLabel(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 'Earlier you wrote:';
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return 'Earlier today you wrote:';
  if (days === 1) return 'Yesterday you wrote:';
  return `${days} days ago you wrote:`;
}

/**
 * Builds Family D from real material only: their goal line, plus anything
 * they actually typed at a previous gate. `pastReflections` is expected
 * newest-last; the most recent few are the most confronting so we prefer those.
 */
export function familyDFor(goalLine: string, pastReflections: PastReflection[] = []): GateQuestion[] {
  const out: GateQuestion[] = [];

  if (goalLine) {
    out.push({ family: 'D', kind: 'recall', prompt: 'When you set this up, you wrote:', body: goalLine });
  }

  for (const r of pastReflections.slice(-5)) {
    if (!r.text.trim()) continue;
    out.push({
      family: 'D',
      kind: 'recall',
      prompt: daysAgoLabel(r.date),
      body: r.unlocked ? `${r.text}\n\nYou went in anyway.` : r.text,
    });
  }

  return out.length > 0 ? out : FAMILY_D_NEUTRAL;
}

/** Family E — Physical. The boredom is the intervention. Level 1 (Easy)
 *  unlock is the plain 5-second hold; the longer holds are used later in
 *  the ladder as friction increases. */
export const FAMILY_E: GateQuestion[] = [
  { family: 'E', kind: 'hold', prompt: 'Hold for 5 seconds to continue.', seconds: 5 },
  { family: 'E', kind: 'hold', prompt: 'Hold to continue.', seconds: 30 },
  { family: 'E', kind: 'hold', prompt: 'One full breath. Hold while you take it.', seconds: 12 },
];

/** Family F — Medium unlock. Breathing, a quick mental-math check, or a
 *  health/wellbeing quiz question — variety so it never gets memorised into
 *  muscle memory the way a single fixed exercise would. */
export const FAMILY_F_BREATHE: GateQuestion[] = [
  { family: 'F', kind: 'breathe', prompt: 'Two slow breaths before you go in.', cycles: 2 },
  { family: 'F', kind: 'breathe', prompt: 'Slow down. Three breaths, then we let you through.', cycles: 3 },
];

/** Generates a fresh problem every time so it can't be memorised. */
export function randomMathChallenge(): Extract<GateQuestion, { kind: 'math' }> {
  const ops: Array<'+' | '−' | '×'> = ['+', '−', '×'];
  const op = pick(ops);
  const a = op === '×' ? 2 + Math.floor(Math.random() * 10) : 10 + Math.floor(Math.random() * 40);
  const b = op === '×' ? 2 + Math.floor(Math.random() * 10) : 1 + Math.floor(Math.random() * (op === '−' ? a - 1 : 40));
  return { family: 'F', kind: 'math', prompt: 'Quick one — solve this to continue.', a, b, op };
}

export const FAMILY_F_QUIZ: Extract<GateQuestion, { kind: 'quiz' }>[] = [
  {
    family: 'F',
    kind: 'quiz',
    prompt: 'How many hours of sleep does the average adult need?',
    options: ['4–5 hours', '7–9 hours', '10–12 hours', 'None, sleep is optional'],
    correctIndex: 1,
    explain: '7–9 hours is the range most adults need to actually recover.',
  },
  {
    family: 'F',
    kind: 'quiz',
    prompt: 'Which helps more with an afternoon energy dip?',
    options: ['A short walk', 'Another coffee', 'More scrolling', 'Skipping lunch'],
    correctIndex: 0,
    explain: 'Movement beats caffeine for a sustained energy dip.',
  },
  {
    family: 'F',
    kind: 'quiz',
    prompt: 'Blue light late at night mainly affects…',
    options: ['Your eye color', 'Melatonin production', 'Your appetite', 'Nothing measurable'],
    correctIndex: 1,
    explain: 'It suppresses melatonin, which is why late scrolling makes sleep harder.',
  },
];


const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/**
 * The non-physical gate.
 *
 * Families A, C and E were declared, written and then never reached: the
 * picker only ever rolled breathe, math or quiz, so the intent check-ins, the
 * typed prompts and the holds existed in this file and nowhere on screen.
 * That also quietly hollowed out two other surfaces — the Waiting Room
 * settings toggled families that could not appear, and Profile's "Your words"
 * could only ever be filled by demo data, because the typed prompt that feeds
 * it was never shown.
 *
 * `enabled` is the Waiting Room setting. A family switched off here is a
 * family the gate will not roll; at least one always survives, because a gate
 * with nothing to ask is not a gate.
 */
function pickQuizChallenge(enabled?: Record<string, boolean>): GateQuestion {
  const on = (f: string) => !enabled || enabled[f] !== false;

  /* Only kinds GateScreen can actually draw.
   *
   * It renders activity, breathe, math, quiz and type — and nothing else. An
   * earlier pass added families A (tap) and E (hold) here on the strength of
   * the picker alone, which meant a third of gates rendered an empty screen.
   * A family belongs in this list when the Gate has a branch for its `kind`,
   * not when the questions exist. */
  const pools: { family: string; get: () => GateQuestion }[] = [
    { family: 'C', get: () => pick(FAMILY_C) },
    { family: 'F', get: () => pick(FAMILY_F_BREATHE) },
    { family: 'F', get: () => randomMathChallenge() },
    { family: 'F', get: () => pick(FAMILY_F_QUIZ) },
  ].filter((p) => on(p.family));

  if (pools.length === 0) return pick(FAMILY_F_BREATHE);
  return pools[Math.floor(Math.random() * pools.length)].get();
}

/** The gate's challenge: a quiz, breathing or maths round from the families
 *  the Waiting Room leaves switched on. Movement unlocks were removed. */
export function pickChallenge(enabled?: Record<string, boolean>): GateQuestion {
  return pickQuizChallenge(enabled);
}

/** Four categories, not nine. An essentials list long enough to browse is a
 *  loophole, so this is only the things you genuinely cannot be locked out of.
 *  `url` is what the Emergency sheet opens; where a platform gives no public
 *  scheme the row says the category is allowed rather than pretending to
 *  launch something. */
export type EssentialKey = 'call' | 'payment' | 'maps' | 'health';

export const ESSENTIALS: {
  key: EssentialKey;
  name: string;
  mark: IconName;
  note: string;
  url?: string;
}[] = [
  { key: 'call', name: 'Call', mark: 'phone', note: 'Opens the dialer. Emergency calls always work — that is the OS, not us.', url: 'tel:' },
  { key: 'payment', name: 'Payments', mark: 'card', note: 'Banking, UPI and wallets stay reachable. A blocked OTP is a failed payment.' },
  { key: 'maps', name: 'Maps', mark: 'pin', note: 'Never blocked while you are finding your way somewhere.', url: Platform.OS === 'android' ? 'geo:0,0' : 'maps:' },
  // No public scheme opens a health app on Android, so that row states the
  // category is allowed rather than pretending to launch something.
  { key: 'health', name: 'Health', mark: 'heart', note: 'Medical and health apps are never held back.', url: Platform.OS === 'ios' ? 'x-apple-health://' : undefined },
];
