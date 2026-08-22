import { Question } from '../onboarding/questions';

export type CheckIn = {
  date: string; // ISO
  answers: Record<string, { value: string; label: string }>;
};

/** A short re-ask, not a repeat of the full 26-question onboarding — just
 *  enough to see whether perceived control and screen time are trending the
 *  way the stats say they are. */
export const CHECKIN_QUESTIONS: Question[] = [
  {
    id: 'checkin_control',
    kind: 'slider',
    prompt: 'How much control do you feel you have over your phone right now?',
    min: 1,
    max: 10,
    default: 5,
  },
  {
    id: 'checkin_screentime',
    kind: 'choice',
    prompt: "How's your screen time trending since you started?",
    options: ['Down a lot', 'Down a little', 'About the same', 'Up'],
  },
  {
    id: 'checkin_feeling',
    kind: 'choice',
    prompt: 'How do you feel about your progress?',
    options: ['Proud of it', 'Okay, could be better', 'Honestly struggling'],
  },
];

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

/** Due 7 days after the last check-in, or 7 days after first open if none
 *  has happened yet — so day-1 users aren't immediately prompted. */
export function shouldShowCheckIn(lastCheckInDate: string | null, firstOpenDate: string, now = new Date()): boolean {
  const since = lastCheckInDate ? new Date(lastCheckInDate) : new Date(firstOpenDate);
  if (Number.isNaN(since.getTime())) return false;
  return daysBetween(since, now) >= 7;
}

export function latestCheckIn(checkIns: CheckIn[]): CheckIn | null {
  if (checkIns.length === 0) return null;
  return checkIns[checkIns.length - 1];
}
