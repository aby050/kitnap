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

export const RETURNING_NEW = 'I’m new here';
export const RETURNING_EXISTING = 'I’ve used Byre before';

/** All onboarding questions — permissions are asked upfront now
 *  (PermissionBoardingPassScreen, before this screen ever mounts), not
 *  interleaved with questions. */
export const QUESTIONS: Question[] = [
  { id: 'intro', kind: 'static', prompt: "I'll help protect your focus." },
  /* Asked before anything else: a returning user should not be walked through
   * a setup they have already done. Answering "before" jumps straight to sign
   * in (see OnboardingFlow.handleAnswer) rather than continuing the funnel.
   * The exact string is matched there — keep them in step. */
  {
    id: 'returning',
    kind: 'choice',
    prompt: 'Have you used **Byre** before?',
    options: [RETURNING_NEW, RETURNING_EXISTING],
  },
  { id: 'name', kind: 'text', prompt: "First, what's your **name**?", placeholder: 'John' },
  /* ── The movement questions ────────────────────────────────────────────
   * Asked in the first thirty seconds, immediately after the name, because
   * they are the only questions in this flow that no other app in the
   * category could ask. Everything below them — what matters to you, what
   * stopped you last time, what you'd rather be doing — is asked by every
   * screen-time app there is, and a setup that opens with those reads as
   * interchangeable no matter how good the rest of the app is.
   *
   * They also do real work: the chosen movement and the honest rep baseline
   * seed the Strict-mode target, so the first challenge is calibrated to this
   * person instead of a fixed number. */
  {
    id: 'healthLimit',
    kind: 'text',
    prompt: 'Any **illness, injury, or physical limitation** we should know about? Some unlock challenges involve light movement.',
    placeholder: 'e.g. bad knee — or leave blank',
    optional: true,
  },
  {
    id: 'movement',
    kind: 'choice',
    prompt: 'Pick your **key**. This is what gets you back into a blocked app.',
    options: [...MOVEMENTS],
  },
  {
    id: 'repBaseline',
    kind: 'slider',
    prompt: 'Honestly — how many can you do **right now**, in one go?',
    min: 1,
    max: 30,
    default: 8,
    maxPlus: true,
  },
  {
    id: 'whereBlocked',
    kind: 'choice',
    prompt: 'Where are you usually **sitting** when you reach for the phone?',
    options: [...BLOCK_PLACES],
  },
  {
    id: 'matters',
    kind: 'choice',
    prompt: 'What **matters most** to you?',
    options: ['Focus better', 'Sleep better', 'Be more present', 'Improve mental health', 'Other'],
  },
  {
    id: 'pickupReason',
    kind: 'choice',
    prompt: 'Be honest — when you pick up your phone without thinking, it\'s usually because you\'re...',
    options: ['Bored, not sure why', 'Out of pure habit', 'Avoiding something', 'Craving connection'],
  },
  {
    id: 'wakeHabit',
    kind: 'choice',
    prompt: "What's the **first thing** you do when you **wake up**?",
    options: ['Check my phone', 'Check the time', 'Talk to someone', 'Just lie there a bit'],
  },
  { id: 'age', kind: 'slider', prompt: 'How **old** are you?', min: 8, max: 40, default: 25, maxPlus: true },
  // Self-reported "average screen time" and "which devices" removed —
  // both are answered for real once usage-access permission is granted
  // (real per-day average, real app names) instead of guessed here.
  {
    id: 'controlScale',
    kind: 'slider',
    prompt: 'Right now, how much **control** do you feel you have over your phone?',
    min: 1,
    max: 10,
    default: 5,
    labels: CONTROL_LEVEL_NAMES,
  },
  {
    id: 'triedBefore',
    kind: 'choice',
    prompt: 'Have you **tried to cut back** before?',
    options: ['Yes, many times', 'Once or twice', 'Never seriously tried', "I've just decided today"],
  },
  {
    id: 'whatStopped',
    kind: 'choice',
    prompt: 'What usually **gets in the way**?',
    options: ['I forget my reasons why', 'Willpower runs out by evening', 'Other apps make it too easy', "I'm doing this alone"],
  },
  {
    id: 'obstacleFear',
    kind: 'choice',
    prompt: "What **worries you most** about trying again?",
    options: ["I'll fail again", "It'll feel restrictive", "I'll miss something important", "Nothing — I'm ready"],
  },
  {
    id: 'interests',
    kind: 'multi',
    prompt: 'What would you **rather be spending** that time on? Pick as many as you like.',
    options: [
      'Drawing / painting',
      'Reading',
      'Exercise',
      'Meditation',
      'Study',
      'Work / a project',
      'Family / relationships',
      'Music',
      'Cooking',
      'Learning a skill',
      'Other',
    ],
    optional: true,
  },
  {
    id: 'lifeChange',
    kind: 'choice',
    prompt: "Optional — has anything major changed in your life recently, like a breakup or a big move? This helps us go easier on you if so.",
    options: ['Yes, recently', 'No', "I'd rather not say"],
    optional: true,
  },
  { id: 'review', kind: 'review', prompt: 'Reviewing your responses…' },
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
export const QUESTION_CHUNKS: { questions: Question[]; permissions: string[] }[] = [
  {
    // Who you are, and where the time goes.
    questions: QUESTIONS.slice(0, 5),
    // Screen time first: everything the next screens claim about your usage
    // depends on it, so it is the one ask that pays for itself immediately.
    permissions: ['usage', 'screenTime'],
  },
  {
    questions: QUESTIONS.slice(5, 9),
    // The shield itself, once blocking has been described.
    permissions: ['overlay', 'accessibility'],
  },
  {
    questions: QUESTIONS.slice(9),
    // Nudges and Strict-mode movement — the optional pair, asked last.
    permissions: ['notification', 'battery', 'camera'],
  },
];
