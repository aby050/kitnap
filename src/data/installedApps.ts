import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getInstalledApps } from 'device-permissions';

export type InstalledApp = {
  packageName: string;
  label: string;
  category?: string;
  icon?: string;
};

/**
 * Every installed app and its real launcher icon, fetched once for the app.
 *
 * Each screen used to decide for itself whether it could get real icons, and
 * most of them could not be bothered — so the same phone showed hand-drawn
 * approximations of Facebook and Instagram on one screen and the genuine
 * launcher icons on another. Worse, the screens with drawn marks could only
 * ever depict the handful of brands somebody had hardcoded; everything else
 * fell back to a letter.
 *
 * So this is the one place that asks. The call crosses the bridge with a few
 * hundred small PNGs, which is not something to repeat per screen, per mount:
 * it is cached at module scope, shared by every subscriber, and only ever
 * refetched when something explicitly asks for it (apps are installed far less
 * often than these screens are opened).
 */
let cache: InstalledApp[] | null = null;
let inflight: Promise<InstalledApp[]> | null = null;
const subscribers = new Set<(apps: InstalledApp[]) => void>();

/** Package name → icon data URI, for the synchronous lookups components do. */
let iconIndex = new Map<string, string>();

function publish(apps: InstalledApp[]) {
  cache = apps;
  iconIndex = new Map(
    apps.filter((a) => !!a.icon).map((a) => [a.packageName, a.icon as string]),
  );
  subscribers.forEach((fn) => fn(apps));
}

export function loadInstalledApps(force = false): Promise<InstalledApp[]> {
  if (Platform.OS !== 'android') return Promise.resolve([]);
  if (cache && !force) return Promise.resolve(cache);
  if (inflight && !force) return inflight;
  inflight = getInstalledApps()
    .then((apps) => {
      publish(apps ?? []);
      return cache ?? [];
    })
    .catch(() => {
      // A failure here is not worth a blank screen: callers fall back to the
      // monogram tile, which is exactly what iOS gets permanently.
      publish([]);
      return [];
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * The real launcher icon for a package, if we have already loaded it.
 *
 * Synchronous on purpose — it is called from render, and an icon that arrives
 * a frame later via the hook below is better than every icon in a list
 * suspending on its own promise.
 */
export function installedIcon(packageName?: string | null): string | undefined {
  if (!packageName) return undefined;
  return iconIndex.get(packageName);
}

export function installedLabel(packageName?: string | null): string | undefined {
  if (!packageName) return undefined;
  return cache?.find((a) => a.packageName === packageName)?.label;
}

/**
 * Subscribe to the list. `null` while the first load is still in flight, so a
 * screen can tell "loading" from "this phone has nothing to show".
 */
export function useInstalledApps(): InstalledApp[] | null {
  const [apps, setApps] = useState<InstalledApp[] | null>(cache);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setApps([]);
      return;
    }
    subscribers.add(setApps);
    void loadInstalledApps();
    return () => {
      subscribers.delete(setApps);
    };
  }, []);

  return apps;
}
