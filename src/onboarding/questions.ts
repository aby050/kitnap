export type Question =
  | { id: string; kind: 'static'; prompt: string }
  | { id: string; kind: 'text'; prompt: string; placeholder: string; optional?: boolean }
  | { id: string; kind: 'choice'; prompt: string; options: string[]; optional?: boolean }
  | { id: string; kind: 'multi'; prompt: string; options: string[]; optional?: boolean }
  | {
      id: string;
      kind: 'slider';
      prompt: string;
      min: number;
      max: number;
      default: number;
      /** One name per step, indexed from `min`. Shown while sliding instead of a bare number. */
      labels?: string[];
      /** Render `max` as "N+" — the top step means "N or older", not exactly N. */
      maxPlus?: boolean;
    }
  | { id: string; kind: 'review'; prompt: string };

/** 1–10 labels for the "how much control over your phone" slider. */
export const CONTROL_LEVEL_NAMES = [
  'The phone is driving',
  'Scroll hostage',
  'Autopilot thumbs',
  '"Just one more reel"',
  'Coin-flip with the feed',
  'Bargaining with the algorithm',
  'Mostly in the driver\'s seat',
  'Firm handshake',
  'Phone sits when told',
  'Absolute monarch',
];

/** The two answers to the `returning` question. Exported so the branch in
 *  OnboardingFlow compares against the same constant the option renders from,
 *  rather than a duplicated string literal that silently stops matching the
 *  moment the copy is reworded. */
/** The physical unlocks Strict mode can ask for. `MOVEMENTS[3]` is the
 *  opt-out: choosing it, or declaring a limitation on the previous question,
 *  routes Strict mode to the quiz challenge instead — never negotiable. */
export const MOVEMENTS = [
  'Push-ups',
  'Squats',
  'Jumping jacks',
  'I’d rather not move',
] as const;

/** Where the user usually is when a block fires. Picks a movement that is
 *  actually possible there — jumping jacks at a desk in an office is a
 *  challenge nobody completes, and an unlock nobody can pass is an unlock
 *  that gets the app deleted. */
export const BLOCK_PLACES = ['At a desk', 'In bed', 'On the sofa', 'Out and about'] as const;

/** When the phone actually wins. Each maps to a real clock window, so the
 *  answer becomes a schedule rather than a stored string. */
export const SLIP_WINDOWS = [
  { label: 'First thing in the morning', start: '06:30', end: '09:00' },
  { label: 'Through the working day', start: '09:00', end: '17:30' },
  { label: 'The evening', start: '18:00', end: '22:00' },
  { label: 'Late at night, in bed', start: '22:00', end: '01:00' },
] as const;

export const RETURNING_NEW = 'I’m new here';
export const RETURNING_EXISTING = 'I’ve used Phonewise before';

/**
 * Whether to ask new-or-returning at all.
 *
 * Off while there is no sign-up to send a returning user to: the question
 * offers a door, and a door that opens onto a provider button nobody can
 * complete is worse than no question. The question, both answers and the
 * branch in OnboardingFlow are all left intact — flip this back to `true`
 * the day accounts are live and the whole path works again.
 */
export const ASK_RETURNING = false;

/** All onboarding questions. Permissions are NOT asked upfront — they are
 *  interleaved, one small group after each chunk below, so every ask arrives
 *  right after the question that explains why it is needed. */
/**
 * All onboarding questions.
 *
 * Seven were cut: pickupReason, wakeHabit, triedBefore, whatStopped,
 * obstacleFear, lifeChange and age. Every one of them existed to nudge a
 * guessed "you probably use your phone N hours a day" — a guess that Screen
 * Time permission, asked two screens later, replaces outright. They were a
 * quiz that fed a number nobody ever saw, and a quiz of that shape is most of
 * what made this funnel read as interchangeable under 4.3(a).
 *
 * What is left all configures something. The movement trio calibrates the
 * unlock challenge, `matters` picks the block-screen voice, `interests`
 * writes the lines shown back to you, `slipWindow` seeds a real schedule,
 * `controlScale` sets the starting intensity. If an answer does not change
 * the app, it should not be a question.
 *
 * Permissions are interleaved, one group after every three questions, so each
 * ask arrives beside the answer that explains why it is needed.
 */
/**
 * Categories that get blocked outright rather than gated by a challenge.
 *
 * `adult` is the only one iOS can enforce at the OS level today, through
 * Apple's own automatic web filter (see `setAdultContentFilter`) — it covers
 * every browser, so it cannot be stepped around by installing another one.
 * The rest are honest about being ordinary blocks the user picks apps for.
 */
export const HARD_BLOCKS: { key: string; label: string; why: string }[] = [
  {
    key: 'adult',
    label: 'Adult sites',
    why: 'You asked for this one to be gone, not negotiable. Phonewise uses the filter built into iOS, so it holds in every browser — there is no challenge to pass and no timer to wait out.',
  },
  {
    key: 'gambling',
    label: 'Betting and gambling',
    why: 'You asked for this one to be gone. Pick the apps and they stay shut.',
  },
  {
    key: 'shorts',
    label: 'Short-form video',
    why: 'Reels, Shorts, TikTok — the ones that go fastest.',
  },
  {
    key: 'news',
    label: 'News and doomscroll',
    why: 'You asked for this one to be gone.',
  },
];

export const hardBlockWhy = (key: string) => HARD_BLOCKS.find((h) => h.key === key)?.why ?? null;

export const QUESTIONS: Question[] = [
  { id: 'intro', kind: 'static', prompt: "I'll help protect your focus." },
  ...(ASK_RETURNING
    ? ([
        {
          id: 'returning',
          kind: 'choice',
          prompt: 'Have you used **Phonewise** before?',
          options: [RETURNING_NEW, RETURNING_EXISTING],
        },
      ] as Question[])
    : []),

  /* ── 1. What this is for ───────────────────────────────────────────── */
  {
    id: 'matters',
    kind: 'choice',
    prompt: 'What are you **protecting**?',
    options: ['Focus better', 'Sleep better', 'Be more present', 'Improve mental health', 'Other'],
  },
  {
    id: 'slipWindow',
    kind: 'choice',
    prompt: 'When does the phone usually **win**?',
    options: SLIP_WINDOWS.map((w) => w.label),
  },  {
    id: 'controlScale',
    kind: 'slider',
    prompt: 'Right now, how much **control** do you feel you have over your phone?',
    min: 1,
    max: 10,
    default: 5,
    labels: CONTROL_LEVEL_NAMES,
  },

  /**
   * Asked, never inferred.
   *
   * The obvious product instinct is to *detect* this and act on it. iOS makes
   * that impossible — Family Controls tokens are opaque, so Phonewise never learns
   * what anyone opens — and it would be the wrong thing even if it were
   * possible: being told by an app that it has noticed your habit is a worse
   * first minute than being asked.
   *
   * Asking is also the stronger mechanic. A person who has named the thing
   * has made a decision, and everything after this holds them to a decision
   * they made rather than a guess we made about them. Optional and neutrally
   * worded: a list nobody can tick without admitting something is a list
   * nobody ticks.
   */

  /* ── 2. Who you are, and how you get back in ───────────────────────── */

  /* ── 3. Calibration ────────────────────────────────────────────────── */

];

/** Substitutes tokens like {matters} with the label of an earlier answer,
 *  lowercased so it reads naturally mid-sentence. */
/** Drops the `**` emphasis markers — for anywhere a prompt is shown as plain
 *  text, like the answered-questions history. */
export function stripEmphasis(prompt: string): string {
  return prompt.replace(/\*\*([^*]+)\*\*/g, '$1');
}

export function resolvePrompt(prompt: string, answers: Record<string, { value: string; label: string }>): string {
  return prompt.replace(/\{(\w+)\}/g, (_, key) => {
    const label = answers[key]?.label;
    return label ? label.toLowerCase() : key;
  });
}

/**
 * Onboarding is broken into runs, with a permission ask between each.
 *
 * Asking for everything up front reads as an app demanding the whole phone
 * before it has shown you anything. Split like this, each permission arrives
 * after the questions that explain why it is needed.
 */
/**
 * Questions in groups, each followed by the permissions that group just
 * justified. Sliced by NAME rather than by index: the boundaries used to be
 * `slice(0, 5)` / `slice(5, 9)`, so inserting the movement questions silently
 * pushed the camera ask three places down the flow and left it being
 * requested long after the screens that depend on it.
 *
 * The ordering principle is that no permission is ever requested before the
 * user has been told, in their own answers, what it is for. Camera comes
 * first now because the movement questions come first: someone who has just
 * chosen push-ups and said how many they can do understands exactly why the
 * camera is being asked for, which is the only moment that ask is easy.
 */

export const QUESTION_CHUNKS: { questions: Question[]; permissions: string[] }[] = [
  {
    // Two questions here, and a third (the daily goal) on its own screen later.
    // Everything else is learned from real usage rather than asked.
    questions: QUESTIONS,
    // Usage access first: the next screen shows what it found. The rest follow.
    permissions: ['usage', 'screenTime'],
  },
];

/** Asked after the usage reveal. */
export const REST_PERMISSIONS = ['overlay', 'accessibility', 'notification', 'battery'];
