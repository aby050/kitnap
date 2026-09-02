package expo.modules.devicepermissions

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager

/**
 * The running session, on the lock screen.
 *
 * Android has no equivalent of a Live Activity, and no app can draw on the
 * always-on display — that belongs to the OEM. What it does have is an ongoing
 * notification with a chronometer, which the system counts down itself. That
 * matters more than it sounds: nothing here wakes once a second, so a
 * three-hour session costs the same as a one-minute one.
 *
 * The service exists for a second reason. Without it Android is free to kill
 * the process while the app is backgrounded, and a block that dies when the
 * user switches away isn't a block.
 */
class SessionTimerService : Service() {
  companion object {
    const val CHANNEL_ID = "byre_session"
    const val NOTIFICATION_ID = 4711

    const val EXTRA_ENDS_AT = "endsAt"
    const val EXTRA_LABEL = "label"
    const val EXTRA_BLOCKED = "blockedCount"

    fun start(context: Context, endsAt: Long, label: String, blockedCount: Int) {
      val intent = Intent(context, SessionTimerService::class.java)
        .putExtra(EXTRA_ENDS_AT, endsAt)
        .putExtra(EXTRA_LABEL, label)
        .putExtra(EXTRA_BLOCKED, blockedCount)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, SessionTimerService::class.java))
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val endsAt = intent?.getLongExtra(EXTRA_ENDS_AT, 0L) ?: 0L
    val label = intent?.getStringExtra(EXTRA_LABEL) ?: "Focus"
    val blocked = intent?.getIntExtra(EXTRA_BLOCKED, 0) ?: 0

    if (endsAt <= System.currentTimeMillis()) {
      stopSelf()
      return START_NOT_STICKY
    }

    ensureChannel()
    startForeground(NOTIFICATION_ID, buildNotification(endsAt, label, blocked))
    // Redelivers the intent if Android kills us, so the countdown comes back
    // with its real end time rather than restarting from zero.
    return START_REDELIVER_INTENT
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Focus session",
      // Low: it must be visible, but a session starting is not an event worth
      // buzzing about — the point of the app is fewer interruptions.
      NotificationManager.IMPORTANCE_LOW,
    ).apply {
      description = "Shows the countdown while a block is running."
      setShowBadge(false)
      enableVibration(false)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    }
    manager.createNotificationChannel(channel)
  }

  private fun buildNotification(endsAt: Long, label: String, blocked: Int): Notification {
    val open = packageManager.getLaunchIntentForPackage(packageName)?.let {
      PendingIntent.getActivity(
        this,
        0,
        it,
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
      )
    }

    // The system ticks this down on its own — no timer, no wakeups, and it
    // keeps counting while the screen is off.
    val builder = Notification.Builder(this, CHANNEL_ID)
      .setContentTitle(label)
      .setContentText(
        if (blocked > 0) "$blocked ${if (blocked == 1) "app" else "apps"} held back" else "Block running",
      )
      .setSmallIcon(applicationInfo.icon)
      .setOngoing(true)
      .setShowWhen(true)
      .setUsesChronometer(true)
      .setWhen(endsAt)
      .setVisibility(Notification.VISIBILITY_PUBLIC)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      builder.setChronometerCountDown(true)
    }
    if (open != null) builder.setContentIntent(open)

    return builder.build()
  }
}

/** Whether the OS is in battery saver, so the UI can drop its animation. */
fun isPowerSaveMode(context: Context): Boolean {
  val power = context.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return false
  return power.isPowerSaveMode
}
