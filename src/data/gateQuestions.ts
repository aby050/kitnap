import { Platform } from 'react-native';
/**
 * The gate draws from five families so the sequence is never the same twice —
 * fixed questions get memorised and the friction evaporates within ~2 weeks.
 * A full 5-question gate always includes exactly one C and one D; those two
 * carry the weight and the rest are pacing.
 */
import { IconName } from '../ui/Icon';
import { ActivityKind, ACTIVITY_KINDS } from '../shield/activity/types';

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
  | { family: 'G'; kind: 'activity'; prompt: string; reps: number; activity: ActivityKind };

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

/** Family G — Hard unlock. Real movement with the camera up, counted
 *  automatically where the device can manage it and pace-checked where it
 *  can't. Specific movements are skipped when the onboarding health answer
 *  names that body part — see challengeFilterFromHealth() and pickChallenge().
 *
 *  The `reps` here are only cold-start defaults; the live number comes from
 *  computeRepTarget() via pickChallenge's `repsFor`. */
export const FAMILY_G: GateQuestion[] = [
  { family: 'G', kind: 'activity', prompt: 'Do 10 squats to unlock.', reps: 10, activity: 'squats' },
  { family: 'G', kind: 'activity', prompt: 'Do 10 jumping jacks to unlock.', reps: 10, activity: 'jumping jacks' },
  { family: 'G', kind: 'activity', prompt: 'Do 8 push-ups to unlock.', reps: 8, activity: 'push-ups' },
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const NOT_LIMITED = new Set([
  'no', 'none', 'nope', 'nil', 'nothing', 'n/a', 'na', '-', '--', 'no.', 'none.',
  'not really', 'nothing really', 'no issues', 'no problems', 'all good', 'all fine',
  'im fine', "i'm fine", 'fine', 'healthy', 'no limitations', 'no limits',
]);

function hasToken(text: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i').test(text);
}

function hasAny(text: string, tokens: string[]): boolean {
  return tokens.some((t) => hasToken(text, t));
}

export type ChallengeFilter = {
  /** True when every camera/movement challenge is unsafe. */
  skipPhysical: boolean;
  banned: Set<ActivityKind>;
};

/**
 * Maps the free-text onboarding health answer onto specific movements.
 * A bad knee skips squats and jumping jacks but can still get push-ups;
 * a wrist injury skips push-ups but can still squat. Unspecific illness or
 * injury skips all physical work and falls back to a quiz/math/breathing round.
 */
export function challengeFilterFromHealth(raw: string | undefined | null): ChallengeFilter {
  const empty = { skipPhysical: false, banned: new Set<ActivityKind>() };
  if (!raw) return empty;
  const v = raw.trim().toLowerCase();
  if (v.length === 0 || NOT_LIMITED.has(v)) return empty;

  const wholeBody = [
    'wheelchair', 'paralysis', 'paralysed', 'paralyzed', 'paraplegic', 'quadriplegic',
    'immobile', "can't walk", 'cannot walk', 'crutches', 'walker',
    'fracture', 'broken bone', 'surgery', 'post-op', 'operation',
    'heart', 'cardiac', 'asthma', 'copd', 'pregnant', 'pregnancy',
    'concussion', 'vertigo', 'seizure', 'epilepsy', 'fever', 'flu', 'covid',
    'pneumonia', 'chemo', 'cancer', 'fibromyalgia', 'multiple sclerosis',
    'stroke', 'unwell', 'disabled', 'disability', 'chronic illness',
  ];
  if (hasAny(v, wholeBody) || hasToken(v, 'illness') || hasToken(v, 'sick')) {
    return { skipPhysical: true, banned: new Set(ACTIVITY_KINDS) };
  }

  const banned = new Set<ActivityKind>();
  const lowerBody = [
    'knee', 'knees', 'acl', 'mcl', 'meniscus', 'patella',
    'ankle', 'ankles', 'foot', 'feet', 'shin', 'calf', 'hip', 'hips',
    'hamstring', 'quad', 'thigh', 'leg', 'legs', 'plantar',
  ];
  const upperBody = [
    'wrist', 'wrists', 'carpal', 'hand', 'hands', 'elbow', 'elbows',
    'shoulder', 'shoulders', 'rotator', 'chest', 'rib', 'ribs',
  ];
  const back = ['back', 'spine', 'disc', 'hernia', 'sciatica', 'lumbar'];

  if (hasAny(v, lowerBody) || hasToken(v, 'squat') || hasToken(v, 'squats')) {
    banned.add('squats');
  }
  if (
    hasAny(v, lowerBody) ||
    hasAny(v, ['jump', 'jumps', 'jumping']) ||
    hasToken(v, 'jacks')
  ) {
    banned.add('jumping jacks');
  }
  if (
    hasAny(v, upperBody) ||
    hasToken(v, 'push-up') ||
    hasToken(v, 'pushup') ||
    hasToken(v, 'push-ups') ||
    hasToken(v, 'pushups')
  ) {
    banned.add('push-ups');
  }
  if (hasAny(v, back)) {
    banned.add('squats');
    banned.add('jumping jacks');
    banned.add('push-ups');
  }

  if (banned.size >= ACTIVITY_KINDS.length) {
    return { skipPhysical: true, banned };
  }
  if (banned.size > 0) {
    return { skipPhysical: false, banned };
  }

  // Injury/pain mentioned without a body part we recognise — skip all physical.
  return { skipPhysical: true, banned: new Set(ACTIVITY_KINDS) };
}

/**
 * True when the onboarding health answer rules out at least one (or every)
 * physical challenge.
 */
export function isHealthLimited(raw: string | undefined | null): boolean {
  const f = challengeFilterFromHealth(raw);
  return f.skipPhysical || f.banned.size > 0;
}

function pickQuizChallenge(): GateQuestion {
  const roll = Math.random();
  if (roll < 0.4) return pick(FAMILY_F_BREATHE);
  if (roll < 0.75) return randomMathChallenge();
  return pick(FAMILY_F_QUIZ);
}

/**
 * Every unlock requires exactly one challenge, always — no free early
 * unlocks and no ladder buildup. Steady always gets the quiz/math/breathing
 * rotation. Strict picks a physical movement that is still safe given the
 * onboarding health answer; banned movements are replaced by another Family G
 * activity, or by the quiz rotation if none remain safe.
 *
 * `repsFor` is the adaptive rep-target resolver. It is applied here rather than
 * in the challenge component so the prompt and the count can never disagree —
 * the number in the sentence is the number being counted. It takes the chosen
 * activity because a squat history says nothing about push-ups.
 */
export function pickChallenge(
  intensityKey: 'steady' | 'strict',
  healthLimitRaw?: string | null,
  repsFor?: (activity: ActivityKind) => number,
): GateQuestion {
  const filter = challengeFilterFromHealth(healthLimitRaw);
  if (intensityKey === 'steady' || filter.skipPhysical) return pickQuizChallenge();
  const pool = FAMILY_G.filter(
    (q): q is Extract<GateQuestion, { kind: 'activity' }> =>
      q.kind === 'activity' && !filter.banned.has(q.activity),
  );
  if (pool.length === 0) return pickQuizChallenge();
  // One movement per day, not one per unlock. Rolling fresh every time meant
  // squats, then push-ups, then jacks within an hour, which reads as the app
  // making it up — and it robs you of the one thing that makes the reps get
  // easier: doing the same movement repeatedly.
  const day = Math.floor(Date.now() / 86_400_000);
  const chosen = pool[day % pool.length];
  if (!repsFor) return chosen;
  const resolved = repsFor(chosen.activity);
  if (!Number.isFinite(resolved)) return chosen;
  const reps = Math.max(1, Math.round(resolved));
  if (reps === chosen.reps) return chosen;
  return { ...chosen, reps, prompt: `Do ${reps} ${chosen.activity} to unlock.` };
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
