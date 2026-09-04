import { Platform } from 'react-native';

type Native = {
  canDrawOverlays(): boolean;
  openOverlaySettings(): void;
  isAccessibilityServiceEnabled(): boolean;
  openAccessibilitySettings(): void;
  isNotificationListenerEnabled(): boolean;
  openNotificationListenerSettings(): void;
  setBlockedPackages(packages: string[]): void;
  grantTemporaryAccess?(grantMinutes: number): void;
  endGrantNow?(): void;
  getGrantedUntil?(): number;
  setMonitoringLevel(level: string): void;
  isIgnoringBatteryOptimizations(): boolean;
  openBatteryOptimizationSettings(): void;
  startSessionNotification?(endsAt: number, label: string, blockedCount: number): boolean;
  stopSessionNotification?(): boolean;
  isPowerSaveMode?(): boolean;
};

export type MonitoringLevel = 'gentle' | 'balanced' | 'strict';

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

export const isNotificationListenerEnabled = () => native?.isNotificationListenerEnabled() ?? false;
export const openNotificationListenerSettings = () => native?.openNotificationListenerSettings();

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
