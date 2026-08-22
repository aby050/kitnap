/**
 * The gate draws from five families so the sequence is never the same twice —
 * fixed questions get memorised and the friction evaporates within ~2 weeks.
 * A full 5-question gate always includes exactly one C and one D; those two
 * carry the weight and the rest are pacing.
 */
export type Family = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export type GateQuestion =
  | { family: 'A'; kind: 'tap'; prompt: string; options: string[] }
  | { family: 'B'; kind: 'dwell'; prompt: string; seconds: number }
  | { family: 'C'; kind: 'type'; prompt: string; minChars: number }
  | { family: 'D'; kind: 'recall'; prompt: string; body: string }
  | { family: 'E'; kind: 'hold'; prompt: string; seconds: number }
  | { family: 'F'; kind: 'breathe'; prompt: string; cycles: number }
  | { family: 'F'; kind: 'math'; prompt: string; a: number; b: number; op: '+' | '−' | '×' }
  | { family: 'F'; kind: 'quiz'; prompt: string; options: string[]; correctIndex: number; explain: string }
  | { family: 'G'; kind: 'activity'; prompt: string; reps: number; activity: string };

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

/** Family G — Hard unlock. Physical movement, phone camera up so it can't be
 *  done from a pocket. Never offered to anyone who flagged a physical
 *  limitation during onboarding — see buildFinalChallenge(). */
export const FAMILY_G: GateQuestion[] = [
  { family: 'G', kind: 'activity', prompt: 'Do 10 squats to unlock.', reps: 10, activity: 'squats' },
  { family: 'G', kind: 'activity', prompt: 'Do 10 jumping jacks to unlock.', reps: 10, activity: 'jumping jacks' },
  { family: 'G', kind: 'activity', prompt: 'Do 8 push-ups to unlock.', reps: 8, activity: 'push-ups' },
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/**
 * healthLimited comes straight from the onboarding health-limitation answer:
 * if the user flagged anything, they always get the quiz/math/breathing
 * rotation, never a physical activity challenge. "Behavioral interruption,
 * not physical punishment" — never force movement on someone who told us
 * it might not be safe for them.
 */
function pickQuizChallenge(): GateQuestion {
  const roll = Math.random();
  if (roll < 0.4) return pick(FAMILY_F_BREATHE);
  if (roll < 0.75) return randomMathChallenge();
  return pick(FAMILY_F_QUIZ);
}

/**
 * Every unlock requires exactly one challenge, always — no free early
 * unlocks and no ladder buildup. Steady always gets the quiz/math/breathing
 * rotation; Strict always gets a physical activity challenge (or the same
 * quiz rotation if health-limited). The only way around it is spending an
 * emergency token, handled by the caller (GateScreen), not here.
 */
export function pickChallenge(
  intensityKey: 'steady' | 'strict',
  healthLimited: boolean,
): GateQuestion {
  if (intensityKey === 'steady' || healthLimited) return pickQuizChallenge();
  return pick(FAMILY_G);
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
