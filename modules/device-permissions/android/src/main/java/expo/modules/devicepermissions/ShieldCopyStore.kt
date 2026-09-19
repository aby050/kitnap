package expo.modules.devicepermissions

import android.content.Context

/**
 * What the overlay says, written by the JS side.
 *
 * The cover has to appear before React Native is running, so it cannot ask the
 * app what to put on it — but hardcoding English in Kotlin would mean the
 * block screen, the one screen that has to sound like Byre, was the only one
 * that could not. So JS writes the current lines here whenever the shield is
 * configured (theme voice, the user's own reason, the rotating line) and the
 * service reads them off disk in the moment.
 *
 * Defaults are deliberately plain: they are what shows on the very first block
 * if JS has never run since install, and a first block that sounds like a
 * system error would be worse than one that sounds unremarkable.
 */
object ShieldCopyStore {
  private const val PREFS = "byre_shield_copy"
  private const val KEY_TITLE = "title"
  private const val KEY_BODY = "body"
  private const val KEY_CTA = "cta"

  private const val DEFAULT_TITLE = "Not this one."
  private const val DEFAULT_BODY = "You asked Byre to keep this shut. Open Byre to earn your way in."
  private const val DEFAULT_CTA = "Let me in"

  fun set(context: Context, title: String, body: String, cta: String) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_TITLE, title)
      .putString(KEY_BODY, body)
      .putString(KEY_CTA, cta)
      .apply()
  }

  private fun read(context: Context, key: String, fallback: String): String =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(key, fallback) ?: fallback

  fun title(context: Context): String = read(context, KEY_TITLE, DEFAULT_TITLE)
  fun body(context: Context): String = read(context, KEY_BODY, DEFAULT_BODY)
  fun cta(context: Context): String = read(context, KEY_CTA, DEFAULT_CTA)
}
