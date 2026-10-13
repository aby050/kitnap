package expo.modules.devicepermissions

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import java.util.Calendar

/**
 * Home-screen widget: today's screen time, the streak, and the week's
 * reclaimed time.
 *
 * Screen time is read here, natively, every time the widget updates, so it is
 * true even if Phonewise has not been opened all day — a widget that only
 * knows what the app last told it is a widget that is wrong by lunchtime.
 * Streak and reclaimed time live in the app's own state, so JS writes them
 * through WidgetStatsStore whenever they change and nudges the widget.
 */
class PhonewiseWidget : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    for (id in ids) manager.updateAppWidget(id, render(context))
  }

  companion object {
    fun refreshAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, PhonewiseWidget::class.java))
      if (ids.isEmpty()) return
      val views = render(context)
      for (id in ids) manager.updateAppWidget(id, views)
    }

    private fun render(context: Context): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.phonewise_widget)

      val minutes = screenTimeToday(context)
      if (minutes == null) {
        views.setTextViewText(R.id.widget_screen_time, "—")
        views.setTextViewText(R.id.widget_screen_label, "Turn on usage access")
      } else {
        views.setTextViewText(R.id.widget_screen_time, format(minutes))
        val goal = WidgetStatsStore.goalMinutes(context)
        views.setTextViewText(
          R.id.widget_screen_label,
          if (goal > 0) "today · goal ${format(goal.toLong())}" else "screen time today",
        )
        views.setInt(
          R.id.widget_screen_time, "setTextColor",
          if (goal > 0 && minutes > goal) 0xFFFFB86B.toInt() else 0xFFFFFFFF.toInt(),
        )
      }

      val streak = WidgetStatsStore.streak(context)
      views.setTextViewText(R.id.widget_streak, streak.toString())
      views.setTextViewText(R.id.widget_streak_label, if (streak == 1) "day streak" else "day streak")

      val reclaimed = WidgetStatsStore.reclaimedWeekMinutes(context)
      views.setTextViewText(R.id.widget_reclaimed, format(reclaimed.toLong()))
      views.setViewVisibility(R.id.widget_reclaimed_box, if (reclaimed > 0) View.VISIBLE else View.GONE)

      val open = Intent(Intent.ACTION_VIEW, Uri.parse("phonewise://home"))
        .setPackage(context.packageName)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      views.setOnClickPendingIntent(
        R.id.widget_root,
        PendingIntent.getActivity(
          context, 0, open,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        ),
      )
      return views
    }

    /** Same rule as the app's Home number: every app with a minute or more. */
    private fun screenTimeToday(context: Context): Long? {
      if (!UsageAccess.isGranted(context)) return null
      val start = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
      }.timeInMillis
      return UsageAccess.query(context, start, System.currentTimeMillis())
        .map { Math.round((it["totalTimeInForeground"] as Double) / 60000.0) }
        .filter { it >= 1 }
        .sum()
    }

    private fun format(m: Long): String =
      if (m < 60) "${m}m" else if (m % 60 == 0L) "${m / 60}h" else "${m / 60}h ${m % 60}m"
  }
}

/** What JS knows and the widget can't compute: streak, goal, reclaimed time. */
object WidgetStatsStore {
  private const val PREFS = "byre_widget"

  fun set(context: Context, streak: Int, goalMinutes: Int, reclaimedWeekMinutes: Int) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putInt("streak", streak)
      .putInt("goal", goalMinutes)
      .putInt("reclaimed", reclaimedWeekMinutes)
      .apply()
  }

  private fun p(c: Context) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
  fun streak(c: Context) = p(c).getInt("streak", 0)
  fun goalMinutes(c: Context) = p(c).getInt("goal", 0)
  fun reclaimedWeekMinutes(c: Context) = p(c).getInt("reclaimed", 0)
}
