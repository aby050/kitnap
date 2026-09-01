// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ship .tflite models as assets rather than source. Without this, Metro tries to
// parse the pose model as JavaScript and the bundle fails outright — see
// src/shield/activity/poseModel.ts for what gets loaded and why it's optional.
config.resolver.assetExts.push('tflite');

module.exports = config;
