import { ImageSourcePropType } from 'react-native';

export type BlockedApp = {
  name: string;
  packageName: string;
  /** Bundled brand icon. Android supplies real launcher icons at runtime, but
   *  iOS never exposes installed-app icons to third-party apps, so the curated
   *  list needs its own artwork there. Drop PNGs into assets/appicons/ and
   *  point at them here; rows fall back to a monogram tile until you do. */
  icon?: ImageSourcePropType;
};

/** Common distraction apps by real Android package name — this is what
 *  actually gets checked against the foreground-app events from the
 *  Accessibility Service. Used as the initial value of `blockedPackages`
 *  before onboarding's AppPickerScreen (which reads the device's real
 *  installed-app list via the native `getInstalledApps()` module) or the
 *  Settings-side BlockedAppsScreen ever runs. */
export const DEFAULT_BLOCKED_APPS: BlockedApp[] = [
  { name: 'Instagram', packageName: 'com.instagram.android' },
  { name: 'Facebook', packageName: 'com.facebook.katana' },
  { name: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
  { name: 'X (Twitter)', packageName: 'com.twitter.android' },
  { name: 'YouTube', packageName: 'com.google.android.youtube' },
  { name: 'Snapchat', packageName: 'com.snapchat.android' },
  { name: 'Reddit', packageName: 'com.reddit.frontpage' },
];

export const DEFAULT_BLOCKED_PACKAGES = DEFAULT_BLOCKED_APPS.map((a) => a.packageName);
