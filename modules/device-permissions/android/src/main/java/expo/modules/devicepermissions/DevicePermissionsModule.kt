package expo.modules.devicepermissions

import android.content.Context
import android.content.Intent
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
      val expectedComponent = "${ctx.packageName}/${WendAccessibilityService::class.java.canonicalName}"
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

    Function("isNotificationListenerEnabled") {
      val ctx = appContext.reactContext ?: return@Function false
      val enabled = Settings.Secure.getString(
        ctx.contentResolver,
        "enabled_notification_listeners",
      ) ?: ""
      enabled.contains(ctx.packageName)
    }

    Function("openNotificationListenerSettings") {
      val ctx = appContext.reactContext ?: return@Function null
      val intent = Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
    }

    // Called from JS whenever the blocked-apps list changes (and once on
    // every app start) so WendAccessibilityService always checks against
    // the current list, not whatever was blocked at install time.
    Function("setBlockedPackages") { packages: List<String> ->
      val ctx = appContext.reactContext ?: return@Function null
      BlockedPackagesStore.set(ctx, packages)
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

        list.add(mapOf(
          "packageName" to packageName,
          "label" to label,
          "category" to category
        ))
      }
      list.sortedBy { (it["label"] as String).lowercase() }
    }
  }
}
