import { Platform } from 'react-native';

type Native = {
  canDrawOverlays(): boolean;
  openOverlaySettings(): void;
  isAccessibilityServiceEnabled(): boolean;
  openAccessibilitySettings(): void;
  setBlockedPackages(packages: string[]): void;
  grantTemporaryAccess?(grantMinutes: number): void;
  setShieldCopy?(title: string, emphasis: string, body: string, cta: string): void;
  setPausedPackages?(packages: string[]): void;
  setPauseSeconds?(seconds: number): void;
  setPauseCopy?(line: string): void;
  hideShieldOverlay?(): void;
  endGrantNow?(): void;
  getGrantedUntil?(): number;
  setMonitoringLevel(level: string): void;
  isIgnoringBatteryOptimizations(): boolean;
  openBatteryOptimizationSettings(): void;
  startSessionNotification?(endsAt: number, label: string, blockedCount: number): boolean;
  stopSessionNotification?(): boolean;
  isPowerSaveMode?(): boolean;
  setLockdown?(on: boolean): boolean;
  isLockdownOn?(): boolean;
  hasUsageAccess?(): boolean;
  openUsageAccessSettings?(): boolean;
  queryUsageStats?(startMs: number, endMs: number): UsageRow[];
};

export type MonitoringLevel = 'gentle' | 'balanced' | 'strict';

export type UsageRow = {
  packageName: string;
  totalTimeInForeground: number;
  lastTimeUsed: number;
  appName: string;
};

let native: Native | null = null;
if (Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requireNativeModule } = require('expo-modules-core');
    native = requireNativeModule('DevicePermissions');
  } catch {
    native = null;
  }
}

export const devicePermissionsAvailable = () => native !== null;

export const canDrawOverlays = () => native?.canDrawOverlays() ?? false;
export const openOverlaySettings = () => native?.openOverlaySettings();

export const isAccessibilityServiceEnabled = () => native?.isAccessibilityServiceEnabled() ?? false;
export const openAccessibilitySettings = () => native?.openAccessibilitySettings();


export const isIgnoringBatteryOptimizations = () => native?.isIgnoringBatteryOptimizations() ?? false;
export const openBatteryOptimizationSettings = () => native?.openBatteryOptimizationSettings();

export const setBlockedPackages = (packages: string[]) => native?.setBlockedPackages(packages);

/** Tells the Accessibility Service to stand down for `grantMinutes` — the
 *  Android counterpart to iOS's Family Controls grant window. The service
 *  is the only thing that re-shows the shield, so a grant that isn't written
 *  here is a grant the OS side never hears about, and the user gets handed
 *  the challenge again the second they reopen the app they just unlocked. */
export const grantTemporaryAccess = (grantMinutes: number) =>
  native?.grantTemporaryAccess?.(grantMinutes);

/** Ends a running grant immediately ("Done early"). */
export const endGrantNow = () => native?.endGrantNow?.();

/** Epoch millis a running grant ends at, or 0 when none is running. Survives
 *  the JS process, so a cold start can re-adopt a grant instead of re-gating. */
export const grantedUntil = (): number => native?.getGrantedUntil?.() ?? 0;

/** Battery vs. responsiveness tradeoff for the Accessibility Service —
 *  'gentle' checks less often (better battery, shield takes a beat longer
 *  to appear), 'strict' checks almost immediately (worse battery, snappiest
 *  detection). See MonitoringConfigStore.kt for the exact numbers. */
export const setMonitoringLevel = (level: MonitoringLevel) => native?.setMonitoringLevel(level);

/**
 * The words on the Android cover.
 *
 * The overlay is drawn in Kotlin so it can appear in the same frame the
 * blocked app does — which means it cannot ask React Native what to say,
 * because RN may not be running. This pushes the current lines down to disk
 * so the block screen still sounds like the rest of the app instead of like a
 * system dialog. No-op on iOS, where Apple's own shield owns that surface.
 */
/** `emphasis` is the half of the line set in the accent — pass '' for a line
 *  that reads better unbroken. */
export const setShieldCopy = (
  title: string,
  emphasis: string,
  body: string,
  cta: string,
) => native?.setShieldCopy?.(title, emphasis, body, cta);

/** Takes the Android cover down — after a passed challenge, or when the app
 *  underneath stops being blocked. Harmless if nothing is showing. */
export const hideShieldOverlay = () => native?.hideShieldOverlay?.();

/**
 * Apps that get a few seconds of nothing instead of a block.
 *
 * The setting between "blocked" and "fine": a paused app still opens, after a
 * countdown with a way back offered from the first frame. It is for the apps
 * nobody decides to open — the reach is automatic, and the pause is what makes
 * the next moment a choice. Android only; iOS gives no way to interpose on an
 * app launch.
 */
export const setPausedPackages = (packages: string[]) =>
  native?.setPausedPackages?.(packages);

/** Length of that pause, in seconds. Clamped to 3–30 natively. */
export const setPauseSeconds = (seconds: number) => native?.setPauseSeconds?.(seconds);

/** The line under the countdown. A question, not a statistic — see
 *  PauseCopyStore for why a scold is the one thing that must not go here. */
export const setPauseCopy = (line: string) => native?.setPauseCopy?.(line);

/** `icon` is a PNG data URI on Android and always empty on iOS, which never
 *  exposes installed-app icons to third-party apps. */
export const getInstalledApps = async (): Promise<
  { packageName: string; label: string; category: string; icon?: string }[]
> => {
  if (!native || !(native as any).getInstalledApps) return [];
  return await (native as any).getInstalledApps();
};

/**
 * The running session as an ongoing, system-counted notification.
 *
 * Android's answer to a Live Activity. `setUsesChronometer` means the OS ticks
 * the countdown itself — nothing in the app wakes on a timer, so a long
 * session costs no more battery than a short one — and the foreground service
 * stops Android killing the process mid-block.
 */
export const startSessionNotification = (endsAt: number, label: string, blockedCount = 0) =>
  native?.startSessionNotification?.(endsAt, label, blockedCount) ?? false;

export const stopSessionNotification = () => native?.stopSessionNotification?.() ?? false;

/** True while the OS is in battery saver. */
export const isPowerSaveMode = (): boolean => native?.isPowerSaveMode?.() ?? false;

/**
 * Everything shielded except calls, the launcher, System UI, Settings, SMS
 * and alarms — for the length of a session. Settings stays reachable on
 * purpose: a lock the user cannot switch off from their own device is a trap,
 * not a commitment.
 */
export const setLockdown = (on: boolean): boolean => native?.setLockdown?.(on) ?? false;

export const isLockdownOn = (): boolean => native?.isLockdownOn?.() ?? false;

/** Usage access, straight from the appop — see UsageAccess.kt for why this
 *  replaced the npm package that used to answer it. */
export const hasUsageAccess = (): boolean => native?.hasUsageAccess?.() ?? false;

/** True when a Settings screen was actually launched. */
export const openUsageAccessSettings = (): boolean =>
  native?.openUsageAccessSettings?.() ?? false;

export const queryUsageStatsNative = (startMs: number, endMs: number): UsageRow[] =>
  native?.queryUsageStats?.(startMs, endMs) ?? [];
