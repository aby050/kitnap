package expo.modules.devicepermissions

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.os.Build
import android.os.PowerManager

/**
 * The running session, on the lock screen.
 *
 * Android has no Live Activity, and no app can draw on the always-on display —
 * that belongs to the OEM. What it does have is an ongoing notification with a
 * chronometer, which the system counts down itself: nothing here wakes once a
 * second, so a three-hour session costs the same as a one-minute one.
 *
 * Deliberately NOT a foreground service. A countdown is not data sync, media
 * playback or any other declarable foreground-service type, and claiming one
 * to get a notification would be both dishonest and a Play policy problem.
 * Enforcement doesn't need it either — the Accessibility Service is what
 * notices a blocked app opening, and the system keeps that alive on its own.
 */
object SessionNotification {
  private const val CHANNEL_ID = "byre_session"
  private const val NOTIFICATION_ID = 4711

  fun show(context: Context, endsAt: Long, label: String, blockedCount: Int) {
    if (endsAt <= System.currentTimeMillis()) return
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    ensureChannel(manager)

    val open = context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
      PendingIntent.getActivity(
        context,
        0,
        it,
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
      )
    }

    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(context)
    }

    builder
      .setContentTitle(label)
      .setContentText(
        if (blockedCount > 0) {
          "$blockedCount ${if (blockedCount == 1) "app" else "apps"} held back"
        } else {
          "Block running"
        },
      )
      .setSmallIcon(context.applicationInfo.icon)
      .setOngoing(true)
      .setShowWhen(true)
      // The system ticks this down itself — no timer, no wakeups, and it keeps
      // counting while the screen is off.
      .setUsesChronometer(true)
      .setWhen(endsAt)
      .setVisibility(Notification.VISIBILITY_PUBLIC)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) builder.setChronometerCountDown(true)
    if (open != null) builder.setContentIntent(open)

    manager.notify(NOTIFICATION_ID, builder.build())
  }

  fun hide(context: Context) {
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.cancel(NOTIFICATION_ID)
  }

  private fun ensureChannel(manager: NotificationManager) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Focus session",
      // Low on purpose: it must be visible, but a session starting is not an
      // event worth buzzing about — the whole point is fewer interruptions.
      NotificationManager.IMPORTANCE_LOW,
    ).apply {
      description = "Shows the countdown while a block is running."
      setShowBadge(false)
      enableVibration(false)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    }
    manager.createNotificationChannel(channel)
  }
}

/** Whether the OS is in battery saver, so the UI can drop its animation. */
fun isPowerSaveMode(context: Context): Boolean {
  val power = context.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return false
  return power.isPowerSaveMode
}
