package expo.modules.devicepermissions

import android.content.Context

/**
 * The app the shield offers instead of the blocked one — a book, a language
 * app, a notes app. Picked by the user in Kitnap; empty means no offer.
 *
 * A block that only says no leaves the reach with nowhere to go, and the
 * reach comes straight back. Naming a better place to put it is the cheapest
 * redirect there is: one tap, and the thumb lands somewhere chosen in a calm
 * moment rather than nowhere.
 */
object AlternativeAppStore {
  private const val PREFS = "byre_alternative"
  private const val KEY = "package"

  fun set(context: Context, pkg: String?) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY, pkg ?: "")
      .apply()
  }

  fun get(context: Context): String? =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "")
      ?.takeIf { it.isNotBlank() }
}
