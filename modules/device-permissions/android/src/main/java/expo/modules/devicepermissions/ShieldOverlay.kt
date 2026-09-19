package expo.modules.devicepermissions

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * The shield, drawn *over* the blocked app rather than replacing it.
 *
 * ## Why an overlay and not an activity
 *
 * The service used to answer a blocked app by firing a `byre://shield` deep
 * link, which launches Byre as a task. Three things are wrong with that:
 *
 *   1. **It is slow.** A cold-ish RN activity start is hundreds of
 *      milliseconds of the blocked app being visible and usable — which is
 *      exactly the moment the block is supposed to own.
 *   2. **Swipe-back escapes it.** The blocked app is still the task
 *      underneath; recents or a back gesture returns straight to it.
 *   3. **We asked for a permission we never used.** Onboarding requests
 *      "Display over other apps" and then nothing in the app ever drew
 *      anything over anything. Asking for a sensitive permission and not
 *      using it is its own kind of dishonesty, and Play notices.
 *
 * An overlay appears in the same frame the app does, sits above it, and
 * consumes touches — so the app is behind glass rather than briefly open.
 *
 * ## What this deliberately is not
 *
 * This is not the Gate. It is a cover with one button on it, drawn in plain
 * Android views so it can appear instantly without waiting for React Native
 * to start. Tapping through opens Byre for the real challenge. Keeping the
 * heavy UI in RN and the instant cover in Kotlin is the whole point: the
 * cover must never be the thing we are waiting on.
 *
 * Nothing here can force-close another app — no third-party Android app can
 * without Device Owner enrolment. What it can do is make the blocked app
 * unusable until the user deals with Byre, which is the honest version of a
 * block on this platform.
 */
object ShieldOverlay {
  private var view: View? = null
  private var shownFor: String? = null

  fun canDraw(context: Context): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)

  @SuppressLint("InflateParams")
  fun show(context: Context, packageName: String, title: String, body: String, cta: String) {
    if (!canDraw(context)) {
      // No permission: fall back to the old behaviour rather than silently
      // doing nothing. A weaker block beats no block.
      openByre(context, packageName)
      return
    }
    if (view != null && shownFor == packageName) return
    hide(context)

    val wm = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager ?: return
    val root = buildView(context, packageName, title, body, cta)

    val type =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
      else
        @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      type,
      // FLAG_NOT_TOUCH_MODAL is deliberately absent: the whole point is that
      // touches do NOT reach the app underneath.
      WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
      android.graphics.PixelFormat.TRANSLUCENT,
    )
    params.gravity = Gravity.CENTER

    try {
      wm.addView(root, params)
      view = root
      shownFor = packageName
      Log.d("ByreShieldOverlay", "Cover up over $packageName")
    } catch (e: Exception) {
      Log.e("ByreShieldOverlay", "Could not add overlay", e)
      openByre(context, packageName)
    }
  }

  fun hide(context: Context) {
    val current = view ?: return
    // Logged because the last bug here was the cover being taken down by
    // something that had no business doing it — a removal with no visible
    // cause is very hard to tell apart from one that never happened.
    Log.d("ByreShieldOverlay", "Cover down (was over $shownFor)")
    val wm = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
    try {
      wm?.removeView(current)
    } catch (e: Exception) {
      Log.w("ByreShieldOverlay", "Overlay already gone", e)
    }
    view = null
    shownFor = null
  }

  fun isShowing(): Boolean = view != null

  private fun dp(context: Context, value: Float): Int =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, context.resources.displayMetrics)
      .toInt()

  private fun buildView(
    context: Context,
    packageName: String,
    title: String,
    body: String,
    cta: String,
  ): View {
    val root = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      // Near-opaque rather than fully: a sliver of the app behind is what
      // tells the user *which* app they were reaching for, without leaving
      // any of it readable or usable.
      setBackgroundColor(Color.parseColor("#F2070709"))
      setPadding(dp(context, 32f), 0, dp(context, 32f), 0)
      isClickable = true
      isFocusable = true
    }

    root.addView(TextView(context).apply {
      text = title
      setTextColor(Color.WHITE)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 26f)
      gravity = Gravity.CENTER
    })

    root.addView(TextView(context).apply {
      text = body
      setTextColor(Color.parseColor("#A3FFFFFF"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      gravity = Gravity.CENTER
      setPadding(0, dp(context, 12f), 0, dp(context, 28f))
    })

    root.addView(Button(context).apply {
      text = cta
      setTextColor(Color.parseColor("#07301F"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      isAllCaps = false
      background = GradientDrawable().apply {
        cornerRadius = dp(context, 28f).toFloat()
        setColor(Color.parseColor("#6FE3A9"))
      }
      setPadding(dp(context, 28f), dp(context, 14f), dp(context, 28f), dp(context, 14f))
      setOnClickListener {
        hide(context)
        openByre(context, packageName)
      }
    })

    // No dismiss control, by design. The way past this is the Gate, and the
    // home button — which we cannot and should not intercept.
    return root
  }

  private fun openByre(context: Context, packageName: String) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("byre://shield?package=$packageName"))
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    try {
      context.startActivity(intent)
    } catch (e: Exception) {
      Log.e("ByreShieldOverlay", "Failed to open Byre", e)
    }
  }
}
