import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { AppUsage, checkUsageAccessPermission, queryTodayUsage, usageStatsAvailable } from './androidUsage';
import { DEFAULT_BLOCKED_APPS } from './blockedApps';

export type TodayUsage = {
  /** null while we haven't resolved yet — distinct from "resolved, but zero". */
  totalMinutes: number | null;
  apps: { packageName: string; label: string; minutes: number }[];
  available: boolean;
  granted: boolean;
  refresh: () => void;
};

/** Maps a raw Android package name to a friendly label when we know it,
 *  otherwise strips the reverse-DNS prefix so it's at least readable. */
function labelFor(packageName: string): string {
  const known = DEFAULT_BLOCKED_APPS.find((a) => a.packageName === packageName);
  if (known) return known.name;
  const parts = packageName.split('.');
  const tail = parts.length > 2 ? parts[parts.length - 1] : packageName;
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

/**
 * Real per-app screen time for today, from Android's UsageStatsManager.
 * Everywhere else (iOS, web) this resolves to available:false and callers
 * are expected to show an honest empty state rather than invented numbers —
 * iOS deliberately gives apps no equivalent read access (Apple hands out
 * opaque tokens, never usage figures).
 */
export function useTodayUsage(): TodayUsage {
  const [totalMinutes, setTotalMinutes] = useState<number | null>(null);
  const [apps, setApps] = useState<TodayUsage['apps']>([]);
  const [granted, setGranted] = useState(false);
  const available = usageStatsAvailable();

  const refresh = useCallback(async () => {
    if (!usageStatsAvailable()) {
      setTotalMinutes(0);
      setApps([]);
      return;
    }
    const has = await checkUsageAccessPermission();
    setGranted(has);
    if (!has) {
      setTotalMinutes(0);
      setApps([]);
      return;
    }
    const raw: AppUsage[] = await queryTodayUsage();
    const mapped = raw
      .map((u) => ({
        packageName: u.packageName,
        label: labelFor(u.packageName),
        minutes: Math.round(u.totalTimeInForeground / 60000),
      }))
      .filter((u) => u.minutes >= 1);
    setApps(mapped);
    setTotalMinutes(mapped.reduce((sum, u) => sum + u.minutes, 0));
  }, []);

  useEffect(() => {
    refresh();
    // Usage changes while the user is away, so re-read on foreground rather
    // than polling on a timer (which would cost battery for no benefit).
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return { totalMinutes, apps, available, granted, refresh };
}
