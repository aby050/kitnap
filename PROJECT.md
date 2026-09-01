# Wend — Project Concept & Status

Screen-time / focus app. Expo SDK 57, TypeScript, React Native. Android is the
primary target (real Accessibility Service blocking, real usage-stats,
real installed-app enumeration); iOS support exists via Apple's Screen Time
API (FamilyControls / DeviceActivity extensions) as a second, more
constrained path. Everything is **local-only** — no backend, no server sync.
This document describes only what is actually built and wired, screen by
screen, plus what's agreed but not yet done.

---

## 1. The concept

Wend blocks distracting apps and only lets you back in through one of two
doors: **do something real** (a math/quiz challenge or physical activity,
depending on the mode you chose) or **spend an emergency token** to skip it.
Two free tokens come with the app, forever — spending more than that requires
buying more (not wired yet — see §7).

The same "locked, no free way out" idea also runs the **focus timer**: once
you start a timed session, it can't be cancelled for free. The only way out
early is the same emergency token.

Two intensity modes, no more, no less:

| Mode | Challenge | What it costs to skip |
|---|---|---|
| **Steady** | Math problem, quiz question, or a breathing pause (rotates so it can't be memorized) | 1 emergency token |
| **Strict** | Real physical activity — push-ups, squats, jumping jacks (camera stays up so it can't be faked from a pocket) | 1 emergency token |

If the user flagged a health/mobility limitation during onboarding, Strict
mode always falls back to the Steady-style quiz challenge instead of
physical activity — never negotiable, never overridden.

**Design principles actually enforced in the code:**
- No fake numbers, no invented reviews/download counts anywhere in the app.
- No self-reported data the app can read for real (screen time, most-used
  app) — it reads real Android usage stats instead once permission is
  granted.
- Every Settings row opens something real. Nothing points nowhere.
- Emergency/break-glass access (separate from tokens) is always free,
  always instant, on every blocking screen, no exceptions.
- All emoji used as **UI chrome** (buttons, icons, checkmarks) were replaced
  with real vector icons. Emoji used as **decorative content** (World
  landmark glyphs, theme glyphs, sound glyphs) were deliberately left alone
  — that's a separate illustration project, not a chrome cleanup.

---

## 2. Full screen-by-screen flow

### First run (onboarding)

1. **Splash** (`SplashFlow`) — two-slide brand moment ("Wend only reveals
   its fire...", then "Dimmed by noise, apps..."), tap to advance.
2. **Education** (`EducationScreen`) — 7-slide explainer carousel (why this
   app exists, no-icons philosophy, "it's not your lack of willpower",
   ending on "Let's build your custom setup" with the app orb on a
   pedestal). The orb visually lifts off the pedestal on the last slide
   before handing off to the next screen, so the transition reads as one
   continuous motion.
3. **Permission Boarding Pass** (`PermissionBoardingPassScreen`) — **all 5
   real permissions asked upfront**, one boarding-pass-style card at a time
   (icon, "AUTHORIZATION REQUIRED", plain-English reason, Grant/Skip):
   1. Display over other apps (draw the shield)
   2. Screen time access (real usage stats)
   3. Accessibility (detect a blocked app opening)
   4. Notification access
   5. Battery-optimization exemption ("Uninterrupted sessions" — stops
      Android from pausing the block mid-session)
4. **Onboarding questions** (`OnboardingFlow` + `questions.ts`) — a single
   conversational Q&A stack (typewriter-style prompts, answered history
   scrolls above). Real questions still in the stack: name, returning-user
   check, what matters most, pickup-reason, wake-habit, age, what best
   describes you, control-over-phone scale, eyesight, health/mobility
   limitation (free text — used later to gate physical challenges), what
   distraction has cost you, tried-before history, what gets in the way,
   biggest fear about trying again, one-line aspiration, interests (used to
   suggest a theme), recent-life-change check, "reel life or real life."
   **Removed** (now answered by real data or cut as not real features):
   self-reported "where do you lose time," "average screen time," gender,
   "which devices to guard."
5. **Momentum** (`AffirmationScreen`) — one-line encouragement between
   onboarding and the post-onboarding sequence.
6. **Post-onboarding** (`PostOnboardingFlow`) — analyzing animation, then:
   - Real-usage-based "bad news" (days/years lost) and "good news"
     (years reclaimable) projections — uses a real 7-day average from
     Android usage stats when permission was granted, generic fallback
     numbers otherwise (never shown mixed).
   - Real biggest-distraction app list (top apps by real usage, real
     names) with a remove-from-list option — mock list only as fallback.
   - "How it works" demo (notice → gentle interrupt) illustration.
   - Final summary card + "Let's Do It."
7. **Trust Promise** (`TrustPromiseScreen`) — explicit "you can turn this
   off in Settings, we're not going to pretend otherwise" honesty screen.
8. **Goal** (`GoalScreen`) — free-text goal line + optional photo + optional
   deadline, resurfaces later on the shield screen.
9. **Theme picker** (`ThemePickerScreen`) — visual theme selection (Deep
   Work / Health & Sleep / Presence / Craft / Learning / Quiet), suggested
   theme pre-highlighted from onboarding interests.
10. **Ground Rules** (`GroundRulesScreen`) — what's about to happen next,
    framing screen.
11. **App picker** (`AppPickerScreen`, Android) — real installed-app list
    (native `getInstalledApps()`), category grouping, search. Selections
    are filtered to real package names and persisted as `blockedPackages`
    (this used to be collected and silently discarded — now wired for
    real). iOS uses `IOSAppPickerScreen` (Apple's own FamilyActivityPicker
    flow) instead, since Apple never exposes real app names to third-party
    apps.
12. **Intensity** (`IntensityScreen`) — Steady vs. Strict choice, with a
    recommendation pre-selected from a scored read of onboarding answers,
    and an honest spec table (challenge type, grant minutes, settings-change
    delay, daily cap).
13. **Future Self** (`FutureSelfScreen`) — record a 15s voice/video note or
    type 2 lines to your future self; plays back at the gate later.
14. **World Seed** (`WorldSeedScreen`) — "This is day one" — explains the
    low-visual, algorithm-driven design philosophy and that unused hours
    build something that never resets.
15. **Benefits** (`BenefitsScreen`) — brief value-prop recap.
16. **Welcome** (`WelcomeScreen`) — "You're all set up" + real checkmark
    icon, writes `onboardingComplete: true` and hands off to the main app.

**Currently hidden from the funnel** (code intact, just skipped in
`App.tsx`, not deleted): Paywall, the 7-day trial timeline screen, the
50%-off discount retention screen, the "Add your Friends" referral screen,
and the "rules I propose for you" default-schedule screen. Login/signup is
commented out at the point where a "Yes, sign in" answer would trigger it.

### Main app (post-onboarding)

Four tabs (`MainApp`): **Home**, **My apps**, **Reflect**, **Timer**.

- **Home** (`HomeScreen`) — live timer widget, "Blocked Apps" quick badge,
  real per-app screen-time summary (Android only), quick-start focus
  presets (Deep study / Commute / Digital detox / Touch grass / Quiet day),
  "Open a blocked app" test entry, next-unlock-number indicator.
- **My apps** (`MyAppsScreen`) — locked-app tiles (real icons, unblock
  action), each now shows its current strictness ("Locked · Steady" /
  "Locked · Strict"), "Block apps" entry to per-app daily limits
  (`BlocksScreen`), schedules entry.
- **Reflect** (`ReflectionScreen`) — progress/streak history, weekly
  insight (`WeeklyInsight`).
- **Timer** (`TimerScreen`) — LCD countdown + a compact duration stepper,
  slide-to-start, essentials/emergency row, and an **emergency-tokens row**
  showing the real balance. Once started, the screen goes **full-screen
  locked mode**: ✕ (top-left, opens the token-spend confirm to cancel
  early), shield icon (top-right, opens the guarded-apps list), Emergency
  button. No free pause once locked.

### The actual block flow (fires whenever a guarded app opens)

1. **Shield** (`ShieldScreen`) — full-screen themed interrupt (goal line or
   deadline countdown or theme line), bedtime pill if applicable, break-
   glass Emergency button always present, two choices: **Not now** (closes,
   credits reclaimed time) or **I need it** (always opens the Gate now —
   no more "free if it's an early unlock today").
2. **Gate** (`GateScreen`) — one real challenge, chosen by the active
   intensity: `MathQuestion`/`QuizQuestion`/`BreathingExercise` for Steady,
   `ActivityChallenge` (camera-up rep counting) for Strict. A future-self
   message plays first if one was recorded. A **"Skip with a token
   instead"** link is always present, opening a real confirm-and-spend
   flow tied to the actual token balance.
3. **Grant** (`GrantScreen`) — the unlock window, with a live countdown
   overlay (`LiveActivityBar`) visible across the rest of the app while
   it's open.
4. **Emergency/break-glass** — zero questions, zero cost, unlimited,
   reachable from every one of the above screens.

### Settings (`SettingsScreen`, real rows only)

- **Blocking**: Blocked Apps, Unlock difficulty (Steady/Strict), Block
  Screens, Waiting Room, Schedules, Autofocus.
- **Personal**: Message to future you.
- **Protection**: Guardian, PIN code access, Together.
- **Account**: My Account, **Delete Account** (new — see §3).

Every row above uses a real Ionicons glyph (`@expo/vector-icons`, MIT-
licensed, bundled with Expo) and opens a real screen. Everything that used
to point nowhere — Desktop App, Connect Desktop, Health Data, Chat with
Support, Help Center, Emergency Pass, Adult Website Protection, Community
Forum, Restore Purchase, Enter Referral Code, Share App, About, the two
local-only toggle switches — was removed rather than shipped as dead taps.

### Account & deletion

- **Account** (`AccountScreen`) — local-only identity (Apple/Google/email
  sign-in via `LoginScreen`), explicit "cloud sync coming soon, nothing
  leaves this device yet" card.
- **Delete Account** (`DeleteAccountScreen`, new) — lists exactly what gets
  erased, is upfront that there's no separate server record to delete
  (everything really is local-only), requires a second explicit
  confirmation, then wipes `AsyncStorage` and returns to a clean-install
  splash screen.

### Emergency tokens (`EmergencyTokensScreen`, new)

Reachable from the Timer tab's token row and from the Gate's skip-confirm
link. Explains: what a token does, that the first 2 are genuinely free
forever (not a bait-and-switch trial), that tokens never expire, and lists
purchase packs (1 / 3 / 10) — buttons are honestly marked **"Soon"** since
no IAP library or store product IDs exist yet; wiring real purchases needs
`expo-in-app-purchases`/`react-native-iap` plus real App Store/Play Console
product IDs.

### Deliberately not part of the current build

`WorldScreen`, `TimeLedgerScreen`, `LandmarksScreen`, `SeasonsScreen` — a
gamified "world" concept — exist as code but are commented out of the
import/render path in `MainApp.tsx` with an explicit note: *"World feature
— deprioritized per product decision (Wend-style apps don't have a 'world'
concept; focus is the core Shield/Gate/timer loop instead). Code kept,
commented, in case we revisit it later."* This was an existing decision,
not something changed this session.

---

## 3. Data model (local only, `AsyncStorage`, `src/data/store.ts`)

Key fields on `PersistedState`: `onboardingComplete`, `themeKey`,
`intensityKey` (`'steady' | 'strict'`), `futureSelfMessage`, `goal`,
`hoursReclaimed`, `reclaimedToday`/`reclaimedTodayDate`, `unlockNumber`,
`dayNumber`, `firstOpenDate`, `guardian`, `pin`, `account`,
`onboardingAnswers`, `progress`, `bedtime`, `checkIns`, `progressPhotos`,
`blockedPackages`, `gateReflections`, `schedules`, `appLimits`,
**`emergencyTokens`** (default `2`, new this session).

---

## 4. Status of work

### ✅ Completed (all pushed to `origin/master`)

- Fixed the recurring onboarding text-overlap bug (root cause: `exiting`
  animations breaking on React Native Web) across every affected screen.
- Removed self-report onboarding questions now answered by real usage data;
  wired real 7-day usage average + real top-distraction-apps into
  `PostOnboardingFlow`.
- Split, then re-merged and finally moved permissions into one upfront
  boarding-pass carousel (final agreed shape).
- Hid login/signup, paywall + trial + discount, "rules I propose," and
  referral screens from the funnel (code intact, not deleted).
- Full launch-readiness audit; added EAS `production`/`preview` build
  profiles; removed vestigial mic permissions; fixed dead buttons and fake
  placeholder text in `BlocksScreen`; recovered and committed ~40 files of
  previously-uncommitted native blocking infra.
- Replaced emoji UI chrome with a real shared icon set (`src/ui/Icon.tsx`)
  across ~15 files.
- Built the real installed-app picker → `blockedPackages` wiring (was
  collecting selections and discarding them).
- **Simplified the entire unlock mechanic**: removed Gentle, collapsed the
  old multi-family friction ladder to one real challenge per unlock
  (Steady = quiz/math/breathing, Strict = physical activity), added the
  token-skip path to the actual per-app unlock flow (previously tokens only
  covered ending a locked timer session).
- Added the real emergency-token balance, the token explainer/store
  screen, and the battery-optimization permission (native module + JS +
  manifest entry).
- Rebuilt Settings to real rows only with Ionicons; added the real account-
  deletion flow.
- Moved all permissions into the upfront boarding-pass flow (final
  position, per direct instruction).
- Verified live in the browser preview at each major step (screenshots and
  DOM-text checks), not just compiled.

### ⏳ Explicitly open — needs something only the user can supply

| Item | What's blocking it |
|---|---|
| Real in-app purchases for extra tokens | Needs `expo-in-app-purchases`/`react-native-iap` + real App Store/Play Console product IDs |
| Privacy Policy / Terms of Service | Needs real legal text |
| Real backend URL for the sounds feature | Currently a literal placeholder |
| Settings' original ~25-row icon set beyond what was kept | The kept rows are done; a full illustration pass for decorative content (World/theme/sound glyphs) was explicitly deferred, not started |
| Cloud sync | `AccountScreen` already says "coming soon" — no work started, by design |
| Manual on-device (not browser-preview) verification | Everything so far was verified via the Expo web preview; a real Android/iOS device pass hasn't been done |

