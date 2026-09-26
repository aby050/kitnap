package expo.modules.devicepermissions

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.net.Uri
import android.util.Log
import android.view.accessibility.AccessibilityEvent

/**
 * Watches for foreground-app changes and, when the app that just came to
 * the foreground is on the blocked list, brings Byre to the front via a
 * `phonewise://shield?package=<pkg>` deep link — the RN side (App.tsx) listens
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
    if (pkg == packageName) {
      // Byre's own window. This includes the overlay we just added — adding a
      // window fires TYPE_WINDOW_STATE_CHANGED attributed to *us*, so hiding
      // here tore the cover down a few milliseconds after drawing it. The
      // shield fired correctly and then deleted itself, which looked exactly
      // like the block never happening.
      //
      // Nothing needs hiding on this path anyway: the cover comes down when a
      // different, unblocked app comes forward (below), when a grant is
      // earned (JS calls hideShieldOverlay), or when its own button is
      // pressed. Byre's UI coming to the front is not a reason to unblock
      // anything.
      return
    }

    // Lockdown inverts the rule: everything is blocked unless it is on the
    // short allowlist. Evaluated before the blocklist because during a
    // lockdown the user's own app selection is beside the point.
    val lockdown = LockdownStore.isOn(applicationContext)
    val blocked = if (lockdown) {
      !LockdownStore.allowed(applicationContext).contains(pkg)
    } else {
      BlockedPackagesStore.get(applicationContext).contains(pkg)
    }

    if (!blocked) {
      // Moved to something unblocked: take the cover down so it can never be
      // left hanging over an app the user is allowed to use.
      ShieldOverlay.hide(applicationContext)

      // Not blocked, but possibly watched. The pause is the lighter answer
      // for apps nobody decided to open — see PauseOverlay. Checked after
      // blocked, never both: an app is one or the other.
      val paused = PausedPackagesStore.get(applicationContext)
      if (paused.contains(pkg) && !PauseOverlay.isPassed(pkg)) {
        PauseOverlay.show(
          applicationContext,
          pkg,
          PausedPackagesStore.seconds(applicationContext),
          PauseCopyStore.line(applicationContext),
        )
      } else {
        PauseOverlay.hide(applicationContext)
      }
      return
    }

    // Blocked outranks paused: if a pause was up when the user crossed into a
    // blocked app, it has no business staying on top of the shield.
    PauseOverlay.hide(applicationContext)

    // A grant the user has already earned. Re-showing the shield here is what
    // made a passed challenge feel like it never took: the user finished the
    // reps, tapped Continue, went back to the app, and was handed the camera
    // again. The window is checked, not trusted forever — once it lapses the
    // next foreground event shields as usual.
    if (GrantStore.isGranted(applicationContext)) {
      // A grant that started while the cover was up has to take it down, or
      // the user earns their way in and lands back on the shield.
      ShieldOverlay.hide(applicationContext)
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

    Log.d("ByreAccessibility", "Blocked app opened: $pkg — covering it")

    // Cover it in this frame rather than launching a task. ShieldOverlay falls
    // back to the deep link by itself when the overlay permission is missing,
    // so this path is the same strength as before at worst and instant at
    // best — see its doc comment for why the activity launch was the weaker
    // of the two.
    ShieldOverlay.show(
      applicationContext,
      pkg,
      ShieldCopyStore.title(applicationContext),
      ShieldCopyStore.emphasis(applicationContext),
      ShieldCopyStore.body(applicationContext),
      ShieldCopyStore.cta(applicationContext),
    )
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
