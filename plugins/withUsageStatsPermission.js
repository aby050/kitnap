const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * PACKAGE_USAGE_STATS is a "special" Android permission — it can't be
 * requested at runtime like camera/location. It must be declared in the
 * manifest, then the user is sent to Settings > Usage Access to grant it
 * manually (that's what showUsageAccessSettings() does).
 */
function withUsageStatsPermission(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    const already = manifest['uses-permission'].some(
      (p) => p.$ && p.$['android:name'] === 'android.permission.PACKAGE_USAGE_STATS',
    );
    if (!already) {
      manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.PACKAGE_USAGE_STATS' },
      });
    }
    return config;
  });
}

module.exports = withUsageStatsPermission;
