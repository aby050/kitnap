export type Question =
  | { id: string; kind: 'static'; prompt: string }
  | { id: string; kind: 'text'; prompt: string; placeholder: string }
  | { id: string; kind: 'choice'; prompt: string; options: string[] }
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
  {
    id: 'loseTime',
    kind: 'choice',
    // {matters} is resolved by OnboardingFlow from the previous answer.
    prompt: 'Thinking about {matters}: where do you lose the most time?',
    options: ['Social media', 'News', 'Gaming', 'Streaming', 'Work-related', 'Shopping', 'Messaging', 'Other'],
  },
  {
    id: 'affirm_lose_time',
    kind: 'static',
    prompt: 'Love that. Being present starts with putting distractions away.',
  },
  { id: 'age', kind: 'slider', prompt: 'How old are you?', min: 13, max: 90, default: 25 },
  {
    id: 'describes',
    kind: 'choice',
    prompt: 'What best describes you?',
    options: ['Technology', 'Entrepreneur', 'Remote', 'Finance', 'Creative', 'Student', 'Caregiver', 'Retired', 'Other', "I'd rather not say"],
  },
  {
    id: 'screentime',
    kind: 'choice',
    prompt: "What's your average screen time per day? Best guess is okay.",
    options: ['< 1 hour', '1–3 hours', '3–4 hours', '4–5 hours', '5–7 hours', '7+ hours', "I don't know"],
  },
  {
    id: 'devices',
    kind: 'choice',
    prompt: 'Where do you want us to block distractions?',
    options: ['Phone', 'Computer', 'Tablet', 'All of them'],
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
