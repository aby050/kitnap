export type Question =
  | { id: string; kind: 'static'; prompt: string }
  | { id: string; kind: 'text'; prompt: string; placeholder: string; optional?: boolean }
  | { id: string; kind: 'choice'; prompt: string; options: string[]; optional?: boolean }
  | { id: string; kind: 'multi'; prompt: string; options: string[]; optional?: boolean }
  | { id: string; kind: 'slider'; prompt: string; min: number; max: number; default: number }
  | { id: string; kind: 'review'; prompt: string };

export const QUESTIONS: Question[] = [
  { id: 'intro', kind: 'static', prompt: "I'll help protect your focus." },
  { id: 'name', kind: 'text', prompt: "First, what's your name?", placeholder: 'John' },
  { id: 'returning', kind: 'choice', prompt: 'Quick check, have we met before?', options: ['Yes, sign in', "I'm new here"] },
  {
    id: 'setup_intro',
    kind: 'static',
    prompt: "I'm going to ask you a few questions, no need to overthink it. Then I'll build your setup.",
  },
  {
    id: 'matters',
    kind: 'choice',
    prompt: 'What matters most to you?',
    options: ['Focus better', 'Sleep better', 'Be more present', 'Improve mental health', 'Other'],
  },
  // "Where do you lose the most time" removed — once usage-access
  // permission is granted (PostOnboardingFlow), the app reads this from
  // real device usage stats and tells the user directly (by app name)
  // instead of asking them to self-report it.
  {
    id: 'affirm_lose_time',
    kind: 'static',
    prompt: 'Love that. Being present starts with putting distractions away.',
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
    prompt: "What's the first thing you do when you wake up?",
    options: ['Check my phone', 'Check the time', 'Talk to someone', 'Just lie there a bit'],
  },
  { id: 'age', kind: 'slider', prompt: 'How old are you?', min: 13, max: 90, default: 25 },
  {
    id: 'describes',
    kind: 'choice',
    prompt: 'What best describes you?',
    options: ['Technology', 'Entrepreneur', 'Remote', 'Finance', 'Creative', 'Student', 'Caregiver', 'Retired', 'Other', "I'd rather not say"],
  },
  // Self-reported "average screen time" and "which devices" removed —
  // both are answered for real once usage-access permission is granted
  // (real per-day average, real app names) instead of guessed here.
  {
    id: 'controlScale',
    kind: 'slider',
    prompt: 'Right now, how much control do you feel you have over your phone?',
    min: 1,
    max: 10,
    default: 5,
  },
  {
    id: 'eyesight',
    kind: 'choice',
    prompt: 'How would you describe your eyesight?',
    options: ['Good eyesight', 'Weak eyesight', 'I wear glasses', 'Other'],
  },
  {
    id: 'healthLimit',
    kind: 'text',
    prompt: 'Any illness, injury, or physical limitation we should know about? Some unlock challenges involve light movement.',
    placeholder: 'e.g. bad knee — or leave blank',
    optional: true,
  },
  {
    id: 'costText',
    kind: 'text',
    prompt: "What's one thing distraction has cost you that you actually miss?",
    placeholder: 'e.g. reading before bed',
    optional: true,
  },
  {
    id: 'affirm_cost',
    kind: 'static',
    prompt: "That's worth protecting. Let's build toward getting it back.",
  },
  {
    id: 'triedBefore',
    kind: 'choice',
    prompt: 'Have you tried to cut back before?',
    options: ['Yes, many times', 'Once or twice', 'Never seriously tried', "I've just decided today"],
  },
  {
    id: 'whatStopped',
    kind: 'choice',
    prompt: 'What usually gets in the way?',
    options: ['I forget my reasons why', 'Willpower runs out by evening', 'Other apps make it too easy', "I'm doing this alone"],
  },
  {
    id: 'social_proof',
    kind: 'static',
    prompt: "You're not the only one — most people who get this far say the exact same thing.",
  },
  {
    id: 'obstacleFear',
    kind: 'choice',
    prompt: "What worries you most about trying again?",
    options: ["I'll fail again", "It'll feel restrictive", "I'll miss something important", "Nothing — I'm ready"],
  },
  {
    id: 'aspiration',
    kind: 'text',
    prompt: 'Last one — if this actually works, what changes first?',
    placeholder: "e.g. I'm present at dinner again",
    optional: true,
  },
  {
    id: 'interests',
    kind: 'multi',
    prompt: 'What would you rather be spending that time on? Pick as many as you like.',
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
  {
    id: 'limitedTime',
    kind: 'static',
    prompt: "You get a limited number of days on this earth. Every one spent scrolling somebody else's life is one you don't get back.",
  },
  {
    id: 'reelVsReal',
    kind: 'choice',
    prompt: 'So — the reel life, or the real one?',
    options: ['Real life. I want it back', "I'm not ready to choose yet"],
  },
  { id: 'review', kind: 'review', prompt: 'Reviewing your responses…' },
];

/** Substitutes tokens like {matters} with the label of an earlier answer,
 *  lowercased so it reads naturally mid-sentence. */
export function resolvePrompt(prompt: string, answers: Record<string, { value: string; label: string }>): string {
  return prompt.replace(/\{(\w+)\}/g, (_, key) => {
    const label = answers[key]?.label;
    return label ? label.toLowerCase() : key;
  });
}
