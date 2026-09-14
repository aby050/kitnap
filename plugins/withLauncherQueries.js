/* eslint-disable no-undef */
const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Declares the launcher-app <queries> the app actually needs, instead of
 * holding QUERY_ALL_PACKAGES.
 *
 * Android 11 hid the installed-app list behind package visibility. The blunt
 * answer is QUERY_ALL_PACKAGES, which is what this app shipped — and Play
 * treats it as a sensitive permission needing a declaration form, refusing
 * the release without one. We never needed it: `getInstalledApps` only ever
 * calls `queryIntentActivities` for MAIN/LAUNCHER (see
 * DevicePermissionsModule.kt), and a <queries> element granting visibility of
 * exactly those apps covers that call with no permission and no form.
 *
 * Keep this in step with the Kotlin side: widen the query there and this has
 * to widen too, or the results quietly come back empty on Android 11+.
 */
const withLauncherQueries = (config) =>
  withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // Drop the permission itself — leaving it declared is what Play flags,
    // whether or not anything reads it.
    if (Array.isArray(manifest['uses-permission'])) {
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (p) => p.$?.['android:name'] !== 'android.permission.QUERY_ALL_PACKAGES',
      );
    }

    const queries = manifest.queries ?? [];
    const already = queries.some((q) =>
      (q.intent ?? []).some((i) =>
        (i.action ?? []).some((a) => a.$?.['android:name'] === 'android.intent.action.MAIN'),
      ),
    );
    if (!already) {
      queries.push({
        intent: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
            category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
          },
        ],
      });
    }
    manifest.queries = queries;

    return cfg;
  });

module.exports = withLauncherQueries;
