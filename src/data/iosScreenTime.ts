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
 *   - com.abhay050.wend
 *   - com.abhay050.wend.ActivityMonitor
 *   - com.abhay050.wend.ShieldAction
 *   - com.abhay050.wend.ShieldConfiguration
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

export async function requestScreenTimeAuthorization(): Promise<AuthorizationStatus> {
  if (!native) return 'unavailable';
  try {
    await native.requestAuthorization();
    return readStatus(native.getAuthorizationStatus());
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
const SELECTION_ID = 'wend-blocklist';
const DAILY_ACTIVITY_NAME = 'wend-daily';
const GRANT_EVENT_NAME = 'wend-grant-window';

/** Saves the token the DeviceActivitySelectionView picker returns —
 *  everything else (blocking, monitoring) refers to it by SELECTION_ID. */
export function saveBlockedSelection(familyActivitySelectionToken: string) {
  native?.setFamilyActivitySelectionId({ id: SELECTION_ID, familyActivitySelection: familyActivitySelectionToken });
}

export function hasBlockedSelection(): boolean {
  return !!native?.getFamilyActivitySelectionId(SELECTION_ID);
}

/** Applies the block immediately — the OS now shows Apple's native Shield
 *  over any app in the selection until unblockSelectedApps() is called. */
export function blockSelectedApps() {
  native?.blockSelection({ activitySelectionId: SELECTION_ID });
}

export function unblockSelectedApps() {
  native?.unblockSelection({ activitySelectionId: SELECTION_ID });
}

export function isCurrentlyShielded(): boolean {
  return native?.isShieldActive() ?? false;
}

/** Sets the Shield's appearance and what its button does. The primary
 *  button opens Wend (via `type: 'openApp'`) rather than granting access
 *  directly — the actual Gate/difficulty challenge happens inside Wend,
 *  same as the Android flow, not inside the Shield extension itself (Apple
 *  doesn't allow arbitrary custom UI there). */
export function configureShield(title: string, subtitle: string) {
  if (!native) return;
  native.updateShield(
    {
      title,
      subtitle,
      iconSystemName: 'hourglass',
      primaryButtonLabel: 'Open Wend',
    },
    {
      primary: { type: 'openApp', behavior: 'close' },
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
