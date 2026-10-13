package expo.modules.devicepermissions

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import java.io.ByteArrayOutputStream
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Real device permission checks — no npm package existed that safely wrapped
 * all three of these (overlay draw, accessibility service, notification
 * listener) together, so this is a small hand-written native module rather
 * than a mocked JS layer. Each "is enabled" check reads real Android system
 * state; each "open settings" call launches the real system settings screen
 * — nothing here is simulated.
 */
class DevicePermissionsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DevicePermissions")

    // The running session, as an ongoing notification the system counts down
    // itself. Also keeps the process alive so a block survives the user
    // switching away, which is exactly when a block matters.
    Function("startSessionNotification") { endsAt: Double, label: String, blockedCount: Int ->
      val context = appContext.reactContext ?: return@Function false
      SessionNotification.show(context, endsAt.toLong(), label, blockedCount)
      true
    }

    Function("stopSessionNotification") {
      val context = appContext.reactContext ?: return@Function false
      SessionNotification.hide(context)
      true
    }

    /** True when the OS is in battery saver, so the UI can go quiet. */
    Function("isPowerSaveMode") {
      val context = appContext.reactContext ?: return@Function false
      isPowerSaveMode(context)
    }

    /**
     * Total lockdown for the duration of a session: everything shielded
     * except calls, the launcher, System UI, Settings, SMS and alarms.
     * Settings deliberately stays reachable — see LockdownStore.
     */
    Function("setLockdown") { on: Boolean ->
      val ctx = appContext.reactContext ?: return@Function false
      LockdownStore.set(ctx, on)
      // A lockdown that just ended must not leave a shield hanging over an app
      // the user is allowed back into.
      if (!on) ShieldOverlay.hide(ctx)
      true
    }

    Function("isLockdownOn") {
      val ctx = appContext.reactContext ?: return@Function false
      LockdownStore.isOn(ctx)
    }

    /** Usage access, read from the appop rather than a third-party bridge. */
    Function("hasUsageAccess") {
      val ctx = appContext.reactContext ?: return@Function false
      UsageAccess.isGranted(ctx)
    }

    Function("openUsageAccessSettings") {
      val ctx = appContext.reactContext ?: return@Function false
      UsageAccess.openSettings(ctx)
      true
    }

    /** Per-app foreground time over a window, newest-heaviest first. */
    Function("queryUsageStats") { startMs: Double, endMs: Double ->
      val ctx = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
      UsageAccess.query(ctx, startMs.toLong(), endMs.toLong())
    }

    Function("canDrawOverlays") {
      val ctx = appContext.reactContext ?: return@Function false
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Settings.canDrawOverlays(ctx)
      } else {
        true
      }
    }

    Function("openOverlaySettings") {
      val ctx = appContext.reactContext ?: return@Function null
      val intent = Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:${ctx.packageName}"),
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
    }

    Function("isAccessibilityServiceEnabled") {
      val ctx = appContext.reactContext ?: return@Function false
      val expectedComponent = "${ctx.packageName}/${ByreAccessibilityService::class.java.canonicalName}"
      val enabled = Settings.Secure.getString(
        ctx.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
      ) ?: ""
      enabled.split(':').any { it.equals(expectedComponent, ignoreCase = true) }
    }

    Function("openAccessibilitySettings") {
      val ctx = appContext.reactContext ?: return@Function null
      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
    }

    /** The lines the overlay shows. Written whenever the shield is configured
     *  in JS, read by the accessibility service in the moment a block fires —
     *  see ShieldCopyStore for why the cover cannot simply ask. */
    Function("setShieldCopy") { title: String, emphasis: String, body: String, cta: String ->
      val ctx = appContext.reactContext ?: return@Function null
      ShieldCopyStore.set(ctx, title, emphasis, body, cta)
      null
    }

    /** Takes the cover down from JS — after a passed challenge, or when the
     *  user unblocks the app they are standing in front of. */
    Function("hideShieldOverlay") {
      val ctx = appContext.reactContext ?: return@Function null
      ShieldOverlay.hide(ctx)
      null
    }

    /** Apps that get a pause instead of a block — see PausedPackagesStore for
     *  why this is a separate list rather than a flag on the blocked one. */
    Function("setPausedPackages") { packages: List<String> ->
      val ctx = appContext.reactContext ?: return@Function null
      PausedPackagesStore.set(ctx, packages)
      null
    }

    /** How long the pause lasts, in seconds. Clamped to 3-30 by the store. */
    Function("setPauseSeconds") { seconds: Int ->
      val ctx = appContext.reactContext ?: return@Function null
      PausedPackagesStore.setSeconds(ctx, seconds)
      null
    }

    /** The line under the countdown. Written from JS so the pause can speak in
     *  the same voice as everything else, despite drawing before RN exists. */
    Function("setPauseCopy") { line: String ->
      val ctx = appContext.reactContext ?: return@Function null
      PauseCopyStore.set(ctx, line)
      null
    }

    // Called from JS whenever the blocked-apps list changes (and once on
    // every app start) so ByreAccessibilityService always checks against
    // the current list, not whatever was blocked at install time.
    Function("setBlockedPackages") { packages: List<String> ->
      val ctx = appContext.reactContext ?: return@Function null
      BlockedPackagesStore.set(ctx, packages)
    }

    // Streak, goal and the week's reclaimed minutes for the home-screen widget,
    // which re-renders straight away. Screen time it reads for itself.
    Function("updateWidget") { streak: Int, goalMinutes: Int, reclaimedWeekMinutes: Int ->
      val ctx = appContext.reactContext ?: return@Function null
      WidgetStatsStore.set(ctx, streak, goalMinutes, reclaimedWeekMinutes)
      PhonewiseWidget.refreshAll(ctx)
    }

    // The app the shield offers instead ("Open Kindle instead"). Empty clears it.
    Function("setAlternativeApp") { pkg: String ->
      val ctx = appContext.reactContext ?: return@Function null
      AlternativeAppStore.set(ctx, pkg)
    }

    // The counterpart to setBlockedPackages: how the Accessibility Service
    // learns that a challenge was passed. Without it the service re-shields
    // the moment the user returns to the app they just unlocked.
    Function("grantTemporaryAccess") { grantMinutes: Double ->
      val ctx = appContext.reactContext ?: return@Function null
      GrantStore.set(ctx, System.currentTimeMillis() + (grantMinutes * 60_000).toLong())
    }

    // "Done early" — shut the door now rather than when the countdown says so.
    Function("endGrantNow") {
      val ctx = appContext.reactContext ?: return@Function null
      GrantStore.clear(ctx)
    }

    // Epoch millis, or 0 when no grant is running. Lets JS re-adopt a grant
    // that outlived the JS process (cold start, or Android reclaiming it).
    Function("getGrantedUntil") {
      val ctx = appContext.reactContext ?: return@Function 0.0
      GrantStore.grantedUntil(ctx).toDouble()
    }

    // Battery/responsiveness tradeoff — "gentle" | "balanced" | "strict".
    // See MonitoringConfigStore's doc comment for what each actually changes.
    Function("setMonitoringLevel") { level: String ->
      val ctx = appContext.reactContext ?: return@Function null
      val parsed = runCatching { MonitoringLevel.valueOf(level.uppercase()) }.getOrDefault(MonitoringLevel.BALANCED)
      MonitoringConfigStore.set(ctx, parsed)
    }

    // "Battery optimization" is Android's own system that can pause a
    // background app's work to save power — including our Accessibility
    // Service, which would silently stop enforcing an active session.
    // Exempting the app is what "Uninterrupted sessions" actually grants.
    Function("isIgnoringBatteryOptimizations") {
      val ctx = appContext.reactContext ?: return@Function false
      val pm = ctx.getSystemService(Context.POWER_SERVICE) as? PowerManager
      pm?.isIgnoringBatteryOptimizations(ctx.packageName) ?: false
    }

    Function("openBatteryOptimizationSettings") {
      val ctx = appContext.reactContext ?: return@Function null
      val intent = Intent(
        Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
        Uri.parse("package:${ctx.packageName}"),
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
    }

    Function("getInstalledApps") {
      val ctx = appContext.reactContext ?: return@Function listOf<Map<String, Any>>()
      val pm = ctx.packageManager
      val mainIntent = Intent(Intent.ACTION_MAIN, null).apply {
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
      
      val list = mutableListOf<Map<String, Any>>()
      val resolveInfos = pm.queryIntentActivities(mainIntent, 0)
      for (resolveInfo in resolveInfos) {
        val packageName = resolveInfo.activityInfo.packageName
        if (packageName == ctx.packageName) continue // skip our own app
        val label = resolveInfo.loadLabel(pm).toString()
        
        var category = "other"
        try {
          val appInfo = pm.getApplicationInfo(packageName, 0)
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            category = when (appInfo.category) {
              android.content.pm.ApplicationInfo.CATEGORY_SOCIAL -> "social"
              android.content.pm.ApplicationInfo.CATEGORY_GAME -> "games"
              android.content.pm.ApplicationInfo.CATEGORY_AUDIO,
              android.content.pm.ApplicationInfo.CATEGORY_VIDEO,
              android.content.pm.ApplicationInfo.CATEGORY_IMAGE -> "entertainment"
              android.content.pm.ApplicationInfo.CATEGORY_MAPS,
              android.content.pm.ApplicationInfo.CATEGORY_NEWS -> "productivity"
              android.content.pm.ApplicationInfo.CATEGORY_PRODUCTIVITY -> "productivity"
              else -> "other"
            }
          }
        } catch (e: Exception) {
          // ignore
        }
        
        if (category == "other") {
          val lowerPkg = packageName.lowercase()
          if (lowerPkg.contains("facebook") || lowerPkg.contains("instagram") || lowerPkg.contains("twitter") || 
              lowerPkg.contains("reddit") || lowerPkg.contains("tiktok") || lowerPkg.contains("snapchat") ||
              lowerPkg.contains("whatsapp") || lowerPkg.contains("telegram") || lowerPkg.contains("messenger")) {
            category = "social"
          } else if (lowerPkg.contains("youtube") || lowerPkg.contains("netflix") || lowerPkg.contains("spotify") || 
                     lowerPkg.contains("twitch") || lowerPkg.contains("disney") || lowerPkg.contains("primevideo")) {
            category = "entertainment"
          } else if (lowerPkg.contains("slack") || lowerPkg.contains("zoom") || lowerPkg.contains("teams") || 
                     lowerPkg.contains("gmail") || lowerPkg.contains("outlook") || lowerPkg.contains("drive") || 
                     lowerPkg.contains("trello") || lowerPkg.contains("notion")) {
            category = "productivity"
          }
        }

        // The real launcher icon, as a data URI. Android is the only platform
        // that will hand these over — iOS never exposes installed-app icons to
        // third-party apps, so JS falls back to a monogram tile there.
        val icon = try {
          drawableToDataUri(resolveInfo.loadIcon(pm))
        } catch (e: Exception) {
          null
        }

        list.add(mapOf(
          "packageName" to packageName,
          "label" to label,
          "category" to category,
          "icon" to (icon ?: "")
        ))
      }
      list.sortedBy { (it["label"] as String).lowercase() }
    }
  }

  /** Rasterises a launcher drawable to a small PNG data URI. Capped at 96px:
   *  adaptive icons can be large, and a few hundred of them crossing the
   *  bridge at full size is what makes an app-list screen janky. */
  private fun drawableToDataUri(drawable: Drawable, sizePx: Int = 96): String? {
    val bitmap = if (drawable is BitmapDrawable && drawable.bitmap != null) {
      Bitmap.createScaledBitmap(drawable.bitmap, sizePx, sizePx, true)
    } else {
      val bmp = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bmp)
      drawable.setBounds(0, 0, canvas.width, canvas.height)
      drawable.draw(canvas)
      bmp
    }
    val out = ByteArrayOutputStream()
    if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)) return null
    return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
  }
}
