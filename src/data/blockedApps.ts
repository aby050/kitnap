export type BlockedApp = { name: string; packageName: string };

/** Common distraction apps by real Android package name — this is what
 *  actually gets checked against the foreground-app events from the
 *  Accessibility Service, not the cosmetic app names shown in MyAppsScreen's
 *  mock UI. Users can't yet edit this list from the UI (AppPickerScreen /
 *  MyAppsScreen are still mock screens with no real package identifiers) —
 *  this default set is what's active until that's wired up for real. */
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
