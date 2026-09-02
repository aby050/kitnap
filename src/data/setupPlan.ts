import { IntensityKey } from './themes';
import { DEFAULT_BLOCKED_APPS } from './blockedApps';

type Answer = { value: string; label: string };
type Answers = Record<string, Answer>;

export type RecapPlan = {
  dailyHours: number;
  fromUsage: boolean;
  reductionPercent: number;
  dailyTargetLabel: string;
  phoneYears: number;
  reclaimedYears: number;
  reclaimedDaysThisYear: number;
  badDaysThisYear: number;
  sleep: { title: string; desc: string } | null;
  extra: { title: string; desc: string };
  sourceNote: string;
};

export type SetupRecommendation = {
  intensityKey: IntensityKey;
  reasons: string[];
  suggestedPackages: string[];
};

const WAKING_HOURS = 16;
const LIFE_EXPECTANCY = 80;

export function formatHoursMinutes(hours: number): string {
  const mins = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function roundYears(n: number): number {
  if (n < 0.5) return 0.5;
  if (n < 2) return Math.round(n * 10) / 10;
  return Math.max(1, Math.round(n));
}

export function formatYearsLabel(n: number): string {
  const r = roundYears(n);
  const label = Number.isInteger(r) ? String(r) : r.toFixed(1);
  return `${label} ${r === 1 ? 'year' : 'years'}`;
}

function parseAge(answers: Answers): number {
  const n = Number(answers.age?.value);
  return Number.isFinite(n) ? Math.min(40, Math.max(8, n)) : 28;
}

/**
 * Daily hours: real usage when we have it, otherwise inferred from how they
 * described control and habits — never a canned "4 hours" default.
 */
export function estimateDailyHours(answers: Answers, realHours: number | null): {
  hours: number;
  fromUsage: boolean;
} {
  if (realHours != null && Number.isFinite(realHours) && realHours > 0.25) {
    return { hours: Math.min(12, Math.max(0.5, realHours)), fromUsage: true };
  }

  const control = Number(answers.controlScale?.value);
  let hours = 4.2;
  if (Number.isFinite(control)) {
    if (control <= 2) hours = 7.2;
    else if (control <= 4) hours = 5.8;
    else if (control <= 6) hours = 4.4;
    else if (control <= 8) hours = 3.1;
    else hours = 2.2;
  }

  const pickup = answers.pickupReason?.value;
  if (pickup === 'Out of pure habit' || pickup === 'Bored, not sure why') hours += 0.7;
  if (answers.wakeHabit?.value === 'Check my phone') hours += 0.5;
  if (answers.triedBefore?.value === 'Yes, many times') hours += 0.4;
  if (parseAge(answers) < 18) hours = Math.min(hours, hours * 0.9);

  return { hours: Math.min(10, Math.max(1.4, hours)), fromUsage: false };
}

function reductionPercentFor(answers: Answers, dailyHours: number, fromUsage: boolean): number {
  const control = Number(answers.controlScale?.value);
  let pct = 25;
  if (Number.isFinite(control)) {
    if (control <= 3) pct = 35;
    else if (control <= 6) pct = 28;
    else pct = 18;
  }
  if (dailyHours >= 7) pct = Math.max(pct, 32);
  if (dailyHours <= 2.5) pct = Math.min(pct, 20);
  if (answers.lifeChange?.value === 'Yes, recently') pct = Math.max(15, pct - 8);
  if (fromUsage && dailyHours >= 6 && Number.isFinite(control) && control >= 7) {
    // Self-report says they're fine; the clock disagrees. Aim a bit harder.
    pct = Math.max(pct, 30);
  }
  return Math.round(pct);
}

export function buildRecapPlan(answers: Answers, realHours: number | null): RecapPlan {
  const { hours: dailyHours, fromUsage } = estimateDailyHours(answers, realHours);
  const reductionPercent = reductionPercentFor(answers, dailyHours, fromUsage);
  const savedPerDay = dailyHours * (reductionPercent / 100);
  const dailyTarget = Math.max(0.5, dailyHours - savedPerDay);
  const age = parseAge(answers);
  const remainingYears = Math.max(8, LIFE_EXPECTANCY - age);
  const phoneYears = remainingYears * (dailyHours / WAKING_HOURS);
  const reclaimedYears = phoneYears * (reductionPercent / 100);
  const reclaimedDaysThisYear = Math.max(1, Math.round((savedPerDay * 365) / 24));
  const badDaysThisYear = Math.max(1, Math.round((dailyHours * 365) / 24));

  const caresAboutSleep =
    answers.matters?.value === 'Sleep better' || answers.wakeHabit?.value === 'Check my phone';

  const extra = {
    title: `${reductionPercent}% less screen time`,
    desc: `A typical day from about ${formatHoursMinutes(dailyHours)} toward ${formatHoursMinutes(dailyTarget)}.`,
  };

  return {
    dailyHours,
    fromUsage,
    reductionPercent,
    dailyTargetLabel: formatHoursMinutes(dailyTarget),
    phoneYears,
    reclaimedYears,
    reclaimedDaysThisYear,
    badDaysThisYear,
    sleep: caresAboutSleep
      ? {
          title: 'Quieter nights',
          desc: 'Less phone-first waking and fewer late feeds — not a medical sleep score.',
        }
      : answers.matters?.value === 'Be more present'
        ? {
            title: 'More of you in the room',
            desc: 'Blocking the usual suspects during the hours that cost you most.',
          }
        : null,
    extra,
    sourceNote: fromUsage
      ? 'From your device’s last week of Screen Time.'
      : 'Estimated from how you described control and habits — not a reading from the OS.',
  };
}

/**
 * Intensity + which packages to auto-block. Usage can overrule a confident
 * self-report; a fresh life change still pulls us toward Steady.
 */
export function recommendSetup(
  answers: Answers,
  dailyHours: number,
  fromUsage: boolean,
  topPackages: string[] = [],
): SetupRecommendation {
  let score = 0;
  const reasons: string[] = [];

  if (dailyHours >= 6.5) {
    score += 2;
    reasons.push(fromUsage ? 'Your measured screen time is on the high side' : 'Your habits point to a heavy phone day');
  } else if (dailyHours >= 4) {
    score += 1;
  }

  const control = Number(answers.controlScale?.value);
  if (Number.isFinite(control)) {
    if (control <= 3) {
      score += 2;
      reasons.push("You don't feel in charge of the phone right now");
    } else if (control <= 6) {
      score += 1;
    }
  }

  if (fromUsage && dailyHours >= 5.5 && Number.isFinite(control) && control >= 7) {
    score += 2;
    reasons.push("Usage is higher than the control you reported — we'll set the bar from the clock");
  }

  if (answers.triedBefore?.value === 'Yes, many times') {
    score += 2;
    reasons.push("Cutting back hasn't stuck yet — friction has to do more of the work");
  } else if (answers.triedBefore?.value === 'Once or twice') {
    score += 1;
  }

  const stopped = answers.whatStopped?.value;
  if (stopped === 'Willpower runs out by evening' || stopped === 'Other apps make it too easy') {
    score += 1;
    reasons.push('Willpower is the part that usually fails');
  }

  const pickup = answers.pickupReason?.value;
  if (pickup === 'Out of pure habit' || pickup === 'Bored, not sure why') {
    score += 1;
    reasons.push('Most pickups are autopilot');
  }

  if (answers.obstacleFear?.value === "Nothing — I'm ready") score += 1;
  if (answers.obstacleFear?.value === "It'll feel restrictive") score -= 1;

  if (answers.lifeChange?.value === 'Yes, recently') {
    score -= 2;
    reasons.push("Things have been rough lately — we'll start Steady so this doesn't pile on");
  }

  if (answers.healthLimit?.value && answers.healthLimit.value.trim().length > 2) {
    const v = answers.healthLimit.value.trim().toLowerCase();
    if (!['no', 'none', 'nope', 'n/a'].includes(v)) {
      score -= 1;
      reasons.push('Physical unlocks stay optional while we respect what you told us about your body');
    }
  }

  const intensityKey: IntensityKey = score >= 3 ? 'strict' : 'steady';
  if (reasons.length === 0) reasons.push('A balanced read of your answers');

  const known = new Set(DEFAULT_BLOCKED_APPS.map((a) => a.packageName));
  const fromUsagePkgs = topPackages.filter((p) => known.has(p));
  const suggestedPackages =
    fromUsagePkgs.length > 0 ? fromUsagePkgs.slice(0, 6) : DEFAULT_BLOCKED_APPS.slice(0, 4).map((a) => a.packageName);

  return { intensityKey, reasons: reasons.slice(0, 4), suggestedPackages };
}
