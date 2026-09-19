import { Linking, Platform } from 'react-native';
import {
  devicePermissionsAvailable,
  hasUsageAccess,
  openUsageAccessSettings as openUsageAccessNative,
  queryUsageStatsNative,
} from 'device-permissions';

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

/**
 * Usage data is reachable at all.
 *
 * Our own Expo module is the real provider now (see below); the old package
 * is kept only as a fallback for a build where the module is missing.
 */
export const usageStatsAvailable = () =>
  Platform.OS === 'android' && (devicePermissionsAvailable() || native !== null);

export async function checkUsageAccessPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  // Our own module first. The third-party one is unavailable entirely under
  // the New Architecture (its @ReactMethod annotations fail TurboModule
  // interop parsing), so asking it first meant every check answered "no" on a
  // device that had already granted access.
  if (devicePermissionsAvailable()) return hasUsageAccess();
  if (!native) return false;
  try {
    return !!(await native.checkForPermission());
  } catch {
    return false;
  }
}

/**
 * Deep-links into Settings › Usage access — a "special" Android permission
 * with no runtime prompt, so the user has to grant it there themselves.
 *
 * Three routes, tried in order, because one is not enough. The library's
 * `showUsageAccessSettings` is a bare `ACTION_USAGE_ACCESS_SETTINGS` intent,
 * and on MIUI/HyperOS (and some other OEM skins) that activity is not
 * exported the way AOSP exports it — the intent resolves to nothing and the
 * tap does *absolutely nothing*, with no error to catch. A permission button
 * that silently does nothing is indistinguishable from a broken app.
 *
 * So: the library first, then the same intent via `Linking.sendIntent`, then
 * this app's own settings page, which exists on every device ever shipped and
 * is one tap from the special-access list. Getting the user *near* the switch
 * beats leaving them on a dead button.
 */
export async function openUsageAccessSettings() {
  if (Platform.OS !== 'android') return;

  // Our own module resolves the intent before firing it and falls back to this
  // app's settings page, which is the same dance as below but without the
  // silent-no-op case.
  if (devicePermissionsAvailable() && openUsageAccessNative()) return;

  if (native) {
    try {
      native.showUsageAccessSettings('');
      return;
    } catch {
      // Falls through — but note the silent case this cannot catch: the
      // intent resolving to nothing throws nothing at all.
    }
  }

  try {
    await Linking.sendIntent('android.settings.USAGE_ACCESS_SETTINGS');
    return;
  } catch {
    // No such activity on this ROM.
  }

  try {
    await Linking.openSettings();
  } catch {
    // Nothing more we can do from here; the UI still shows the manual path.
  }
}

export async function queryDailyUsage(startMs: number, endMs: number): Promise<AppUsage[]> {
  if (devicePermissionsAvailable()) {
    const rows = queryUsageStatsNative(startMs, endMs);
    if (rows.length > 0) return rows;
    // Empty is a real answer (a fresh day, or access not granted) — don't fall
    // through to a package that cannot load anyway.
    return [];
  }
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
