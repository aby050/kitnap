# Kitnap — Full Product Audit

Read-only audit. **No code has been changed.** Every claim below is cited to `file:line`.

---

## 0. Verdict

The design language, writing, and ethical instincts are genuinely strong — better than most apps in this category. But the app is currently a **high-fidelity prototype, not a working product**. Three things are true at once:

1. **The core promise does not execute.** On Android — the primary platform — completing a challenge or spending a token grants an unlock that the OS layer never honors. The shield re-fires in ~1.5 seconds.
2. **The token feature cannot work as designed.** Not because of bugs alone, but because the economy is inverted: the free escape is *better* than the paid one, and the "locked" session has four free exits and one paid exit.
3. **Three headline features are UI-only.** Schedules, app limits, and gate reflections are stored and displayed but never enforced or written.

Usability verdict: **easy to learn, hard to trust.** A first-time user will move through it smoothly and feel good. A day-2 user will discover that the thing they configured didn't happen. That's the worst possible order.

Priority order: fix enforcement → fix the token economy → remove or build the UI-only features → unify the design system → decide monetization.

---

## 1. The token feature — deep dive

Called out as needing to "work perfectly." It currently does not work at all in the way the copy promises. The complete token surface is only 5 files (`store.ts`, `MainApp.tsx`, `GateScreen.tsx`, `TimerScreen.tsx`, `EmergencyTokensScreen.tsx`).

### T1 — The grant a token buys is never honored on Android (P0)

`grantTemporaryAccess()` is called at [MainApp.tsx:332](src/main/MainApp.tsx:332) (token skip) and [MainApp.tsx:341](src/main/MainApp.tsx:341) (challenge completed) — both gated on `Platform.OS === 'ios'`.

There is **no Android equivalent, anywhere**. The native module exposes only: `canDrawOverlays`, `openOverlaySettings`, `isAccessibilityServiceEnabled`, `openAccessibilitySettings`, `isNotificationListenerEnabled`, `openNotificationListenerSettings`, `isIgnoringBatteryOptimizations`, `openBatteryOptimizationSettings`, `setBlockedPackages`, `setMonitoringLevel`, `getInstalledApps` ([DevicePermissionsModule.kt](modules/device-permissions/android/src/main/java/expo/modules/devicepermissions/DevicePermissionsModule.kt)). No grant, no allowance, no expiry.

`ByreAccessibilityService.onAccessibilityEvent` has no concept of an active grant, and the debounce is `BALANCED(500L, 1500L)` / `STRICT(150L, 800L)` ([MonitoringConfigStore.kt](modules/device-permissions/android/src/main/java/expo/modules/devicepermissions/MonitoringConfigStore.kt)).

**Effect:** user does 10 squats or spends a token → sees "5 minutes" → switches to Instagram → shielded again after ~1.5 s. **The token is consumed and buys nothing.** This is the single most serious defect in the project.

### T2 — The free 15-minute emergency never lifts the shield either (P0)

Both `onEmergency` handlers — [MainApp.tsx:312](src/main/MainApp.tsx:312) (from Shield) and [MainApp.tsx:354](src/main/MainApp.tsx:354) (from Gate) — set `grantIsEmergency`, `grantExpiresAt`, and `setBlock('emergency')`. **Neither calls `grantTemporaryAccess()`.** So on iOS too, Apple's shield stays armed.

Meanwhile [GrantScreen.tsx:47](src/shield/GrantScreen.tsx:47) tells the user *"Everything is open for 15 minutes."* and [GrantScreen.tsx:52](src/shield/GrantScreen.tsx:52) adds *"No questions. Nothing logged against you. Go handle it."*

This is worse than T1 in human terms. If someone needs their banking app or maps in a real emergency, the app says it's open, and it isn't.

### T3 — The economics are inverted (P0, design)

| Route | Cost | Duration | Availability |
|---|---|---|---|
| Emergency break-glass | **Free** | **15 min** | Unlimited, on every blocking screen |
| Challenge (Steady) | Effort | 5 min | Always |
| Challenge (Strict) | Physical effort | 3 min | Always |
| **Spend 1 token** | **Real money** (after 2) | **5 or 3 min** | Always |

Source: `grantMinutes: 5` / `grantMinutes: 3` in [themes.ts](src/data/themes.ts); 15 min at [MainApp.tsx:314](src/main/MainApp.tsx:314).

**Paying gets you one-fifth the access of the free option.** And the free option sits directly next to the paid one — `Emergency` in the Gate header at [GateScreen.tsx:144-146](src/shield/GateScreen.tsx:144), with "Skip with a token instead" below at [GateScreen.tsx:158](src/shield/GateScreen.tsx:158). A rational user never spends a token. Ever.

[EssentialsScreen.tsx](src/main/EssentialsScreen.tsx) states the problem in its own copy: *"One tap unblocks everything for 15 minutes. Zero questions, no delay, no payment — at every intensity, forever."*

### T4 — The "locked" timer has four free exits and one paid exit (P0)

[TimerScreen.tsx](src/main/TimerScreen.tsx) comments that "the only exit is the corner close, which costs a token." The same locked view renders:

| Exit | Location | Cost |
|---|---|---|
| Corner close → `CancelConfirm` | [TimerScreen.tsx:233](src/main/TimerScreen.tsx:233) | **1 token** ✅ |
| Shield icon button | [TimerScreen.tsx:243](src/main/TimerScreen.tsx:243) | Free |
| "Emergency" pill | [TimerScreen.tsx:246](src/main/TimerScreen.tsx:246) | Free |
| "What are emergency tokens?" | [TimerScreen.tsx:257](src/main/TimerScreen.tsx:257) | Free |
| Tab bar (always tappable) | [MainApp.tsx:683](src/main/MainApp.tsx:683) | Free |

Root cause: timer state is purely local (`const [remaining, setRemaining] = useState(...)`, `const [running, setRunning] = useState(autoStart)`). `renderMain()` returns overlays **before** the `tab === 'timer'` branch, and the tab bar is `position: 'absolute', bottom: 0`. Any overlay or tab switch **unmounts TimerScreen and destroys the session** — free, silent, unrecorded. The `key={`${timerPreset.minutes}-${timerPreset.label}`}` at [MainApp.tsx:657](src/main/MainApp.tsx:657) does the same on preset change.

The fourth row is the cruellest: **tapping "What are emergency tokens?" inside the dialog that asks you to spend one cancels the session for free.** To learn what tokens are, you get the thing they're for, free.

### T5 — Spending a token does nothing but decrement a counter (P1)

[MainApp.tsx:672-676](src/main/MainApp.tsx:672):
```ts
onSpendTokenToCancel={() => {
  const next = Math.max(0, emergencyTokens - 1);
  setEmergencyTokens(next);
  onPatch({ emergencyTokens: next });
}}
```
It does not stop the timer (TimerScreen does that locally), does not log the spend, does not record an event. Spending a token and unmounting the screen produce an identical outcome — except one costs money.

### T6 — No zero-balance guard at the handler level (P1)

Both spend sites use `Math.max(0, emergencyTokens - 1)` and then grant the unlock **unconditionally** ([MainApp.tsx:329](src/main/MainApp.tsx:329), [MainApp.tsx:673](src/main/MainApp.tsx:673)). At a zero balance the deduction silently no-ops while the grant still fires. The only protection is the `disabled` prop in the UI ([GateScreen.tsx:176](src/shield/GateScreen.tsx:176), [TimerScreen.tsx:553](src/main/TimerScreen.tsx:553)) — which is correctly honored by `Button`, but a stale prop or double-tap grants a free unlock. Business rules should not live only in the view.

### T7 — No ledger, no history, no explanation (P1)

`emergencyTokens: number` is a bare integer ([store.ts:43](src/data/store.ts:43)). There is no record of when a token was spent, on what, or why. The user cannot audit their own balance. (`TimeLedgerScreen.tsx` is about reclaimed *hours*, not tokens.)

### T8 — No way to earn a token, and no way to buy one (P1)

Two free, forever. IAP is not wired — all three packs render `{pack.price} · Soon` ([EmergencyTokensScreen.tsx:90](src/main/EmergencyTokensScreen.tsx:90)). The 20 achievements in [progress.ts](src/data/progress.ts) award nothing. So the balance is a **strictly decreasing resource with no floor and no faucet** — and once it hits zero, the paid mechanic is permanently dead for that user.

### T9 — The feature is undiscoverable (P1)

No token row in [SettingsScreen.tsx](src/main/SettingsScreen.tsx), nothing on Home, nothing on Profile. The balance is reachable **only** from inside the Timer tab. The app's only monetized feature is hidden behind a screen most users won't open.

### T10 — Delete Account refills tokens (P2)

`handleDeleteAccount` does `clearState()` + `setPersisted(DEFAULT_STATE)` ([App.tsx](App.tsx)), and `DEFAULT_STATE.emergencyTokens = 2` ([store.ts:118](src/data/store.ts:118)). Infinite free tokens, two taps. (Correctly, `loadState`'s day-rollover does *not* reset tokens.)

### T11 — The explainer screen states something false (P1)

[EmergencyTokensScreen.tsx](src/main/EmergencyTokensScreen.tsx): *"Once a focus session is locked, it can't be stopped for free — that's the whole point."* It can be stopped for free in four ways (T4).

---

## 2. Senior PM lens — does the product work?

### P1 — Schedules are never enforced (P0)

`schedules` is read in exactly three places: display in [MyAppsScreen.tsx:146](src/main/MyAppsScreen.tsx:146), editing in [ScheduleEditorScreen.tsx](src/main/ScheduleEditorScreen.tsx), and one incidental `sleep` lookup at [MainApp.tsx:221](src/main/MainApp.tsx:221) that feeds `sleepWindowHours` — **which is computed and never used**.

Nothing compares the current time to a schedule window. Nothing calls `setBlockedPackages` on a schedule boundary. A user who sets "Sleep · 23:00–07:00 · every day" gets **exactly nothing**. `DEFAULT_SCHEDULES` ships pre-populated, so every user has rules that look active and aren't.

### P2 — App limits are never enforced (P0)

`appLimits` is written, persisted, and displayed in [BlocksScreen.tsx:246](src/main/BlocksScreen.tsx:246). `limitMinutes` is **never compared against `useTodayUsage`** — and real per-app minutes are available on Android ([useTodayUsage.ts](src/data/useTodayUsage.ts)). The `emergencyUses`, `showReminders`, and `strictMode` fields on `AppLimit` are never read at all.

### P3 — Gate reflections are never written (P1)

`commitReflection` is defined in `MainApp.tsx` and **never called from anywhere**. So `gateReflections` stays `[]` forever. Consequences:
- Reflect's "Your words" tab is permanently empty and its empty state promises a mechanic that doesn't exist: *"The gate asks you to type a reason once friction kicks in"* ([ReflectionScreen.tsx:159](src/main/ReflectionScreen.tsx:159)). It doesn't.
- `familyDFor()` in [gateQuestions.ts](src/data/gateQuestions.ts) is unreachable.

### P4 — Home's primary CTA discards the user's own input (P1)

Home has a duration picker and a commitment timer, but `onStartFocus` hardcodes the session: `setTimerPreset({ minutes: 25, label: 'Focus Timer', autoStart: true })` then jumps to another tab. Whatever the user configured is thrown away. Home also renders a **second, fake** commitment timer — `useState(12)` days and `useState(12)` hours ([HomeScreen.tsx](src/main/HomeScreen.tsx)) — with a free `Pause` button. Eight of its props are declared and never used.

### P5 — There is no monetization mechanism at all (P0, business)

`PersistedState` has **no** `subscription`, `trialEndsAt`, `isPremium`, or entitlement field of any kind ([store.ts:13-43](src/data/store.ts:13)). Yet:
- [PaywallScreen.tsx:56](src/onboarding/PaywallScreen.tsx:56) promises *"Start Your Free Week And Gain 2+ Hours Back"* and frames "Our Members" vs "Regular Users".
- [TrialTimelineScreen.tsx:18](src/onboarding/TrialTimelineScreen.tsx:18) promises *"Start your 7-day free trial and unlock Strict mode, schedules and Guardian."*

Strict mode is a free radio button in Settings. Schedules don't work. Guardian is free. **Nothing is gated, nothing is recorded, no trial starts, no trial ends.** The funnel makes a commercial promise the product has no machinery to honor — and the only real monetization intent (token IAP) is marked "Soon."

### P6 — The paywall chart is fabricated (P0, trust)

[PaywallScreen.tsx:14-16](src/onboarding/PaywallScreen.tsx:14) hardcodes two SVG curves:
```ts
const REGULAR = 'M -10 44 C 60 40, 110 52, ...';
const MEMBER  = 'M -10 62 C 60 58, 100 92, ...';
```
axis-labelled *"Screen Time After 2 weeks"*, with `hoursBack = 2` as an invented default. This is an efficacy claim drawn as a data visualization, at the exact moment the user is asked to pay. It is also the most direct contradiction of the project's own "no fake numbers" principle.

---

## 3. Concept planner lens — is the concept coherent?

The concept is genuinely good: **interrupt → one honest challenge → a short, real grant.** It fails on internal consistency.

### C1 — Two contradictory escape philosophies

The project states break-glass must be free, instant, and everywhere. It also sells tokens for the same job. Both were built, neither was reconciled, so they cannibalize each other (T3). **This is the root cause of the token feature "not working perfectly" — it is a design contradiction, not a bug.** No amount of code will fix a paid door standing next to a free, wider door.

### C2 — Reclaimed time is a fabricated constant

[MainApp.tsx:302-308](src/main/MainApp.tsx:302), on "Not now":
```ts
setReclaimedToday((m) => m + 3);
applyProgress([{ type: 'saved', minutes: 3 }, { type: 'blocked' }]);
```
A flat `+3` minutes, invented, every dismissal. Everything downstream is built on that constant: `hoursReclaimed`, the Time Ledger's *"roughly N proper walks"*, the landmarks that "get built" ([TimeLedgerScreen.tsx:17](src/main/TimeLedgerScreen.tsx:17)), and `globalPercentile()`. The app's entire reward economy is denominated in a made-up number — while `useTodayUsage` sits right there with real Android usage data.

### C3 — Abandoning a gate is recorded as completing a focus session

[MainApp.tsx:351](src/main/MainApp.tsx:351): `onAbandoned` → `applyProgress([{ type: 'lockSession' }, { type: 'blocked' }])`. `ReflectionScreen` labels `week.lockSessions` as **"Focus sessions completed"** ([ReflectionScreen.tsx:58](src/main/ReflectionScreen.tsx:58)). Backing out of a gate is not a completed focus session.

Related: "Requests abandoned mid-gate" is fed by `week.distractionsBlocked` ([ReflectionScreen.tsx:55](src/main/ReflectionScreen.tsx:55)), which Shield's "Not now" *also* increments — so two different behaviours land in one stat under a label that describes only one of them.

### C4 — `globalPercentile()` presents a local model as a global ranking

[progress.ts:327-343](src/data/progress.ts:327) is honest in its comment (*"Local modeled percentile until a real user-base ranking exists... Mapped into 12–95"*) and dishonest on screen, where it reads as a real percentile against real people.

### C5 — Most gate content is unreachable

`pickChallenge` returns only quiz (Steady / health-limited) or `FAMILY_G` ([gateQuestions.ts:~200](src/data/gateQuestions.ts)). `FAMILY_A`, `B`, `C`, `E` and `familyDFor()` are dead. `FAMILY_B` is worth deleting outright rather than reviving — it fabricates personal telemetry: *"You've given this app 47 minutes today. This request makes it 52."*, *"This is your 6th unlock request today. The first was at 7:40am."* None of that is measured.

---

## 4. Client lens — would I ship this, and would I pay for it?

**Would not ship.** Not on quality of craft — on liability. Three specific exposures:

1. **The emergency path is a safety claim that doesn't hold (T2).** "Everything is open for 15 minutes. Go handle it" is the kind of promise that matters exactly once, in a car park, at night. It doesn't work on either platform. This is the finding I'd escalate first.
2. **A store screen for a product that isn't delivered (T1).** Selling tokens that buy a grant Android ignores is charging for a non-functioning good. Ship the IAP as-is and that's a refund queue and a store-review risk.
3. **A fabricated efficacy chart on the paywall (P6).** An invented outcome graph shown to induce payment is the sort of thing app-store review and consumer-protection rules exist for.

**Would not pay for it as a user.** I'd buy tokens once, discover the free Emergency button gives 15 minutes instead of 3, and feel taken. The economics teach the user that paying is the wrong move — which poisons the goodwill the writing works so hard to build.

**What I'd say in the review meeting:** the concept, voice, and design instincts are ahead of the category. The enforcement layer and the business layer are missing. That's a solvable, well-bounded gap — but it is not a polish pass, and it must be closed before any monetization goes live.

---

## 5. Usability — as a real user

**Easy to use? Yes, on first run.** The 16-step onboarding, the boarding-pass permission screen, the segmented Reflect tabs, the writing — all clear, all calm. Genuinely low friction.

**Easy to trust? No, from day two.** Walking it as a user:

| Step | What I expect | What happens |
|---|---|---|
| Set "Sleep 23:00–07:00" | Apps lock at 23:00 | Nothing, ever (P1) |
| Set a 30-min Instagram limit | Blocked at 30 min | Nothing, ever (P2) |
| Pick 45 min on Home, tap start | A 45-min session | A 25-min session, on a different tab (P4) |
| Do the challenge, get "5 minutes" | 5 minutes in Instagram | Shielded again in ~1.5 s (T1) |
| Tap Emergency in a real emergency | Everything opens | Nothing opens (T2) |
| Spend a token to end a session | The only paid exit | One of five exits; four are free (T4) |
| Open "Your words" in Reflect | My gate reflections | Permanently empty (P3) |
| Look for my token balance in Settings | A row | No row anywhere (T9) |

Additional friction found:

- **Two design systems ship side by side.** 56 files import `colors` from [src/theme.ts](src/theme.ts); 12 use the 872-line [src/design/](src/design/primitives.tsx) system. **All of onboarding is on the legacy theme** — so the app the user meets looks different from the app they use. The intended migration bridge (`colors` at [tokens.ts:374](src/design/tokens.ts:374)) is dead code that **nothing imports**.
- **Two different accent greens ship in one app**: `#7CF5B0` ([theme.ts:7](src/theme.ts:7)) vs `#6FE3A9` ([tokens.ts:53](src/design/tokens.ts:53)).
- **A hardcoded fake stat**: *"Used 0 times this week."* ([EssentialsScreen.tsx:62](src/main/EssentialsScreen.tsx:62)) — never computed.
- **Essentials switches don't persist** — local `useState`, lost on unmount ([EssentialsScreen.tsx](src/main/EssentialsScreen.tsx)).
- **Wrong-platform copy**: Essentials says Phone / Emergency SOS are *"Guaranteed by iOS — can never be blocked"* while Android is the primary target.
- **Dead computations**: `rank`, `scoreTrendUp`, `sleepWindowHours` in `MainApp.tsx`; 8 unused props in `HomeScreen.tsx`.

**What already works well and should not be touched:** `setBlockedPackages` really does sync to native on every change ([App.tsx:138](App.tsx:138)); `getInstalledApps` enumerates real apps; `useTodayUsage` reads real `UsageStatsManager` data and honestly reports `available: false` elsewhere; the Accessibility Service is narrow, debounced, and well-commented; `Button` correctly honors `disabled`; day-rollover correctly preserves tokens; `SettingsScreen` genuinely has no dead rows.

---

## 6. Defect register

### P0 — blocks any release
| # | Defect |
|---|---|
| T1 | Token/challenge grant never honored on Android; no native grant API exists |
| T2 | Free 15-min emergency never lifts the shield on **either** platform |
| T3 | Token economy inverted — free route is longer, unlimited, and adjacent |
| T4 | "Locked" timer has 4 free exits vs 1 paid exit |
| P1 | Schedules never enforced (ships pre-populated) |
| P2 | App limits never enforced despite real usage data being available |
| P5 | No entitlement state; paywall + trial promise what nothing delivers |
| P6 | Fabricated efficacy chart on the paywall |

### P1 — fix before monetizing
T5 (token spend is a no-op), T6 (no handler-level balance guard), T7 (no ledger), T8 (no faucet), T9 (undiscoverable), T11 (false copy), P3 (reflections never written), P4 (Home discards input + fake timer), C2 (`+3` fabricated), C3 (abandon counted as completion), C4 (modeled percentile shown as global), design-system split, two accent greens, Essentials fake stat, Essentials switches don't persist.

### P2 — cleanup
T10 (delete-account token refill), C5 (unreachable gate families; delete `FAMILY_B`), "Guaranteed by iOS" on Android, dead computations and unused props.

---

## 7. Recommended fix plan

Sequenced so each stage is independently shippable. **Awaiting your go-ahead — nothing has been changed.**

**Stage 1 — Make the grant real (fixes T1, T2).**
Add `setGrantUntil(packageName: String, untilMs: Double)` + `clearGrant(...)` to the native module, backed by a `GrantStore` (SharedPreferences + volatile cache, mirroring `BlockedPackagesStore`), and check it at the top of `ByreAccessibilityService.onAccessibilityEvent` before shielding. Call it from all three JS grant paths — challenge, token, **and emergency** — and add the missing `grantTemporaryAccess()` call on the iOS emergency path. Per project rule, I'll read the v57 docs before touching the module.

**Stage 2 — Reconcile the two escape hatches (fixes T3, C1).** The one real design decision, so I'll confirm direction before building. My recommendation: split the jobs.
- **Safety stays free, instant, unlimited in kind** — but scoped to a real allowlist (phone, messages, maps, banking, health) plus a full break-glass that is *visibly logged* and *rate-limited* (e.g. 3/week, auto-refilling). Never charge for safety.
- **Tokens become the convenience skip** for the non-emergency case, and the paid grant becomes the *longest* one (token 15 min > challenge 5 min), so paying is never the worse deal.

**Stage 3 — Make "locked" mean locked (fixes T4, T5).** Lift timer state out of `TimerScreen` into `MainApp`/persisted state so it survives unmount; suppress the tab bar and route overlays through the cancel confirmation while a session is running; make the token spend the thing that actually ends the session, and log it.

**Stage 4 — Token integrity (fixes T6–T9, T11).** Add a `tokenLedger` to `PersistedState` (timestamp, reason, balance-after); move the balance check into a single `spendToken()` helper that returns success/failure and refuses at zero; add a Settings row and a Home surface; award tokens on streak milestones so there's a faucet; correct the false copy.

**Stage 5 — Enforce or remove (fixes P1, P2).** Build a schedule evaluator that recomputes the effective blocked set on a tick and on foreground, and a limit checker that compares `appLimits` against `useTodayUsage`. Anything not enforced by end of stage gets removed from the UI rather than shipped as decoration.

**Stage 6 — Honest numbers (fixes C2, C3, C4, P6).** Replace the `+3` constant with measured time where Android allows and an honest empty state where it doesn't; stop counting gate abandons as completed sessions; relabel or remove the percentile; replace the paywall chart with something true.

**Stage 7 — Coherence pass (P4 + design split + P2 cleanup).** Home honors its own duration and loses the fake timer; migrate onboarding to the single design system and delete `src/theme.ts` + the dead bridge; one accent green; delete dead code.

**Stage 8 — Decide the business model.** Subscription or consumable, not both. Either add real entitlement state and gate something real, or remove the paywall and trial screens until there's something to sell. Shipping the current funnel is the largest non-technical risk in the project.
