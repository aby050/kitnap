const { withXcodeProject } = require('expo/config-plugins');

/**
 * Makes every target iPhone + iPad (TARGETED_DEVICE_FAMILY "1,2").
 *
 * `ios.supportsTablet` in app.json sets the device family on the app target
 * and nothing else, so the app extensions (shield, monitor, report, live
 * timer) would otherwise keep whatever their templates declared. An extension
 * advertising a different device family from its host is an inconsistency
 * Apple's validator has been known to flag.
 *
 * Phonewise runs natively on iPad since 1.0.0 build 2: the app renders in a
 * phone-width centred column there (src/layout.ts), portrait only
 * (UIRequiresFullScreen).
 *
 * A plugin rather than an edit to `ios/`, because `expo prebuild` regenerates
 * the pbxproj and would silently take a hand edit back with it.
 */
module.exports = function withDeviceFamily(config) {
  return withXcodeProject(config, (cfg) => {
    const configurations = cfg.modResults.pbxXCBuildConfigurationSection();

    for (const key of Object.keys(configurations)) {
      const entry = configurations[key];
      // The section also holds comment entries keyed by `<uuid>_comment`.
      if (!entry || typeof entry !== 'object' || !entry.buildSettings) continue;
      if (entry.buildSettings.TARGETED_DEVICE_FAMILY === undefined) continue;
      entry.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
    }

    return cfg;
  });
};
