const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Signs Android release builds with the upload keystore instead of the debug one.
 *
 * `android/` is generated and gitignored, so a hand-edit to build.gradle is
 * lost on the next prebuild — hence a plugin. The credentials themselves stay
 * out of the repo: they're read at build time from `android/keystore.properties`
 * (also gitignored), and if that file is missing the release build falls back
 * to debug signing so a plain `assembleRelease` still works locally.
 */
const SIGNING_CONFIG = `
        release {
            def props = new Properties()
            def propsFile = rootProject.file('keystore.properties')
            if (propsFile.exists()) {
                props.load(new FileInputStream(propsFile))
                storeFile file(props['storeFile'])
                storePassword props['storePassword']
                keyAlias props['keyAlias']
                keyPassword props['keyPassword']
            }
        }
`;

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;

    if (!gradle.includes("rootProject.file('keystore.properties')")) {
      gradle = gradle.replace(
        /(signingConfigs \{\n)/,
        `$1${SIGNING_CONFIG}`,
      );
    }

    // Release builds ship debug-signed out of the box; point them at the
    // upload key, but only when the properties file is actually present.
    // Anchored on the template's own comment so it can only ever hit the
    // release build type — matching on `signingConfigs.debug` alone also
    // caught the debug build type sitting a few lines above it.
    gradle = gradle.replace(
      /(see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\n\s*)signingConfig signingConfigs\.debug/,
      "$1signingConfig rootProject.file('keystore.properties').exists() ? signingConfigs.release : signingConfigs.debug",
    );

    cfg.modResults.contents = gradle;
    return cfg;
  });
};
