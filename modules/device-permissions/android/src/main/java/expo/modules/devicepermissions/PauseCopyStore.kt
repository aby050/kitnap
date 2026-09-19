package expo.modules.devicepermissions

import android.content.Context

/**
 * The single line shown under the countdown.
 *
 * Same reason ShieldCopyStore exists: the overlay draws before React Native
 * is running, so the words have to be on disk already. Kept apart from the
 * shield's copy because the two are saying different things — the shield
 * holds a door shut, this one just asks whether you meant to.
 *
 * The default is a question rather than a statement on purpose. "You opened
 * this 14 times today" is a scold, and people turn off things that scold
 * them; "Did you mean to?" is the only thing the pause is actually for.
 */
object PauseCopyStore {
  private const val PREFS = "byre_pause_copy"
  private const val KEY = "line"
  private const val DEFAULT = "Did you mean to open this?"

  fun set(context: Context, line: String) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, line).apply()
  }

  fun line(context: Context): String =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, DEFAULT) ?: DEFAULT
}
