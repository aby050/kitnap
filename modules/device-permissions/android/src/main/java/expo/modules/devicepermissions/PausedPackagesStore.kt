package expo.modules.devicepermissions

import android.content.Context

/**
 * Apps that get a pause rather than a block.
 *
 * The middle setting the app was missing. A blocked app is one you decided
 * you should not open; a paused app is one you open twenty times a day
 * without ever deciding anything. Those want different answers — a challenge
 * is too much friction for the second, and nothing at all is too little.
 *
 * So a paused app opens, but not immediately: a few seconds of nothing, with
 * the option to turn back. Most of the value is in the turning back being
 * offered at all. The reach is automatic; the pause is what makes the next
 * moment a decision.
 *
 * Same shape as BlockedPackagesStore, and deliberately a separate list: an
 * app is paused or blocked, never both, and the service checks blocked first.
 */
object PausedPackagesStore {
  private const val PREFS = "byre_paused_packages"
  private const val KEY = "packages"
  private const val KEY_SECONDS = "seconds"

  /** Long enough for the reflex to break, short enough not to be a punishment.
   *  Under about four the screen reads as a loading spinner; past about twelve
   *  people put the phone down out of irritation rather than intent, which
   *  looks like the same number but is a worse reason. */
  const val DEFAULT_SECONDS = 6

  @Volatile
  private var cache: Set<String>? = null

  @Volatile
  private var secondsCache: Int? = null

  fun set(context: Context, packages: List<String>) {
    val set = packages.toSet()
    cache = set
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putStringSet(KEY, set)
      .apply()
  }

  fun get(context: Context): Set<String> {
    cache?.let { return it }
    val loaded = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getStringSet(KEY, emptySet()) ?: emptySet()
    cache = loaded
    return loaded
  }

  fun setSeconds(context: Context, seconds: Int) {
    val clamped = seconds.coerceIn(3, 30)
    secondsCache = clamped
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putInt(KEY_SECONDS, clamped)
      .apply()
  }

  fun seconds(context: Context): Int {
    secondsCache?.let { return it }
    val loaded = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getInt(KEY_SECONDS, DEFAULT_SECONDS)
    secondsCache = loaded
    return loaded
  }
}
