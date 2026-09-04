const getAppGroupFromExpoConfig = require("react-native-device-activity/config-plugin/getAppGroupFromExpoConfig");

/**
 * DeviceActivityReport extension — the only place iOS lets an app draw real
 * per-app usage numbers. Apple has to approve this extension's own bundle id
 * for the Family Controls entitlement before it will run on-device, same as
 * the other three extensions in ./targets.
 *
 * No built-in "type" for this in @kingstinct/expo-apple-targets, so this
 * borrows "action" purely for generic app-extension plumbing — the
 * Info.plist next to this file overrides its extension point to the real
 * one. IMPORTANT: the config plugin matches an existing target to update by
 * comparing this `type` against every other target's *actual* extension
 * point (see isNativeTargetOfType in @kingstinct/expo-apple-targets) — reusing
 * "device-activity-monitor" here silently merged this config into the
 * unrelated ActivityMonitorExtension target instead of creating a new one.
 * "action" isn't claimed by any of the other ./targets/* folders, so it's
 * safe as a placeholder.
 */
module.exports = (config) => {
  const appGroup = getAppGroupFromExpoConfig(config);
  return {
    // Must differ from the "UsageReport" pod (modules/usage-report) — same
    // name meant same PRODUCT_MODULE_NAME, and both land their compiled
    // .swiftmodule in the same Build/Products directory. Whichever finished
    // last silently won, so the main app was sometimes linking against the
    // *extension's* module (which has no UsageReportModule class) instead of
    // the real host-side pod — "cannot find 'UsageReportModule' in scope".
    name: "UsageReportExtension",
    bundleIdentifier: ".ReportExtension",
    // NOTE: "action" makes the plugin emit a plain app-extension. A
    // DeviceActivityReport is an ExtensionKit extension, and App Store
    // validation rejects the build (409 "must be built as an ExtensionKit
    // extension") when it ships in PlugIns. After any `expo prebuild`,
    // ios/Byre.xcodeproj must be re-patched: productType
    // com.apple.product-type.extensionkit-extension, product fileType
    // wrapper.extensionkit-extension, and the appex moved out of "Embed
    // Foundation Extensions" into an "Embed ExtensionKit Extensions" phase
    // (dstSubfolderSpec 16, dstPath $(EXTENSIONS_FOLDER_PATH)). The
    // Info.plist beside this file already uses EXAppExtensionAttributes.
    type: "action",
    // The plugin's own default here is "18.0" (DEFAULT_DEPLOYMENT_TARGET in
    // @kingstinct/expo-apple-targets), not this app's 16.4 floor — that
    // mismatch is what every "module 'UsageReport' has a minimum deployment
    // target of iOS 18.0" build error traced back to.
    deploymentTarget: "16.4",
    frameworks: ["DeviceActivity", "SwiftUI"],
    entitlements: {
      "com.apple.developer.family-controls": true,
      "com.apple.security.application-groups": [appGroup],
    },
  };
};
