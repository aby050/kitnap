# Handoff — Intelligent Strict‑Mode Physical Activity Unlock

**Project:** `screentime-app/` (Expo SDK 57 / RN 0.86.2 / React 19.2.3 / TS ~6.0.3)
**Feature owner file:** `src/shield/ActivityChallenge.tsx`
**Status as of 2026‑08‑23:** Code‑complete, type‑check clean, web‑verified. **Untested on a real device** (the app has never run on device). Everything below the pose tier is designed to fail safe, so the feature is shippable today as an upgrade over the old placeholder even if the device tier needs work.

> **Read this first:** `AGENTS.md` at the repo root says *"Expo HAS CHANGED — Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code."* This is enforced. Don't write RN/Expo code from memory; check the v57 docs and the installed `.d.ts` files.

---

## 1. What the feature is

The Strict‑mode "physical challenge" unlock. When a blocked app is opened, the user must actually do reps (squats / jumping jacks / push‑ups). The old version was a placeholder: a front camera preview plus a "Count a rep" button you could tap without moving. This replaces it with a genuinely intelligent unlock that counts reps from whatever evidence the device can actually provide, and **states plainly which tier it's using** so it never overclaims.

Four tiers, best‑available wins, each degrades safely to the next:

| Tier | Detector | Auto‑count | Form check | Anti‑cheat | Runs on web preview? |
|---|---|---|---|---|---|
| 1. **Pose** (preferred) | VisionCamera v5 frames → fast‑tflite MoveNet → joint‑angle rep FSM | ✅ | ✅ depth / ROM | ✅ pose confidence + cadence | ❌ device only |
| 2. **Camera‑motion** | expo‑camera `<video>` frame‑diff, ~8 fps | ✅ paced | ⚠️ movement only | ✅ needs real in‑frame motion | ✅ |
| 3. **Smart‑manual** | tap‑to‑count + cadence guard | manual | ❌ | ⚠️ timing heuristic | ✅ |
| 4. **Breathing** | existing `BreathingExercise`, when camera denied | n/a | n/a | n/a | ✅ |

**Core design principle — every failure path ends at "no reps counted", never "reps counted wrongly."** No model, wrong‑shape model, no GPU resizer, a throwing worklet, a frozen camera — all of them stop keypoints arriving, a watchdog notices within `STALL_MS`, `available` goes false, and the challenge hands the round down to the tap counter. The user always has a way to finish.

---

## 2. Status detail

- **Phase 1 (Tiers 2–4 + adaptive difficulty + session store):** complete, verified live in the Expo **web** preview.
- **Phase 2 (Tier 1 native pose):** all source written, wired into `ActivityChallenge.tsx`, type‑checks clean. **Never run on a device.**
- **Web regression guard — PASSING.** The web bundle builds (HTTP 200, ~7.4 MB) and **none** of the six native packages leak into it (`react-native-vision-camera`, `react-native-vision-camera-resizer`, `react-native-fast-tflite`, `react-native-nitro-modules` all show 0 references in the web bundle). The base‑file stubs make the native tier fully inert on web. `metro.config.js` did not break the web build.
- **Type‑check:** all Phase‑2 files clean. The only `tsc --noEmit` errors are **not from this feature** — see §6.

---

## 3. File inventory

All under `src/shield/`. The repo uses a **platform‑split** convention: the base file (`X.ts`/`X.tsx`) is the real default `tsc` and web resolve to; a `.native.ts(x)` sibling overrides it on device. Same pattern as the pre‑existing `AppleSignInButton.tsx` / `.ios.tsx` and `useCameraMotion.ts` / `.web.ts`.

| File | Role |
|---|---|
| `ActivityChallenge.tsx` | The screen. Owns the tier ladder, the detector deadline, the manual‑latch logic, session reporting. **Modified** — see §7 for the invariants it must keep. |
| `activity/types.ts` | Shared types: `ActivityKind`, `DetectorTier`, `RejectionReason`, `ActivitySessionResult`, and **`PoseDetector`**. |
| `activity/repEngine.ts` | Pure joint‑angle rep state machine (`feedPose`, `createRepState`, `meanQuality`, `effortProgress`, `rejectionHint`). Unchanged this phase. 17 MoveNet keypoints, rest→effort→rest *traversal* (not peak detection). |
| `activity/poseModel.ts` | **Pure** model spec + validation + decode, no native imports. `POSE_INPUT` (192×192 interleaved RGB uint8, `contain`), `validatePoseModel(inputs, outputs)`, `readKeypoints(buffer, into[])` (worklet). This is where the tier's most dangerous failure — a wrong model producing plausible garbage — is caught by a testable pure function. |
| `activity/poseModelSource.ts` | Base stub: `POSE_MODEL_URL=''`, `resolvePoseModel()→null`. |
| `activity/poseModelSource.native.ts` | Runtime model location. Order: bundled → `<documents>/models/movenet.tflite` (size‑checked) → download if `POSE_MODEL_URL` set. Never a static `require()` (a missing static asset is a **fatal bundle error**), never throws. |
| `activity/usePoseDetector.ts` | Base stub hook — always returns unavailable. What web + `tsc` resolve to. |
| `activity/usePoseDetector.native.ts` | **The Phase‑2 heart.** Camera frame → GPU resize → MoveNet → 51 floats → `feedPose`. Thin worklet, stateful JS. Watchdog, mirror throttling, model load + validation. |
| `activity/PosePreview.tsx` | Base/web preview — plain expo‑camera `CameraView`. |
| `activity/PosePreview.native.tsx` | Device preview — the **only** place that decides which camera library opens the hardware: VisionCamera when pose is running, a black panel while deciding, expo‑camera otherwise. |
| `activity/frameClock.ts` | Infers the camera timestamp unit (s / ms / µs / ns) from a median of samples so cadence math is unit‑correct. |
| `activity/useCameraMotion.web.ts` | Tier‑2 web motion detector. **Untouched by Phase 2** — no regression vector from this phase. |
| `activity/tapGuard.ts` | Tier‑3 cadence‑guarded tap counter. Unchanged. |
| `metro.config.js` | Adds `'tflite'` to `resolver.assetExts`. **New.** |

---

## 4. Landmines — do not step on these

1. **`AGENTS.md` rule** — check v57 docs / installed `.d.ts` before writing Expo/RN code.
2. **Platform‑split self‑import trap.** A `.native.ts` file importing `./X` resolves to **itself**. That's why `PoseDetector` lives in `types.ts` (not in `usePoseDetector.ts`) and why `PosePreviewProps` is *re‑declared* in `PosePreview.native.tsx` rather than imported. Follow this or you'll create infinite‑resolution / duplicate‑symbol bugs.
3. **Static `require()` of a missing binary asset fails the entire bundle.** The model is loaded at runtime via a path, never `require`d. Keep it that way.
4. **Never dispose the tflite model or the resizer.** Both are held by a live frame callback on another thread; tearing them down mid‑flight is a use‑after‑free. `useResizer` doesn't dispose either. This is deliberate, not an oversight.
5. **`useFrameOutput`'s default `onFrameDropped` logs a `console.warn` per dropped frame.** We pass an explicit no‑op because `dropFramesWhileBusy: true` is the intended back‑pressure and would otherwise spam constantly.
6. **The model must be the `uint8` (int8) MoveNet variant.** `validatePoseModel` *rejects* float builds on purpose — adapting the resizer to a float model would mean swapping a native GPU‑memory object mid‑session. One resizer, one code path.
7. **Concurrent sessions.** As of this writing, **other Claude sessions are actively editing the onboarding screens in this same repo** and starting/killing Expo servers on ports 8081/8082. If a dev server "vanishes" or onboarding files change under you, that's why. Don't fight them for a port; check `netstat`/`Get-CimInstance` for who owns it.

---

## 5. Pending tasks (prioritized, actionable)

### P0 — Acquire & place the MoveNet model *(prerequisite for Tier 1 to do anything)*
The model is **not bundled** (Kaggle licence‑gated, and a missing static asset is a fatal bundle error).

1. Kaggle (free account) → search **"MoveNet SinglePose Lightning"** → **TFLite** format → the **int8** variant (~2.9 MB). Direct: https://www.kaggle.com/models/google/movenet
2. Rename to `movenet.tflite`.
3. Place at the app's documents dir: `<documents>/models/movenet.tflite`. `poseModelSource.native.ts` size‑checks it (`MIN_MODEL_BYTES = 500_000`) and rejects truncated files.
   - Alternative: set `POSE_MODEL_URL` in `poseModelSource.native.ts` to an authenticated/self‑hosted URL and it will download + cache on first run.
4. Sanity: it must be `[1,192,192,3] uint8` input, `[1,1,17,3] float32` output (51 floats). Any other shape/dtype is refused by `validatePoseModel` with a logged reason.

### P0 — Build & validate on a real device *(the only real test of Tier 1)*
Cannot be done without hardware + native toolchain.

```bash
cd screentime-app
npx expo prebuild          # generates ios/ + android/ ; first time this repo has done this
npx expo run:android       # or: npx expo run:ios  (needs Xcode/macOS)
```

Watch for, in order:
- **Prebuild/autolinking**: `react-native-fast-tflite` is a **Nitro module** — confirm nitrogen codegen runs and links. (Runtime JS peer is `*`, so there's no JS‑level version conflict with `react-native-nitro-modules@0.37.0`; the risk is purely native codegen at build time.)
- **Camera permission** prompt appears; preview shows front camera.
- With the model present: standing in frame → hint "Got you. Go when you're ready." → doing squats increments the ring and fires a haptic per rep.
- Kill the model file → tier must fall to the tap counter within ~2.5 s (watchdog), never count fake reps.
- Prop the phone at an empty wall → **zero** reps counted.

### P1 — Declare `react-native-worklets` as a direct dependency
`usePoseDetector.native.ts` imports `scheduleOnRN` from `react-native-worklets`, but it's only present **transitively** (`0.10.4`, not in `package.json`). It resolves today because VisionCamera v5 pulls it in, but a direct import should be a direct dep:

```bash
cd screentime-app && npx expo install react-native-worklets
```
(Web is unaffected — the base file has no such import.)

### P2 — Copy honesty (product decision, ~2 min each)
- `src/data/themes.ts:128` (`challengeTypes`) promises *"Real movement, counted by camera — every unlock."* On native with no model it falls straight to the tap counter, so this overpromises. Consider softening.
- On native with no pose tier, `PosePreview` still shows a live expo‑camera preview while `TIER_NOTE.manual` says the device *can't* watch the movement. Kept deliberately (matches today's behaviour; web's motion tier needs the `<video>` mounted), but it's a possible honesty follow‑up.

---

## 6. Errors that are NOT this feature (leave alone / report to their owner)
`tsc --noEmit` currently reports these — all from the **concurrent onboarding refactor**, none from the activity unlock:
- `src/components/ui.tsx:107` & `:108` — `StyleSheet.absoluteFillObject` doesn't exist in RN 0.86.2's types (it exists at runtime; types‑only gap). One‑line fix (`absoluteFill`), but pre‑existing and unrequested.
- `src/onboarding/EducationScreen.tsx` — 6× `Cannot find name 'colors'`. That screen is mid‑refactor (`colors` → `palette`) by another session; it has **zero** activity imports. Not ours.

---

## 7. Spec invariants `ActivityChallenge.tsx` must keep (from the original notes)
Do not "clean these up" without understanding them:
- Keep the `qBody` / `prompt` / `hint` style names and the legacy `colors` import from `../theme`.
- Keep the privacy line verbatim: **"Nothing is recorded or leaves your phone."**
- Camera denied → offer `BreathingExercise` (Tier 4), not a fight about permissions.
- Per‑rep haptic is `tapMedium()`.
- **Do NOT call `success()` on completion** — the parent `grant()` already does. Calling it here double‑fires.
- `onDone()` fires **exactly once** (guarded by the `finished` ref).
- `onComplete(session)` reports the attempt for adaptive difficulty. It fires on completion **or** on falling back to breathing — **never on a token skip** (a skip is not a workout and is handled a level up).
- A slow‑warming camera must not strand the user: `DETECTOR_DEADLINE_MS = 6000` drops to manual if no tier produces frames.
- Once taps are on the board, the manual tier **latches** (`manualLatched`) — a camera recovering mid‑set must not swap the rep source out from under earned taps.

---

## 8. How to verify

**Web (here, no device):**
```bash
cd screentime-app && npx expo start --web
```
- Regression guard: the bundle builds and no native package name appears in it (native tier inert on web).
- Tier‑2 motion should count reps when you move in front of the webcam; Tier‑3 manual works with the cadence guard.

**Device:** see P0 above.

---

*Generated 2026‑08‑23. If anything here contradicts the code, trust the code and update this file.*
