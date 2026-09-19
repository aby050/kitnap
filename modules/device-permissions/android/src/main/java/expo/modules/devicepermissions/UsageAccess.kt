package expo.modules.devicepermissions

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import android.provider.Settings

/**
 * Usage access, read directly.
 *
 * This used to go through @brighthustle/react-native-usage-stats-manager, and
 * under the New Architecture that package is not merely unreliable — it is
 * absent. Its Kotlin module trips the TurboModule interop's parser
 * ("returnType == void iff the method is synchronous"), so touching
 * NativeModules.UsageStatsManager throws and the whole require fails. Every
 * call site caught that and degraded to "not granted", which is why the
 * permission card kept asking for a grant the user had already given, and why
 * per-app minutes were blank on a device that had the data all along.
 *
 * An Expo module has no such interop layer, and the underlying Android APIs
 * are a handful of lines, so the dependency buys nothing worth that failure.
 */
object UsageAccess {

  /** The real appop, the same one Settings toggles. */
  fun isGranted(context: Context): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName,
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName,
      )
    }
    // MODE_DEFAULT means "no explicit answer" — fall back to actually asking
    // for data, since a device that hands it over has granted it in practice.
    return when (mode) {
      AppOpsManager.MODE_ALLOWED -> true
      AppOpsManager.MODE_DEFAULT -> hasRealData(context)
      else -> false
    }
  }

  /** Does a real query come back with anything? The honest fallback. */
  private fun hasRealData(context: Context): Boolean {
    return try {
      val usage = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
        ?: return false
      val end = System.currentTimeMillis()
      val stats = usage.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, end - 86_400_000L, end)
      !stats.isNullOrEmpty()
    } catch (e: Exception) {
      false
    }
  }

  /**
   * Foreground milliseconds per package over a window, from real events.
   *
   * NOT from `queryUsageStats`. That returns whatever daily buckets overlap
   * the window, several per package, each carrying its own cumulative
   * `totalTimeInForeground` — summing them counts the same minutes repeatedly
   * and reports things like twelve hours of Facebook in a single day. Taking
   * only the last bucket is no better: it silently drops every earlier use.
   *
   * Events are the ground truth. RESUMED opens an interval, PAUSED/STOPPED
   * closes it, each interval is clipped to the requested window, and an app
   * still in the foreground at the end is closed at `endMs`. That is what
   * Digital Wellbeing shows, and it cannot exceed the window length.
   */
  fun query(context: Context, startMs: Long, endMs: Long): List<Map<String, Any>> {
    val usage = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
      ?: return emptyList()

    val totals = HashMap<String, Long>()
    val lastUsed = HashMap<String, Long>()
    // Package -> when its current foreground stretch began.
    val openedAt = HashMap<String, Long>()

    try {
      val events = usage.queryEvents(startMs, endMs)
      val event = android.app.usage.UsageEvents.Event()
      while (events.hasNextEvent()) {
        events.getNextEvent(event)
        val pkg = event.packageName ?: continue
        when (event.eventType) {
          android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED -> {
            openedAt[pkg] = event.timeStamp.coerceAtLeast(startMs)
          }
          android.app.usage.UsageEvents.Event.ACTIVITY_PAUSED,
          android.app.usage.UsageEvents.Event.ACTIVITY_STOPPED -> {
            val began = openedAt.remove(pkg) ?: continue
            val ended = event.timeStamp.coerceAtMost(endMs)
            if (ended > began) {
              totals[pkg] = (totals[pkg] ?: 0L) + (ended - began)
              lastUsed[pkg] = maxOf(lastUsed[pkg] ?: 0L, ended)
            }
          }
        }
      }
    } catch (e: Exception) {
      return emptyList()
    }

    // Whatever was still open when the window closed — typically this app.
    for ((pkg, began) in openedAt) {
      if (endMs > began) {
        totals[pkg] = (totals[pkg] ?: 0L) + (endMs - began)
        lastUsed[pkg] = maxOf(lastUsed[pkg] ?: 0L, endMs)
      }
    }

    val window = (endMs - startMs).coerceAtLeast(0L)
    val pm = context.packageManager
    return totals.entries
      .asSequence()
      .filter { it.value > 0L }
      .sortedByDescending { it.value }
      .map { (pkg, total) ->
        mapOf(
          "packageName" to pkg,
          // A screen that never sleeps can accumulate a few seconds over the
          // window through rounding; clamping keeps "13h of a 12h day" off
          // the screen rather than explaining it.
          "totalTimeInForeground" to total.coerceAtMost(window).toDouble(),
          "lastTimeUsed" to (lastUsed[pkg] ?: 0L).toDouble(),
          "appName" to appLabel(pm, pkg),
        )
      }
      .toList()
  }

  private fun appLabel(pm: PackageManager, pkg: String): String {
    return try {
      pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
    } catch (e: Exception) {
      pkg
    }
  }

  /**
   * Settings › Usage access. The AOSP intent first, then this app's own
   * settings page — on some OEM skins the usage-access activity is not
   * exported and the intent resolves to nothing at all, which looks to the
   * user exactly like a dead button.
   */
  fun openSettings(context: Context) {
    val direct = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    if (direct.resolveActivity(context.packageManager) != null) {
      context.startActivity(direct)
      return
    }
    context.startActivity(
      Intent(
        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
        android.net.Uri.parse("package:${context.packageName}"),
      ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) },
    )
  }
}
