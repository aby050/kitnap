import { requireNativeModule } from 'expo';
import { Platform } from 'react-native';

/**
 * The running session as a Live Activity.
 *
 * This is what makes the countdown survive leaving the app: iOS renders it on
 * the Lock Screen, in the Dynamic Island and on the always-on display, and
 * ticks it down itself from the end date. Every call is a no-op off iOS, or
 * when the user has turned Live Activities off for Phonewise.
 */
let native: any = null;
if (Platform.OS === 'ios') {
  try {
    native = requireNativeModule('LiveTimer');
  } catch {
    native = null;
  }
}

export const liveTimerAvailable = (): boolean => {
  try {
    return !!native?.isAvailable();
  } catch {
    return false;
  }
};

export function startLiveTimer(endsAt: number, label: string, blockedCount = 0): boolean {
  try {
    return !!native?.start(endsAt, label, blockedCount);
  } catch {
    return false;
  }
}

export function updateLiveTimer(endsAt: number, label: string, blockedCount = 0): void {
  try {
    native?.update(endsAt, label, blockedCount);
  } catch {
    /* the activity simply stays as it was */
  }
}

export function endLiveTimer(): void {
  try {
    native?.end();
  } catch {
    /* nothing to end */
  }
}
