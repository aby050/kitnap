package expo.modules.devicepermissions

import android.content.Context

/**
 * The "a challenge was passed, let them back in for a bit" window.
 *
 * Written by the JS side the moment a grant starts (and cleared when the user
 * ends it early), read by ByreAccessibilityService on every foreground-app
 * event. Without this the service had no idea a grant existed and re-fired the
 * shield the instant the user returned to the app they had just earned their
 * way into — the challenge looked like it had to be redone every single time.
 *
 * Same shape as BlockedPackagesStore: SharedPreferences so it survives the
 * service outliving the JS process, plus an in-memory cache so the hot path
 * never touches disk.
 */
object GrantStore {
  private const val PREFS = "byre_grant"
  private const val KEY = "granted_until"

  @Volatile
  private var cache: Long? = null

  /** `until` is an epoch-millis deadline; 0 means "no grant". */
  fun set(context: Context, until: Long) {
    cache = until
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putLong(KEY, until)
      .apply()
  }

  fun clear(context: Context) = set(context, 0L)

  fun grantedUntil(context: Context): Long {
    cache?.let { return it }
    val loaded = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getLong(KEY, 0L)
    cache = loaded
    return loaded
  }

  fun isGranted(context: Context): Boolean = grantedUntil(context) > System.currentTimeMillis()
}
