package expo.modules.devicepermissions

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/** Minimal stub — logs which package posted a notification. Not yet wired to
 *  suppress or act on notifications from distracting apps. */
class ByreNotificationListenerService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn != null) Log.d("ByreNotifListener", "Notification from: ${sbn.packageName}")
  }
}
