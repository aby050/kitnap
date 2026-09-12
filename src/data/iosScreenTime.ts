import { Platform } from 'react-native';
import { momentLine } from './moments';

/**
 * Real iOS Screen Time / Family Controls integration via
 * react-native-device-activity. Everything here degrades to a safe no-op
 * off iOS or before the native module is linked, same pattern as
 * androidUsage.ts — importing this file never crashes an unbuilt client.
 *
 * IMPORTANT — this cannot actually authorize on a real device yet. Apple's
 * Family Controls entitlement must be requested and approved for FOUR
 * bundle identifiers before any build with this capability will even
 * provision successfully, let alone before requestAuthorization() can
 * succeed on-device:
 *   - com.abhay.byre
 *   - com.abhay.byre.ActivityMonitor
 *   - com.abhay.byre.ShieldAction
 *   - com.abhay.byre.ShieldConfiguration
 * Request at https://developer.apple.com/contact/request/family-controls-distribution
 * — once per bundle ID above, from the Apple Developer account holder.
 * Until all four are approved, requestAuthorization() below will reject.
 */
let native: typeof import('react-native-device-activity') | null = null;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    native = require('react-native-device-activity');
  } catch {
    native = null;
  }
}

export const screenTimeAvailable = () => Platform.OS === 'ios' && native !== null;

/** The library reports status as a numeric enum (0/1/2) — remapped to
 *  readable strings here so the rest of the app never touches that. */
export type AuthorizationStatus = 'notDetermined' | 'denied' | 'approved' | 'unavailable';

function readStatus(raw: number): AuthorizationStatus {
  if (raw === 2) return 'approved';
  if (raw === 1) return 'denied';
  return 'notDetermined';
}

export function getScreenTimeAuthorizationStatus(): AuthorizationStatus {
  if (!native) return 'unavailable';
  try {
    return readStatus(native.getAuthorizationStatus());
  } catch {
    return 'unavailable';
  }
}

export async function requestScreenTimeAuthorization(): Promise<AuthorizationStatus> {
  if (!native) return 'unavailable';
  try {
    await native.requestAuthorization();
    return getScreenTimeAuthorizationStatus();
  } catch {
    // Expected until Apple approves the Family Controls entitlement for all
    // four bundle IDs — see the file header note.
    return 'denied';
  }
}

export function revokeScreenTimeAuthorization() {
  native?.revokeAuthorization?.();
}

/** Persisted id the family-activity-selection token is stored under on the
 *  native side (via setFamilyActivitySelectionId) — referenced everywhere
 *  else instead of passing the (very large) raw token string around. */
export const SELECTION_ID = 'byre-blocklist';
const DAILY_ACTIVITY_NAME = 'byre-daily';
const GRANT_EVENT_NAME = 'byre-grant-window';

/** Saves the token the DeviceActivitySelectionView picker returns —
 *  everything else (blocking, monitoring) refers to it by SELECTION_ID. */
export function saveBlockedSelection(familyActivitySelectionToken: string) {
  native?.setFamilyActivitySelectionId({ id: SELECTION_ID, familyActivitySelection: familyActivitySelectionToken });
}

export function hasBlockedSelection(): boolean {
  return !!native?.getFamilyActivitySelectionId(SELECTION_ID);
}

/** Removes the saved selection entirely and lifts the shield — for when the
 *  4 apps still showing "blocked" are stale ones from an earlier test pick,
 *  not something the user can otherwise get back to zero from (Apple's
 *  picker only lets you toggle items off one at a time, and there's no
 *  library call to delete a persisted-id selection outright). */
export function clearBlockedSelection() {
  if (!native) return;
  // Order matters: unblockSelection resolves SELECTION_ID to the actual
  // tokens it needs to lift the shield for. Deleting the id mapping first
  // (the original bug here) leaves that lookup with nothing to resolve —
  // the OS-level shield stays applied to the old apps even though the app
  // itself now shows "nothing selected".
  unblockSelectedApps();
  native.resetBlocks?.('clearBlockedSelection');
  const all = (native.userDefaultsGet?.<Record<string, string>>('familyActivitySelectionIds')) ?? {};
  if (SELECTION_ID in all) {
    const { [SELECTION_ID]: _removed, ...rest } = all;
    native.userDefaultsSet?.('familyActivitySelectionIds', rest);
  }
  setGrantBudget(null);
}

export type SelectionCounts = { apps: number; categories: number; sites: number };

/** What's in the saved selection, by count. Apple hands back an opaque token
 *  — the names and icons of the chosen apps are deliberately never exposed
 *  to us — so a count is the most the app can honestly show. */
export function getSelectionCounts(): SelectionCounts | null {
  if (!native) return null;
  try {
    if (!native.getFamilyActivitySelectionId(SELECTION_ID)) return null;
    const meta = native.activitySelectionMetadata({ activitySelectionId: SELECTION_ID });
    if (!meta) return null;
    return {
      apps: meta.applicationCount ?? 0,
      categories: meta.categoryCount ?? 0,
      sites: meta.webDomainCount ?? 0,
    };
  } catch {
    return null;
  }
}

/** Applies the block immediately — the OS now shows Apple's native Shield
 *  over any app in the selection until unblockSelectedApps() is called. */
export function blockSelectedApps() {
  if (!native) return;
  // A block issued while unauthorized does nothing and reports nothing, so
  // re-request first whenever the OS has forgotten the grant (a reinstall
  // resets it) and apply the block once it comes back.
  if (getScreenTimeAuthorizationStatus() !== 'approved') {
    void requestScreenTimeAuthorization().then((status) => {
      if (status === 'approved') native?.blockSelection({ activitySelectionId: SELECTION_ID });
    });
    return;
  }
  native.blockSelection({ activitySelectionId: SELECTION_ID });
}

export function unblockSelectedApps() {
  native?.unblockSelection({ activitySelectionId: SELECTION_ID });
}

export function isCurrentlyShielded(): boolean {
  return native?.isShieldActive() ?? false;
}

/** Sets the Shield's appearance and what its button does. The primary
 *  button opens Byre (via `type: 'openApp'`) rather than granting access
 *  directly — the actual Gate/difficulty challenge happens inside Byre,
 *  same as the Android flow, not inside the Shield extension itself (Apple
 *  doesn't allow arbitrary custom UI there). */
/**
 * What the block screen says.
 *
 * Apple draws this, not us — the extension gets a title, a subtitle, an icon
 * and two buttons, and nothing else. So the character has to live in the
 * words. The lines rotate so the fiftieth block doesn't read like the first;
 * they tease rather than scold, because a screen that tells you off is a
 * screen you start resenting, and resenting the app is how people delete it.
 */
const SHIELD_LINES: { title: string; subtitle: string; icon: string }[] = [
  {
    title: 'Nope.',
    subtitle: "Past you saw this coming and locked the door. Rude of them. Correct of them.",
    icon: 'hand.raised.fill',
  },
  {
    title: 'This app is on a break',
    subtitle: "It'll still be there later. It always is. That's rather the problem.",
    icon: 'cup.and.saucer.fill',
  },
  {
    title: 'Caught you',
    subtitle: 'No judgement — the thumb moved before you did. Happens to everyone.',
    icon: 'eye.fill',
  },
  {
    title: 'Blocked, with love',
    subtitle: 'You asked for this in a calmer moment. Trust that version of yourself.',
    icon: 'heart.fill',
  },
  {
    title: 'Still blocked',
    subtitle: "Checking again won't unblock it, but it is a very human thing to try.",
    icon: 'arrow.clockwise',
  },
  {
    title: 'Go and be a person',
    subtitle: 'Outside is rendering at full resolution today. No loading screen.',
    icon: 'sun.max.fill',
  },
  // A style pack rather than one-offs — Byre-flavored wisdom, not scripture
  // recited straight, but the Gita's actual line each time so it stays real.
  {
    title: 'You have a right to your work',
    subtitle: '"...but never to the fruit of your work." — the Gita, on wanting the scroll more than the moment.',
    icon: 'leaf.fill',
  },
  {
    title: 'The mind is restless',
    subtitle: '"...but it can be tamed through practice." — Krishna, to Arjuna, roughly 2,000 unlocks ago.',
    icon: 'wind',
  },
];

/** One line per day, so it's a familiar face rather than a slot machine. */
function shieldLineForToday() {
  const day = Math.floor(Date.now() / 86_400_000);
  return SHIELD_LINES[day % SHIELD_LINES.length];
}

/** Same line Apple's shield shows for today, for screens (Home) that want to
 *  say the same thing before the user even hits a blocked app — the personal
 *  reason and the hourly moment line beat the stock line, same priority order
 *  as configureShield. */
export function homeLineForToday(personalLine?: string): string {
  return personalLine || momentLine() || shieldLineForToday().subtitle;
}

const BLUE = { red: 76, green: 158, blue: 255, alpha: 1 };
const NEAR_BLACK = { red: 8, green: 10, blue: 12, alpha: 1 };
const WHITE = { red: 255, green: 255, blue: 255, alpha: 1 };
const DIM = { red: 255, green: 255, blue: 255, alpha: 0.62 };

/** What the shield says, escalating with how many times this exact app has
 *  been reached for today. `{applicationOrDomainDisplayName}` is the real app
 *  name (Apple hands the extension that much, even though the token stays
 *  opaque to us) and `{attempts}` is the count.
 *
 *  One sentence for every app, every time, was the whole problem: the fifth
 *  Telegram of the morning read exactly like the first, so the shield never
 *  sounded like it had noticed anything. The last entry repeats once the list
 *  runs out, so a very persistent day still lands somewhere sensible.
 *
 *  Light, never scolding — shame produces uninstalls, not behaviour change. */
const SHIELD_TITLES = [
  '{applicationOrDomainDisplayName} can wait.',
  '{applicationOrDomainDisplayName} again.',
  'Third time for {applicationOrDomainDisplayName}.',
  "{applicationOrDomainDisplayName}, {attempts} times today.",
  "{applicationOrDomainDisplayName} really wants you back.",
  "You and {applicationOrDomainDisplayName} need space.",
];

const SHIELD_SUBTITLES = [
  'You picked this. Past you was right.',
  'Same app, same minute, same feeling.',
  'Your thumb got here before you did.',
  'Nothing new has happened since the last time.',
  'This is the loop. You can step out of it.',
  'It will still be there tonight. So will you.',
];

export function configureShield(_title?: string, personalLine?: string) {
  if (!native) return;
  const line = shieldLineForToday();
  native.updateShield(
    // Cast: `titleVariants` / `subtitleVariants` are Byre's own additions,
    // read by ShieldConfigurationExtension.swift. The library's TS type for
    // the config predates them and doesn't allow extra keys.
    {
      title: line.title,
      // Per app and per attempt — the Swift side picks the entry matching
      // today's count for this app and falls back to `title` if absent.
      titleVariants: SHIELD_TITLES,
      titleColor: WHITE,
      // The user's own reason, when they gave one, beats anything we wrote.
      // The user's own reason first, then something true for this hour, and
      // only then the rotating line. Never a theme category label.
      subtitle: personalLine || momentLine() || line.subtitle,
      // Only rotate when the user hasn't given us their own reason — their
      // words outrank ours, however many times they come back.
      ...(personalLine ? {} : { subtitleVariants: SHIELD_SUBTITLES }),
      subtitleColor: DIM,
      backgroundColor: NEAR_BLACK,
      // Without a dark blur style iOS composites its own light material over
      // the background colour, which is what made the buttons unreadable.
      backgroundBlurStyle: 1,
      iconSystemName: line.icon,
      iconTint: BLUE,
      primaryButtonLabel: 'Let me in',
      primaryButtonLabelColor: { red: 4, green: 14, blue: 28, alpha: 1 },
      primaryButtonBackgroundColor: BLUE,
      secondaryButtonLabel: 'Fine, later',
      // The secondary label sits on the blur itself, so it needs real
      // contrast rather than the dimmed treatment used on the subtitle.
      secondaryButtonLabelColor: WHITE,
    } as any,
    {
      // The library's own "openApp" type is dead code — its handler never
      // actually implements it, only "openUrl" does. "device-activity://" is
      // the scheme Byre already registers (app.json's `scheme` array), so
      // this is what "Let me in" is supposed to have been doing all along.
      // Cast: the Swift side implements "openUrl" (Shared.swift) but the
      // library's own ShieldActionType TS union never listed it.
      // Byre's own registered scheme (app.json's `scheme` array), not the
      // library default "device-activity://" — one less thing to doubt when
      // this is the button that wasn't opening the app at all.
      // "Let me in" cannot open Byre directly. Verified on-device: the
      // ShieldAction extension builds a bare NSExtensionContext, whose
      // endpoint is null, so `open()` fires its completion in microseconds
      // having done nothing ("opening URL / opening URL completion" back to
      // back in the device log). Apple gives an extension no supported way
      // to launch its containing app, and this old community workaround is
      // now inert — the button genuinely did nothing.
      //
      // So the shield posts a notification instead, and tapping that opens
      // Byre on the Gate. One extra tap, but it actually works. The openUrl
      // stays as the action's `type` in case a future iOS restores it; the
      // notification is what carries the flow today.
      primary: {
        type: 'openUrl',
        url: 'byre://unlock',
        behavior: 'close',
        // The extension cannot launch Byre itself, so it posts this instead;
        // tapping it opens Byre on the Gate.
        actions: [
          {
            type: 'sendNotification',
            payload: {
              title: 'Byre',
              body: 'Tap to earn your way into {applicationOrDomainDisplayName}.',
            },
          },
        ],
      } as any,
      // Closes the shield and leaves the app blocked — the honest "not now".
      secondary: { type: 'dismiss', behavior: 'close' },
    },
  );
}

/**
 * Apple's floor for both a DeviceActivitySchedule interval and a
 * DeviceActivityEvent threshold. Anything shorter makes startMonitoring throw,
 * which is how a three-minute grant ended up with no OS-level expiry at all.
 */
const MIN_OS_WINDOW_MINUTES = 15;

/** Starts monitoring for exactly this grant window, with a usage threshold
 *  that fires blockSelection once someone actually uses the granted apps for
 *  `grantMinutes`.
 *
 *  The schedule used to run midnight-to-midnight every day, restarted on
 *  every grant "to reset the counter". It didn't: DeviceActivity counts
 *  usage against the whole day's interval regardless of when monitoring was
 *  (re)started, so a second unlock the same day only needed the *remaining*
 *  minutes to hit the threshold — it looked like it ended early. The
 *  schedule below is scoped to just this grant (now → now+grantMinutes,
 *  non-repeating), so each unlock always gets a genuinely fresh window. */export function startGrantWindow(grantMinutes: number) {
  if (!native) return;
  // DeviceActivityEvent needs the actual selection token, not the
  // persisted-id shorthand that blockSelection/unblockSelection accept.
  const token = native.getFamilyActivitySelectionId(SELECTION_ID);
  if (!token) return;

  const reblock = [{ type: 'blockSelection', familyActivitySelectionId: SELECTION_ID }];

  // Two callbacks, not one. `eventDidReachThreshold` only fires if the granted
  // apps are used for the whole window; `intervalDidEnd` fires when the window
  // simply runs out. Registering only the first meant someone who opened a
  // blocked app for a minute and then set the phone down was never re-blocked
  // by the OS at all — the threshold never came, so neither did the block.
  native.configureActions({
    activityName: DAILY_ACTIVITY_NAME,
    callbackName: 'eventDidReachThreshold',
    eventName: GRANT_EVENT_NAME,
    actions: reblock,
  });
  native.configureActions({
    activityName: DAILY_ACTIVITY_NAME,
    callbackName: 'intervalDidEnd',
    actions: reblock,
  });

  // Deliberately longer than the grant the user is shown: fifteen minutes is
  // Apple's floor and the grant is three, so this is a *backstop*, not the
  // primary expiry. `startGrantClock` and `enforcePersistentBlock()` re-block at
  // the real grant length whenever Byre is alive. This exists so that force-
  // quitting Byre the moment the door opens costs fifteen minutes instead of
  // buying unlimited access, which is what it bought before.
  const windowMinutes = Math.max(grantMinutes, MIN_OS_WINDOW_MINUTES);
  const start = new Date();
  const end = new Date(start.getTime() + windowMinutes * 60_000);

  // A window running past midnight comes back with intervalEnd < intervalStart,
  // which is a schedule that never ends. Clamp to the last minute of the day,
  // and skip the backstop entirely if what's left of today is under Apple's
  // floor — the JS clock and foreground enforcement still cover that window, and
  // a schedule that never ends would be worse than none.
  const crossesMidnight = end.getDate() !== start.getDate();
  const startMinuteOfDay = start.getHours() * 60 + start.getMinutes();
  if (crossesMidnight && 23 * 60 + 59 - startMinuteOfDay < MIN_OS_WINDOW_MINUTES) return;
  const intervalEnd = crossesMidnight
    ? { hour: 23, minute: 59 }
    : { hour: end.getHours(), minute: end.getMinutes() };

  // startMonitoring throws on a schedule Apple rejects. There was no catch
  // anywhere in this chain and it ran *after* unblockSelectedApps(), so a throw
  // left the apps open with no re-block scheduled — precisely the state this
  // function exists to prevent. Callers now unblock last; a failure here costs
  // the backstop, not the block.
  try {
    native.startMonitoring(
      DAILY_ACTIVITY_NAME,
      {
        intervalStart: { hour: start.getHours(), minute: start.getMinutes() },
        intervalEnd,
        repeats: false,
      },
      [
        {
          familyActivitySelection: token,
          threshold: { minute: windowMinutes },
          eventName: GRANT_EVENT_NAME,
        },
      ],
    );
  } catch (e) {
    console.warn('[byre] grant backstop not armed', e);
  }
}

/** Full grant flow: arm the re-block, then open the door.
 *
 *  Order is the whole point. The clock is recorded and the OS backstop armed
 *  *before* unblockSelectedApps(), so there is no window in which the apps are
 *  open and nothing is scheduled to close them again. The old order unblocked
 *  first, and since startMonitoring throws on a sub-fifteen-minute schedule,
 *  every single grant took that throw *after* the door was already open. */
export function grantTemporaryAccess(grantMinutes: number) {
  // Recorded before the window is armed so a crash between the two still
  // leaves the app knowing the door is open and how much is left. The clock
  // starts here, not when the user leaves — three minutes means three minutes.
  startGrantClock(grantMinutes * 60_000);
  startGrantWindow(grantMinutes);
  unblockSelectedApps();
}

/* ------------------------------------------------------------------ *
 * Always-on blocking
 *
 * The shield used to be applied only inside startSession(), so between
 * sessions the picked apps opened normally — the app said "Blocked" while
 * the OS was told nothing. The block is now the resting state: it is applied
 * as soon as there is a selection and only ever lifted for the length of an
 * earned grant. Everything below is about keeping that one fact true.
 * ------------------------------------------------------------------ */

/* ---- The grant clock ----------------------------------------------
 *
 * A grant is a plain wall-clock window: it starts the moment the challenge
 * is passed and ends `grantMinutes` later, whatever the user does in
 * between. Deliberately chosen over a usage-metered budget — the deal is
 * simply "three minutes, then it locks."
 *
 * The cost of that choice is that time spent inside Byre is time spent, so
 * GrantScreen must send the user off rather than invite them to watch the
 * countdown. That screen is where this rule gets honoured.
 *
 * DeviceActivity can't enforce a window this short for us — Apple's
 * schedules and usage thresholds both have a 15-minute floor — so the
 * deadline is tracked here, in the app group, and survives the JS process
 * being killed mid-window.
 */
/** Milliseconds of the budget still unspent. */
const GRANT_REMAINING_KEY = 'byre-grant-remaining-ms';
/** When the budget last started burning, or absent while it is paused. */
const GRANT_RUNNING_SINCE_KEY = 'byre-grant-running-since';

function readNumber(key: string): number | null {
  const raw = native?.userDefaultsGet?.<number>(key);
  return typeof raw === 'number' ? raw : null;
}

function writeNumber(key: string, value: number | null) {
  if (!native) return;
  if (value === null) native.userDefaultsRemove?.(key);
  else native.userDefaultsSet?.(key, value);
}

/** Budget left right now, counting whatever has burned since it started. */
export function grantRemainingMs(): number {
  const stored = readNumber(GRANT_REMAINING_KEY);
  if (stored === null || stored <= 0) return 0;
  const since = readNumber(GRANT_RUNNING_SINCE_KEY);
  if (since === null) return stored; // paused
  return Math.max(0, stored - (Date.now() - since));
}

/** The deadline the rest of the app reasons about. While the clock is
 *  paused this is always in the future, which is the point: sitting in Byre
 *  must never be what ends a grant. */
function grantUntil(): number | null {
  const remaining = grantRemainingMs();
  if (remaining <= 0) return null;
  const since = readNumber(GRANT_RUNNING_SINCE_KEY);
  return since === null ? Date.now() + remaining : since + (readNumber(GRANT_REMAINING_KEY) ?? 0);
}

function setGrantBudget(ms: number | null) {
  writeNumber(GRANT_REMAINING_KEY, ms);
  writeNumber(GRANT_RUNNING_SINCE_KEY, null);
}

/** Starts the window running from now. */
function startGrantClock(ms: number) {
  writeNumber(GRANT_REMAINING_KEY, ms);
  writeNumber(GRANT_RUNNING_SINCE_KEY, Date.now());
}

export type BlockState =
  /** Screen Time unavailable, or nothing picked yet — nothing is held back. */
  | { kind: 'none' }
  /** The resting state: everything in the selection is shielded right now. */
  | { kind: 'blocked' }
  /** Earned access, ending at `until`. */
  | { kind: 'granted'; until: number };

/** The single answer to "is Byre holding the door right now?" — every screen
 *  that talks about blocking reads this instead of guessing from a timer. */
export function getBlockState(): BlockState {
  if (!native || !hasBlockedSelection()) return { kind: 'none' };
  const until = grantUntil();
  if (until) return { kind: 'granted', until };
  return { kind: 'blocked' };
}

/** Puts the block back to its resting state. Safe to call repeatedly — this
 *  runs on every foreground, so it is what repairs the block after a grant
 *  runs out while the app was closed. */
export function enforcePersistentBlock() {
  if (!native || !hasBlockedSelection()) return;
  if (grantUntil()) return; // a grant is still running; leave it open
  blockSelectedApps();
}

/** Ends a grant early or on expiry and re-shields immediately. */
export function endGrantNow() {
  setGrantBudget(null);
  enforcePersistentBlock();
}

/** Releases every Screen Time restriction this app has ever applied,
 *  regardless of whether the local selection record still exists.
 *
 * Recovery path for exactly one scenario: uninstalling Byre wipes its App
 * Group container (the selection record lives there), but Apple's shield
 * is enforced by the OS independently of that container — by design, so a
 * kid can't escape a block by deleting the controlling app. Reinstalling
 * gets Byre back but not the record of what it had blocked, so the normal
 * "unblock these specific tokens" call has nothing to point at. resetBlocks
 * doesn't need to know which tokens — it clears the OS-level state directly.
 */
export function resetAllBlocks() {
  native?.resetBlocks?.('recoverOrphanedShield');
  native?.disableBlockAllMode?.('recoverOrphanedShield');
  setGrantBudget(null);
}
