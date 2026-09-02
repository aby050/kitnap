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

/** All onboarding questions — permissions are asked upfront now
 *  (PermissionBoardingPassScreen, before this screen ever mounts), not
 *  interleaved with questions. */
export const QUESTIONS: Question[] = [
  { id: 'intro', kind: 'static', prompt: "I'll help protect your focus." },
  { id: 'name', kind: 'text', prompt: "First, what's your **name**?", placeholder: 'John' },
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
  { id: 'age', kind: 'slider', prompt: 'How **old** are you?', min: 8, max: 40, default: 25 },
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
    id: 'healthLimit',
    kind: 'text',
    prompt: 'Any **illness, injury, or physical limitation** we should know about? Some unlock challenges involve light movement.',
    placeholder: 'e.g. bad knee — or leave blank',
    optional: true,
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
