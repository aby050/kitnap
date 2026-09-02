import { Platform } from 'react-native';

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
];

/** One line per day, so it's a familiar face rather than a slot machine. */
function shieldLineForToday() {
  const day = Math.floor(Date.now() / 86_400_000);
  return SHIELD_LINES[day % SHIELD_LINES.length];
}

const MINT = { red: 111, green: 227, blue: 169, alpha: 1 };
const NEAR_BLACK = { red: 8, green: 10, blue: 12, alpha: 1 };
const WHITE = { red: 255, green: 255, blue: 255, alpha: 1 };
const DIM = { red: 255, green: 255, blue: 255, alpha: 0.62 };

export function configureShield(_title?: string, personalLine?: string) {
  if (!native) return;
  const line = shieldLineForToday();
  native.updateShield(
    {
      title: line.title,
      titleColor: WHITE,
      // The user's own reason, when they gave one, beats anything we wrote.
      subtitle: personalLine || line.subtitle,
      subtitleColor: DIM,
      backgroundColor: NEAR_BLACK,
      iconSystemName: line.icon,
      iconTint: MINT,
      primaryButtonLabel: 'Let me in',
      primaryButtonLabelColor: { red: 4, green: 18, blue: 12, alpha: 1 },
      primaryButtonBackgroundColor: MINT,
      secondaryButtonLabel: 'Fine, later',
      secondaryButtonLabelColor: DIM,
    },
    {
      primary: { type: 'openApp', behavior: 'close' },
      // Closes the shield and leaves the app blocked — the honest "not now".
      secondary: { type: 'dismiss', behavior: 'close' },
    },
  );
}

/** Starts (or restarts) always-on daily monitoring for the selection, with
 *  a fresh usage-time threshold that — once someone actually uses the
 *  granted apps for `grantMinutes` — fires blockSelection again via
 *  configureActions below. Restarting on every grant is what resets the
 *  threshold counter for that grant window; there is no separate "pause"
 *  API for a single event. */
export function startGrantWindow(grantMinutes: number) {
  if (!native) return;
  // DeviceActivityEvent needs the actual selection token, not the
  // persisted-id shorthand that blockSelection/unblockSelection accept.
  const token = native.getFamilyActivitySelectionId(SELECTION_ID);
  if (!token) return;
  native.configureActions({
    activityName: DAILY_ACTIVITY_NAME,
    callbackName: 'eventDidReachThreshold',
    eventName: GRANT_EVENT_NAME,
    actions: [{ type: 'blockSelection', familyActivitySelectionId: SELECTION_ID }],
  });
  native.startMonitoring(
    DAILY_ACTIVITY_NAME,
    { intervalStart: { hour: 0, minute: 0 }, intervalEnd: { hour: 23, minute: 59 }, repeats: true },
    [
      {
        familyActivitySelection: token,
        threshold: { minute: grantMinutes },
        eventName: GRANT_EVENT_NAME,
      },
    ],
  );
}

/** Full grant flow: unblock now, and arm the native threshold so it
 *  re-blocks itself after `grantMinutes` of actual use — no JS timer
 *  involved, so it still works if the app gets backgrounded or killed. */
export function grantTemporaryAccess(grantMinutes: number) {
  unblockSelectedApps();
  startGrantWindow(grantMinutes);
}
