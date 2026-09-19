import { Platform } from 'react-native';
import {
  canDrawOverlays,
  isAccessibilityServiceEnabled,
  devicePermissionsAvailable,
} from 'device-permissions';
import { checkUsageAccessPermission } from './androidUsage';
import { getScreenTimeAuthorizationStatus } from './iosScreenTime';

/**
 * The permissions without which a lock is theatre.
 *
 * Onboarding asks for these, but onboarding can be cut short — a user backs
 * out of a Settings screen, denies once, or restores onto a new phone where
 * the grants did not come along. Nothing re-checked afterwards, so the app
 * would happily start a session, draw a countdown, and block precisely
 * nothing. Hence this: the same question asked again at the only moment it
 * actually matters, immediately before a lock starts.
 *
 * Only genuinely load-bearing grants belong here. Battery exemption and the
 * notification listener make blocking *better*, not possible, and gating a
 * session on them would be nagging rather than protecting.
 */
export type GateKey = 'overlay' | 'usage' | 'accessibility' | 'screenTime';

/** Missing essentials, in the order the boarding pass should present them. */
export async function missingBlockingPermissions(): Promise<GateKey[]> {
  if (Platform.OS === 'ios') {
    return getScreenTimeAuthorizationStatus() === 'approved' ? [] : ['screenTime'];
  }
  if (Platform.OS !== 'android') return [];
  // No native module means a build where blocking cannot work at all (Expo Go,
  // web). Asking for grants there would open Settings screens that lead
  // nowhere, so treat it as nothing to ask for.
  if (!devicePermissionsAvailable()) return [];

  const missing: GateKey[] = [];
  // The shield is drawn over the offending app; without this the block can
  // only ever be a notification after the fact.
  if (!canDrawOverlays()) missing.push('overlay');
  // How the app knows which app is in front, and what today's usage was.
  if (!(await checkUsageAccessPermission())) missing.push('usage');
  // The service that actually notices a blocked app opening. Without it
  // nothing triggers the shield, whatever else is granted.
  if (!isAccessibilityServiceEnabled()) missing.push('accessibility');
  return missing;
}
