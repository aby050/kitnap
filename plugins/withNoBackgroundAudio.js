const { withInfoPlist } = require('expo/config-plugins');

/**
 * Strips "audio" from UIBackgroundModes.
 *
 * Kitnap has no persistent background audio. The sound picker in SoundScreen
 * plays only while the screen is open — nothing continues once the app is
 * backgrounded. But `expo-audio`'s config plugin adds the background-audio
 * mode by default, and version 1.0.0 (6) shipped with a bare "expo-audio"
 * entry, so the built Info.plist declared UIBackgroundModes: ["audio"] with
 * no feature behind it. App Review rejected that under guideline 2.5.4 on
 * 2026-09-09.
 *
 * `enableBackgroundPlayback: false` in app.json is the first line of defence.
 * This plugin is the second, and it is the one that cannot silently regress:
 * it runs after expo-audio and removes the mode whatever the upstream plugin
 * decided. If Kitnap ever gains a real background-audio feature, delete this
 * plugin — do not work around it — and film the screen recording Apple asks
 * for in that rejection.
 */
module.exports = function withNoBackgroundAudio(config) {
  return withInfoPlist(config, (cfg) => {
    const modes = cfg.modResults.UIBackgroundModes;
    if (!Array.isArray(modes)) return cfg;
    const next = modes.filter((m) => m !== 'audio');
    if (next.length === 0) delete cfg.modResults.UIBackgroundModes;
    else cfg.modResults.UIBackgroundModes = next;
    return cfg;
  });
};
