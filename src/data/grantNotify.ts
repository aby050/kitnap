import { Alert, Platform } from 'react-native';

const GRANT_NOTIFY_ID = 'byre-grant-ended';

type NotificationsModule = typeof import('expo-notifications');

let notifications: NotificationsModule | null | undefined;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (notifications !== undefined) return notifications;
  try {
    notifications = await import('expo-notifications');
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return notifications;
  } catch {
    notifications = null;
    return null;
  }
}

/** Fire when the timed unlock actually ends — in-app if Byre is open. */
export function alertGrantEnded() {
  Alert.alert('Unlock ended', 'Your timed access is over. Distracting apps are blocked again.');
}

/** Schedule a system notification for when the grant window hits zero.
 *  No-ops on web, or if the notifications library isn't available. */
export async function scheduleGrantEndedNotification(expiresAt: number): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  const seconds = Math.max(1, Math.round((expiresAt - Date.now()) / 1000));
  try {
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return;
    await Notifications.cancelScheduledNotificationAsync(GRANT_NOTIFY_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: GRANT_NOTIFY_ID,
      content: {
        title: 'Unlock ended',
        body: 'Your timed access is over. Distracting apps are blocked again.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
      },
    });
  } catch {
    // Permission denied or native module missing in this binary — in-app alert still fires.
  }
}

export async function cancelGrantEndedNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(GRANT_NOTIFY_ID).catch(() => {});
}
