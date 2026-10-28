const { withXcodeProject } = require('expo/config-plugins');

/**
 * Forces every target to iPhone-only.
 *
 * `ios.supportsTablet: false` in app.json sets TARGETED_DEVICE_FAMILY = 1 on
 * the app target and nothing else, so the five app extensions kept declaring
 * "1,2" — iPhone and iPad. The app itself governs where the listing appears,
 * so this was not putting Kitnap on iPad, but it is a real inconsistency: an
 * extension advertising a device family its host does not support, which
 * Apple's validator has been known to flag and which makes the project read
 * as if iPad were half-intended.
 *
 * Kitnap is iPhone-only on purpose. Every blocking surface it has — the shield,
 * the gate, the Screen Time report — is designed for a phone held in one
 * hand, and an iPad build would need its own layouts, its own screenshots and
 * its own review.
 *
 * A plugin rather than an edit to `ios/`, because `expo prebuild` regenerates
 * the pbxproj and would silently take a hand edit back with it.
 */
module.exports = function withIPhoneOnlyExtensions(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();

    for (const key of Object.keys(configurations)) {
      const entry = configurations[key];
      // The section also holds comment entries keyed by `<uuid>_comment`.
      if (!entry || typeof entry !== 'object' || !entry.buildSettings) continue;
      if (entry.buildSettings.TARGETED_DEVICE_FAMILY === undefined) continue;
      entry.buildSettings.TARGETED_DEVICE_FAMILY = '"1"';
    }

    return cfg;
  });
};
