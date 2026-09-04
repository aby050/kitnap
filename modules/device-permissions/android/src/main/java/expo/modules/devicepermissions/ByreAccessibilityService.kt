package expo.modules.devicepermissions

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.net.Uri
import android.util.Log
import android.view.accessibility.AccessibilityEvent

/**
 * Watches for foreground-app changes and, when the app that just came to
 * the foreground is on the blocked list, brings Byre to the front via a
 * `byre://shield?package=<pkg>` deep link — the RN side (App.tsx) listens
 * for that URL and shows the Shield/Gate/Grant flow already built for the
 * chosen intensity level.
 *
 * This is a soft interruption, same as every other consumer app in this
 * category (Opal, Freedom, One Sec): Android gives no 3rd-party app the
 * ability to force-close another app or block it at the OS level without
 * Device Owner / MDM enrollment, which is a different, heavier product
 * decision. What this does is put Byre on top immediately and make it the
 * thing the user has to interact with — going back to the blocked app is
 * still technically possible (swipe from recents), same as the real apps
 * this category is built on.
 *
 * Battery note: the event mask below is deliberately narrow
 * (typeWindowStateChanged only, declared in
 * byre_accessibility_service_config.xml) — broader masks like
 * typeAllMask are the actual common cause of accessibility services
 * draining battery in this app category, since they wake the process on
 * every scroll/click system-wide, not just app switches. On top of that,
 * MonitoringConfigStore controls how tightly the OS batches even that
 * narrow event stream — see its doc comment.
 */
class ByreAccessibilityService : AccessibilityService() {
  private var lastPackage: String? = null
  private var lastTriggerAt = 0L
  private var appliedLevel: MonitoringLevel? = null

  override fun onServiceConnected() {
    super.onServiceConnected()
    applyMonitoringLevelIfChanged()
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    // Cheap in-memory check, so reading the level costs nothing on the
    // common path where it hasn't changed since the service connected.
    applyMonitoringLevelIfChanged()

    val pkg = event?.packageName?.toString() ?: return
    if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    if (pkg == packageName) return // never trigger on ourselves

    val blocked = BlockedPackagesStore.get(applicationContext)
    if (!blocked.contains(pkg)) return

    // A grant the user has already earned. Re-showing the shield here is what
    // made a passed challenge feel like it never took: the user finished the
    // reps, tapped Continue, went back to the app, and was handed the camera
    // again. The window is checked, not trusted forever — once it lapses the
    // next foreground event shields as usual.
    if (GrantStore.isGranted(applicationContext)) {
      lastPackage = pkg
      lastTriggerAt = System.currentTimeMillis()
      return
    }

    val debounceMs = (appliedLevel ?: MonitoringLevel.BALANCED).debounceMs
    val now = System.currentTimeMillis()
    // Same app re-triggering its own window changes (e.g. switching tabs
    // inside Instagram) shouldn't re-show the shield every time.
    if (pkg == lastPackage && now - lastTriggerAt < debounceMs) return
    lastPackage = pkg
    lastTriggerAt = now

    Log.d("ByreAccessibility", "Blocked app opened: $pkg — bringing Byre to front")

    val intent = Intent(
      Intent.ACTION_VIEW,
      Uri.parse("byre://shield?package=$pkg"),
    ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    try {
      startActivity(intent)
    } catch (e: Exception) {
      Log.e("ByreAccessibility", "Failed to launch shield intent", e)
    }
  }

  private fun applyMonitoringLevelIfChanged() {
    val desired = MonitoringConfigStore.get(applicationContext)
    if (desired == appliedLevel) return
    val info = serviceInfo
    if (info != null) {
      info.notificationTimeout = desired.notificationTimeoutMs
      serviceInfo = info
    }
    appliedLevel = desired
    Log.d("ByreAccessibility", "Monitoring level applied: $desired")
  }

  override fun onInterrupt() {}
}
