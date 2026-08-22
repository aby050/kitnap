import { Platform } from 'react-native';

export type AppUsage = { packageName: string; totalTimeInForeground: number; lastTimeUsed: number };

/** Real device usage data. Only present in a native build with the
 *  usage-stats module linked (not Expo Go, not web) — every export here
 *  degrades to a safe no-op/false outside that, so importing this file never
 *  crashes the web preview or an unbuilt dev client. */
let native: typeof import('@brighthustle/react-native-usage-stats-manager') | null = null;
if (Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    native = require('@brighthustle/react-native-usage-stats-manager');
  } catch {
    native = null;
  }
}

export const usageStatsAvailable = () => Platform.OS === 'android' && native !== null;

export async function checkUsageAccessPermission(): Promise<boolean> {
  if (!native) return false;
  try {
    return !!(await native.checkForPermission());
  } catch {
    return false;
  }
}

/** Deep-links into Settings > Usage Access — this is a "special" Android
 *  permission with no runtime prompt, so the user has to grant it there. */
export function openUsageAccessSettings() {
  if (!native) return;
  native.showUsageAccessSettings('');
}

export async function queryDailyUsage(startMs: number, endMs: number): Promise<AppUsage[]> {
  if (!native) return [];
  try {
    const result = await native.queryUsageStats(native.EventFrequency.INTERVAL_DAILY, startMs, endMs);
    if (!Array.isArray(result)) return [];
    return result
      .filter((r: AppUsage) => r.totalTimeInForeground > 0)
      .sort((a: AppUsage, b: AppUsage) => b.totalTimeInForeground - a.totalTimeInForeground);
  } catch {
    return [];
  }
}

export async function queryTodayUsage(): Promise<AppUsage[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return queryDailyUsage(start, now.getTime());
}
