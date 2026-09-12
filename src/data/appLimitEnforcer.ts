import { AppLimit } from './store';

export type AppUsageEntry = {
  packageName: string;
  label: string;
  minutes: number;
};

/**
 * Returns the set of package names that have exceeded their configured daily
 * limit. Android-only: `useTodayUsage` provides the per-app minute figures;
 * on iOS this always returns an empty set because Apple gives no equivalent
 * read access.
 *
 * @param appLimits   The user's configured per-app limits.
 * @param usageApps   Today's per-app usage from `useTodayUsage().apps`.
 * @returns           A Set of package names whose limit has been reached.
 */
export function limitExceededPackages(
  appLimits: AppLimit[],
  usageApps: AppUsageEntry[],
): Set<string> {
  const exceeded = new Set<string>();
  if (!appLimits || appLimits.length === 0) return exceeded;

  // Build a fast lookup: packageName → minutes used today.
  const usageMap = new Map<string, number>();
  for (const entry of usageApps) {
    usageMap.set(entry.packageName, entry.minutes);
  }

  for (const limit of appLimits) {
    if (!limit.packageName || !Number.isFinite(limit.limitMinutes) || limit.limitMinutes <= 0) {
      continue;
    }
    const used = usageMap.get(limit.packageName) ?? 0;
    if (used >= limit.limitMinutes) {
      exceeded.add(limit.packageName);
    }
  }

  return exceeded;
}

/**
 * Returns the limits that were newly crossed between two usage snapshots.
 * Used to fire a one-time alert when a limit is first hit rather than on
 * every refresh.
 *
 * @param appLimits       The user's configured per-app limits.
 * @param previousUsage   Usage snapshot from the previous refresh.
 * @param currentUsage    Usage snapshot from the current refresh.
 * @returns               AppLimit entries whose limit was crossed in this interval.
 */
export function newlyExceededLimits(
  appLimits: AppLimit[],
  previousUsage: AppUsageEntry[],
  currentUsage: AppUsageEntry[],
): AppLimit[] {
  const wasExceeded = limitExceededPackages(appLimits, previousUsage);
  const nowExceeded = limitExceededPackages(appLimits, currentUsage);
  return appLimits.filter(
    (l) => nowExceeded.has(l.packageName) && !wasExceeded.has(l.packageName),
  );
}
