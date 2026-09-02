package expo.modules.devicepermissions

import android.content.Context

/**
 * Shared between the JS-facing module (which writes the list whenever it
 * changes in the app) and ByreAccessibilityService (which reads it on every
 * foreground-app event). Backed by SharedPreferences so the list survives
 * the service outliving the JS process, with an in-memory cache so the hot
 * path (checking every window-state-changed event) never touches disk.
 */
object BlockedPackagesStore {
  private const val PREFS = "byre_blocked_packages"
  private const val KEY = "packages"

  @Volatile
  private var cache: Set<String>? = null

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
}
