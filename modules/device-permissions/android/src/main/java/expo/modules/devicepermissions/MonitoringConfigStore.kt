package expo.modules.devicepermissions

import android.content.Context

/**
 * Battery/responsiveness tradeoff for the Accessibility Service.
 *
 * notificationTimeout is Android's own batching window for accessibility
 * events — the OS coalesces events arriving within that window into fewer
 * wakeups instead of dispatching each one, which is the actual lever on
 * battery cost (not our own debounce, which only reduces app-level work
 * after the OS has already woken us). Longer window = less frequent wakeups
 * = less battery, at the cost of the shield taking a beat longer to appear.
 *
 * Deliberately mirrors the existing gentle/steady/strict intensity tiers so
 * "how aggressive should this be" is one setting, not two.
 */
enum class MonitoringLevel(val notificationTimeoutMs: Long, val debounceMs: Long) {
  GENTLE(1200L, 2500L),
  BALANCED(500L, 1500L),
  STRICT(150L, 800L),
}

object MonitoringConfigStore {
  private const val PREFS = "byre_monitoring_config"
  private const val KEY = "level"

  @Volatile
  private var cache: MonitoringLevel? = null

  fun set(context: Context, level: MonitoringLevel) {
    cache = level
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY, level.name)
      .apply()
  }

  fun get(context: Context): MonitoringLevel {
    cache?.let { return it }
    val stored = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
    val level = stored?.let { runCatching { MonitoringLevel.valueOf(it) }.getOrNull() } ?: MonitoringLevel.BALANCED
    cache = level
    return level
  }
}
