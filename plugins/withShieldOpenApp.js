/* eslint-disable no-undef */
const fs = require("fs");
const path = require("path");

/**
 * Makes the shield's "Let me in" button actually open Phonewise.
 *
 * This has to be a plugin rather than a plain edit to `targets/`, because
 * react-native-device-activity's own `withCopyTargetFolder` copies that whole
 * folder out of node_modules on every config evaluation — including the
 * "[Expo] Configure project" build phase, which runs immediately before
 * Xcode compiles. Anything hand-edited in `targets/` is silently reverted
 * between saving it and building it. Ask me how I know.
 *
 * Two patches:
 *
 * 1. `openUrl` in Shared.swift. The library calls `open()` on a freshly
 *    allocated `NSExtensionContext` — a context connected to nothing, which
 *    dispatches nowhere and reports success. That dead call is the whole
 *    reason the button looked like an Apple limitation. We reach the real
 *    UIApplication by name and send `openURL:`, which is what every app in
 *    this category does; there is no public API for an extension to launch
 *    its container.
 *
 * 2. ShieldActionExtension.swift posts a notification instead when the launch
 *    can't be dispatched, so the button degrades to one extra tap rather than
 *    to nothing if a future iOS closes that door.
 *
 * List this AFTER "react-native-device-activity" in app.json.
 */

const OLD_OPEN_URL = `func openUrl(urlString: String) {
  guard let url = URL(string: urlString) else {
    return  // be safe
  }

  let context = NSExtensionContext()
  context.open(url) { _ in

  }
}`;

const NEW_OPEN_URL = `/// Brings the containing app to the front from inside an extension.
///
/// - Returns: whether the launch was dispatched. False means the caller
///   should fall back to posting a notification.
@discardableResult
func openUrl(urlString: String) -> Bool {
  guard let url = URL(string: urlString) else {
    return false  // be safe
  }

  guard
    let applicationClass = NSClassFromString("UIApplication") as? NSObject.Type,
    let application = applicationClass.value(forKey: "sharedApplication") as? NSObject
  else {
    logger.log("openUrl: no shared application")
    return false
  }

  // Two selectors, newest first. \`openURL:\` is the one every blog post names,
  // but it is the iOS 9 API and is not always still answered; the three-part
  // form is what UIApplication implements today. Trying both is the
  // difference between this working and silently falling back.
  let modern = NSSelectorFromString("openURL:options:completionHandler:")
  let legacy = NSSelectorFromString("openURL:")

  let attempt: () -> Bool = {
    if application.responds(to: modern) {
      logger.log("openUrl: via openURL:options:completionHandler:")
      _ = application.perform(modern, with: url, with: [String: Any]())
      return true
    }
    if application.responds(to: legacy) {
      logger.log("openUrl: via openURL:")
      _ = application.perform(legacy, with: url)
      return true
    }
    logger.log("openUrl: no usable selector on UIApplication")
    return false
  }

  // Must be on the main thread — this ends up touching UIKit.
  if Thread.isMainThread {
    return attempt()
  }
  return DispatchQueue.main.sync(execute: attempt)
}`;

const OLD_ACTION = `    if type == "openUrl" {
      openUrl(urlString: url ?? "device-activity://")
    }`;

const NEW_ACTION = `    if type == "openUrl" {
      // Falls back to a notification when the launch can't be dispatched, so
      // this button is never dead — see \`openUrl\` in Shared.swift.
      if !openUrl(urlString: url ?? "device-activity://"),
        let payload = configForSelectedAction["fallbackNotification"] as? [String: Any] {
        logger.log("openUrl failed — posting fallback notification")
        sendNotification(contents: payload, placeholders: placeholders)
      }
    }`;

function patch(file, from, to, label) {
  if (!fs.existsSync(file)) return;
  const src = fs.readFileSync(file, "utf8");
  if (src.includes(to)) return; // already patched
  if (!src.includes(from)) {
    throw new Error(
      `withShieldOpenApp: could not find the ${label} block in ${file}. ` +
        `react-native-device-activity probably changed it — re-derive the patch.`,
    );
  }
  fs.writeFileSync(file, src.replace(from, to));
}

const withShieldOpenApp = (config) => {
  const targets = path.join(config._internal.projectRoot, "targets");
  if (!fs.existsSync(targets)) return config;

  for (const dir of fs.readdirSync(targets)) {
    patch(path.join(targets, dir, "Shared.swift"), OLD_OPEN_URL, NEW_OPEN_URL, "openUrl");
  }
  patch(
    path.join(targets, "ShieldAction", "ShieldActionExtension.swift"),
    OLD_ACTION,
    NEW_ACTION,
    "openUrl action",
  );

  return config;
};

module.exports = withShieldOpenApp;
