import { IntensityKey, ThemeKey } from './themes';
import { recommendSetup } from './setupPlan';

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
 * Weighs onboarding + estimated (or measured) screen time into intensity.
 * Real usage, when passed, can overrule a confident self-report.
 */
export function recommendIntensity(
  answers: Record<string, Answer>,
  screentimeHours: number,
  fromUsage = false,
): { key: IntensityKey; reasons: string[] } {
  const rec = recommendSetup(answers, screentimeHours, fromUsage);
  return { key: rec.intensityKey, reasons: rec.reasons };
}
