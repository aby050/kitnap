import { Platform } from 'react-native';

type Native = {
  canDrawOverlays(): boolean;
  openOverlaySettings(): void;
  isAccessibilityServiceEnabled(): boolean;
  openAccessibilitySettings(): void;
  isNotificationListenerEnabled(): boolean;
  openNotificationListenerSettings(): void;
  setBlockedPackages(packages: string[]): void;
  setMonitoringLevel(level: string): void;
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

export const setBlockedPackages = (packages: string[]) => native?.setBlockedPackages(packages);

/** Battery vs. responsiveness tradeoff for the Accessibility Service —
 *  'gentle' checks less often (better battery, shield takes a beat longer
 *  to appear), 'strict' checks almost immediately (worse battery, snappiest
 *  detection). See MonitoringConfigStore.kt for the exact numbers. */
export const setMonitoringLevel = (level: MonitoringLevel) => native?.setMonitoringLevel(level);

export const getInstalledApps = async (): Promise<{ packageName: string; label: string; category: string }[]> => {
  if (!native || !(native as any).getInstalledApps) return [];
  return await (native as any).getInstalledApps();
};
