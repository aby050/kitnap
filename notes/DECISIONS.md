# Decisions

Settled rulings for Phonewise (formerly Byre), with the alternatives that were
rejected, so they are not proposed again. Newest first within each section.

---

## iOS platform

### 2026-10-01 — Scene lifecycle is adopted through `expo-build-properties`, not by hand
Apple rejected 1.0.0 build 1 under Guideline 2.1(a): it crashed on launch on an
iPad Air 11-inch (M3) running iPadOS 27.0. An app built with the iOS 27 SDK
(Xcode 27) that has not adopted the UIScene life cycle is killed at launch in
`_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`, before any JS
runs. Neither RN 0.86 nor the Expo SDK 57 template adopted scenes. MigraSync
(1.0.7 build 50) and HolyReads (1.5.8) took the same rejection on 2026-09-22.

Fix, identical to MigraSync's, which is live on the store:
`expo` 57.0.14 → **57.0.24** (57.0.23 is the first patch shipping
`EXExpoAppSceneDelegate` / `ExpoReactNativeFactoryProvider`),
`expo-build-properties` → **57.0.21**, and `ios.enableSceneSupport: true`.
Prebuild then writes a `UIApplicationSceneManifest` pointing at
`EXExpoAppSceneDelegate`, and window creation and `startReactNative` move out
of `AppDelegate` into the scene delegate. The scene delegate copies the window
back onto `AppDelegate.window` and replays cold-start URLs, so the shield's
`phonewise://` handoff keeps working.

It is not iPad-specific. The reviewer happened to use an iPad. Every iOS 27
device crashes the same way.

**Rejected:** adding `UIApplicationSceneManifest` to `ios.infoPlist` by hand.
The manifest alone passes the launch check and then renders a black screen, a
failure that looks like success.
**Rejected:** a local config plugin that patches `AppDelegate.swift`. That was
the community stopgap before Expo shipped the supported property, and it would
need re-checking on every SDK patch.
Expo SDK 58 adopts scenes in its template. Remove the property when upgrading.

**How to verify before submitting:** the iOS 27 simulator runtime is installed.
Build Release for the simulator, then install and launch it on an iPadOS 27
iPad. A build without the fix dies within a second with the trap above in
`~/Library/Logs/DiagnosticReports`.
