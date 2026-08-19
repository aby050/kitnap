export type GoalData = {
  /** Their own words, resurfaces verbatim on the shield. e.g. "I want my evenings back." */
  line: string;
  /** A named deadline the shield does the arithmetic on. e.g. "Exam", "2026-09-20". */
  deadlineName: string;
  deadlineDate: string | null;
  /** A photo they chose — renders as the shield icon in place of the theme glyph. */
  photoUri: string | null;
};

export const EMPTY_GOAL: GoalData = {
  line: '',
  deadlineName: '',
  deadlineDate: null,
  photoUri: null,
};

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr).getTime();
  if (Number.isNaN(target)) return null;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((target - startOfToday) / 86400000);
  return diff;
}
