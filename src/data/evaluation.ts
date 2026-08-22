import { IntensityKey, ThemeKey } from './themes';

type Answer = { value: string; label: string };

const INTEREST_THEME_MAP: Record<string, ThemeKey> = {
  'Drawing / painting': 'craft',
  Reading: 'learning',
  Exercise: 'health',
  Meditation: 'health',
  Study: 'learning',
  'Work / a project': 'deepWork',
  'Family / relationships': 'presence',
  Music: 'craft',
  Cooking: 'craft',
  'Learning a skill': 'learning',
};

/** Picks whichever theme their picked interests point to most — "what are
 *  you protecting" answered by what they said they'd rather spend time on,
 *  not a separate question that duplicates it. Falls back to 'quiet' when
 *  nothing maps (unanswered, only "Other", or a genuine tie resolved by
 *  map order). */
export function suggestTheme(interestsAnswerValue: string | undefined): ThemeKey {
  if (!interestsAnswerValue) return 'quiet';
  const picked = interestsAnswerValue.split(',').map((s) => s.trim()).filter(Boolean);
  const counts = new Map<ThemeKey, number>();
  for (const interest of picked) {
    const theme = INTEREST_THEME_MAP[interest];
    if (theme) counts.set(theme, (counts.get(theme) ?? 0) + 1);
  }
  let best: ThemeKey = 'quiet';
  let bestCount = 0;
  for (const [theme, count] of counts) {
    if (count > bestCount) {
      best = theme;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Weighs multiple onboarding signals into one recommended intensity —
 * screen time alone is a weak predictor (someone can watch 6 hrs of
 * work-related video and be in full control), so no single answer decides it.
 */
export function recommendIntensity(
  answers: Record<string, Answer>,
  screentimeHours: number
): { key: IntensityKey; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (screentimeHours >= 6) {
    score += 2;
    reasons.push('Your daily screen time is on the higher end');
  } else if (screentimeHours >= 3.5) {
    score += 1;
  }

  const control = Number(answers.controlScale?.value);
  if (Number.isFinite(control)) {
    if (control <= 3) {
      score += 2;
      reasons.push("You said you don't feel much control over your phone right now");
    } else if (control <= 6) {
      score += 1;
    }
  }

  const tried = answers.triedBefore?.value;
  if (tried === 'Yes, many times') {
    score += 2;
    reasons.push("You've tried cutting back before and it hasn't stuck yet");
  } else if (tried === 'Once or twice') {
    score += 1;
  }

  const stopped = answers.whatStopped?.value;
  if (stopped === 'Willpower runs out by evening' || stopped === 'Other apps make it too easy') {
    score += 1;
    reasons.push('Willpower alone has gotten in the way before');
  }

  const pickup = answers.pickupReason?.value;
  if (pickup === 'Out of pure habit' || pickup === 'Bored, not sure why') {
    score += 1;
    reasons.push('Most of your pickups are on autopilot, not intentional');
  }

  const fear = answers.obstacleFear?.value;
  if (fear === "Nothing — I'm ready") {
    score += 1;
    reasons.push("You're ready to push harder");
  } else if (fear === "It'll feel restrictive") {
    score -= 1;
  }

  // A recent major life change is a reason to go easier, not harder —
  // this is the one signal that pulls the score down regardless of the rest.
  const lifeChange = answers.lifeChange?.value;
  if (lifeChange === 'Yes, recently') {
    score -= 2;
    reasons.push("You mentioned things have been rough lately — we'll start gentler");
  }

  let key: IntensityKey;
  if (score >= 3) key = 'strict';
  else key = 'steady';

  if (reasons.length === 0) {
    reasons.push('Based on a balanced read of your answers');
  }

  return { key, reasons };
}
