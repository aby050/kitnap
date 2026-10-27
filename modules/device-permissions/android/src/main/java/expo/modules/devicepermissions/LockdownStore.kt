package expo.modules.devicepermissions

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.telecom.TelecomManager

/**
 * Total lockdown: during a running timer, everything is shielded except a
 * short allowlist.
 *
 * The ordinary mode is a blocklist — the user names the apps they want held
 * back. This is the inverse, for a session where the answer to "can I open
 * this?" should be no by default. Inverting the rule is easy; picking what
 * survives it is the whole job, because an allowlist that is one entry too
 * short turns a focus app into a phone that appears bricked.
 *
 * Three things survive, and none of them is a preference:
 *
 *  - The dialer and the in-call UI, so a call can be made and answered. This
 *    is the entire point of the feature as asked for.
 *  - System UI, which owns the incoming-call window, the shade and the status
 *    bar. A call that cannot be answered is not an allowed call, and a device
 *    with no status bar looks crashed.
 *  - Settings, plus the permission controller and package installer behind it.
 *    Blocking these would mean a user could not switch off the accessibility
 *    service or uninstall this app until the timer ended. On a week-long block
 *    that is not commitment, it is being locked out of your own phone.
 *
 * The launcher is deliberately NOT allowed. Pressing home during a session
 * lands on the shield, because the timer screen is the session; the only door
 * out of it is the call button on the timer itself. Messages and the clock are
 * not allowed either, for the same reason.
 */
object LockdownStore {
  private const val PREFS = "byre_lockdown"
  private const val KEY_ON = "on"
  private const val KEY_UNTIL = "until"

  fun set(context: Context, on: Boolean) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_ON, on)
      .apply()
  }

  /**
   * When the session ends, held natively. The flag alone used to depend on JS
   * to switch it off, so a process killed mid-session either never released
   * the lock or, after a restart, had nothing to reconcile against. With the
   * deadline here the service enforces and expires it on its own.
   */
  fun setUntil(context: Context, untilMs: Long) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putLong(KEY_UNTIL, untilMs)
      .apply()
  }

  fun isOn(context: Context): Boolean {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (!prefs.getBoolean(KEY_ON, false)) return false
    val until = prefs.getLong(KEY_UNTIL, 0L)
    if (until > 0L && System.currentTimeMillis() > until) {
      prefs.edit().putBoolean(KEY_ON, false).putLong(KEY_UNTIL, 0L).apply()
      return false
    }
    return true
  }

  /**
   * Home screens installed on the device. During lockdown these are the one
   * thing shielded besides the user's blocklist: the timer screen lists every
   * open app and launches it directly, so the launcher is never needed.
   */
  fun launchers(context: Context): Set<String> {
    val out = HashSet<String>()
    try {
      val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
      context.packageManager.queryIntentActivities(intent, 0)
        .forEach { out.add(it.activityInfo.packageName) }
    } catch (e: Exception) {
      // Fall through with what was found.
    }
    return out
  }

  /** Lockdown's rule: the blocklist plus the home screen. Everything else,
   *  including apps installed mid-session, stays openable from the timer. */
  fun isBlocked(context: Context, pkg: String, blocklist: Set<String>): Boolean {
    if (pkg == context.packageName) return false
    if (pkg in blocklist) return true
    return pkg in launchers(context)
  }

  /**
   * Packages that stay reachable while lockdown is on.
   *
   * Resolved from the system rather than hardcoded, because the dialer and
   * launcher differ by device — a hardcoded "com.android.dialer" is exactly
   * how this feature would brick a Samsung.
   */
  fun allowed(context: Context): Set<String> {
    val out = HashSet<String>()
    out.add(context.packageName)

    // Whatever this device actually uses to place calls.
    try {
      val telecom = context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
      telecom?.defaultDialerPackage?.let { out.add(it) }
    } catch (e: Exception) {
      // Permission or OEM oddity — the intent probe below still covers it.
    }
    resolve(context, Intent(Intent.ACTION_DIAL))?.let { out.add(it) }

    // System UI owns the status bar, the shade, the recents view and the
    // incoming-call window. Shielding it makes the device look crashed.
    out.add("com.android.systemui")
    out.add("android")

    // Settings, so switching this app off is always possible. See the note
    // above: a lock the user cannot undo from their own device is a trap.
    resolve(context, Intent(Settings.ACTION_SETTINGS))?.let { out.add(it) }
    out.add("com.android.settings")

    // The permission-controller and package installer, so a revoke or an
    // uninstall started from Settings can actually finish.
    out.add("com.google.android.permissioncontroller")
    out.add("com.android.permissioncontroller")
    out.add("com.android.packageinstaller")
    return out
  }

  private fun resolve(context: Context, intent: Intent): String? = try {
    context.packageManager.resolveActivity(intent, 0)?.activityInfo?.packageName
  } catch (e: Exception) {
    null
  }
}
