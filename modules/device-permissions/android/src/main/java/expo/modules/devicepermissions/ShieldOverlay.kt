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
import android.graphics.Typeface
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.text.style.StyleSpan
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.app.usage.UsageStatsManager
import android.os.Handler
import android.os.Looper
import java.util.Calendar

/**
 * The shield, drawn *over* the blocked app rather than replacing it.
 *
 * ## Why an overlay and not an activity
 *
 * The service used to answer a blocked app by firing a `phonewise://shield` deep
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
 * This is not the Gate. It is a cover, drawn in plain Android views so it can
 * appear instantly without waiting for React Native to start; the real
 * challenge lives in the Gate, which the secondary action opens. It is
 * composed to match that Gate — same ground, same mark, same voice — so the
 * two read as one surface rather than a system dialog handing off to an app.
 * Keeping the heavy UI in RN and the instant cover in Kotlin is the whole
 * point: the cover must never be the thing we are waiting on.
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
  fun show(
    context: Context,
    packageName: String,
    title: String,
    emphasis: String,
    body: String,
    cta: String,
  ) {
    if (!canDraw(context)) {
      // No permission: fall back to the old behaviour rather than silently
      // doing nothing. A weaker block beats no block.
      openByre(context, packageName)
      return
    }
    if (view != null && shownFor == packageName) return
    hide(context)

    val wm = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager ?: return
    val root = buildView(context, packageName, title, emphasis, body, cta)

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
      //
      // LAYOUT_IN_SCREEN + LAYOUT_NO_LIMITS make the cover fill the whole
      // panel instead of the area between the system bars. Without them the
      // blocked app's own status and navigation bars stayed lit around the
      // edges — a strip of the thing being blocked framing the screen that
      // says it is blocked. The bars' icons still draw on top, which no app
      // can prevent, but the app's colour behind them does not.
      WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
      android.graphics.PixelFormat.TRANSLUCENT,
    )
    params.gravity = Gravity.CENTER
    // Edge to edge, including the cutout, so no sliver of the app shows in the
    // notch area on a device that has one.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      params.layoutInDisplayCutoutMode =
        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
    }

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
    emphasis: String,
    body: String,
    cta: String,
  ): View {
    /*
     * Composed to match the Gate the user lands on after tapping through, not
     * as a generic system dialog.
     *
     * The previous version was a title, a line of body and a button floating
     * over a near-transparent wash, with the blocked app's icons still legible
     * behind it — which read as a notification the app had thrown up rather
     * than a door that was shut. The whole grid of apps showing through also
     * undercut the message: it was still visibly the home screen, offering
     * everything, with a note on top.
     *
     * So: an opaque ground with the same green cast the Gate uses, the mark,
     * the sentence, and two actions with a clear hierarchy — the calm one
     * first and full width, the way out underneath as plain text. Still plain
     * Android views, still no layout inflation, so it appears in the same
     * frame as before.
     */
    val root = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      // Opaque, and not flat black: the Gate's ground is a very dark green,
      // and the cover arriving in the same colour makes the two read as one
      // surface rather than two different apps interrupting.
      background = GradientDrawable(
        GradientDrawable.Orientation.TOP_BOTTOM,
        intArrayOf(
          Color.parseColor("#FF0D1A14"),
          Color.parseColor("#FF060907"),
        ),
      )
      setPadding(dp(context, 32f), dp(context, 72f), dp(context, 32f), dp(context, 40f))
      isClickable = true
      isFocusable = true
    }

    // Pushes the message to the optical centre without measuring anything.
    root.addView(View(context), LinearLayout.LayoutParams(0, 0, 1f))

    // The mark, as the vector the Gate also uses. A font glyph was standing in
    // here and rendered as a dotted ring, which is not the app's mark at all.
    root.addView(ImageView(context).apply {
      setImageResource(R.drawable.byre_shield_leaf)
    }, LinearLayout.LayoutParams(dp(context, 72f), dp(context, 72f)))

    /*
     * One sentence, two voices — the app's editorial pair, in the serif it is
     * set in everywhere else. The lead is dim and italic, the emphasis picks up
     * the accent and the weight, and they run together as a single flowing
     * line rather than a heading with a subtitle under it. When a line has no
     * emphasis half (SHIELD_MESSAGES leaves it off where the sentence works
     * unbroken) the lead simply carries the whole thing.
     */
    root.addView(TextView(context).apply {
      val line = SpannableStringBuilder()
      line.append(title)
      if (emphasis.isNotBlank()) {
        val at = line.length + 1
        line.append(" ").append(emphasis)
        line.setSpan(
          ForegroundColorSpan(Color.parseColor("#6FE3A9")),
          at, line.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
        )
        line.setSpan(
          StyleSpan(Typeface.BOLD_ITALIC),
          at, line.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
        )
      }
      text = line
      setTypeface(Typeface.SERIF, Typeface.ITALIC)
      setTextColor(Color.parseColor("#B5FFFFFF"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 27f)
      gravity = Gravity.CENTER
      setLineSpacing(dp(context, 6f).toFloat(), 1f)
      setPadding(0, dp(context, 28f), 0, 0)
    })

    root.addView(TextView(context).apply {
      text = body
      setTextColor(Color.parseColor("#8AFFFFFF"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
      gravity = Gravity.CENTER
      setLineSpacing(dp(context, 3f).toFloat(), 1f)
      setPadding(dp(context, 8f), dp(context, 18f), dp(context, 8f), 0)
    })

    /*
     * Today's time in this app, so the cover says something true about this
     * particular reach rather than only something general. Filled in off the
     * main thread: the cover must appear in the frame the app does, and a
     * usage query is tens of milliseconds it has no business waiting on. If
     * Usage Access is off, or the number is zero, the line simply stays empty.
     */
    val usageLine = TextView(context).apply {
      setTextColor(Color.parseColor("#6FE3A9"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
      gravity = Gravity.CENTER
      setPadding(dp(context, 8f), dp(context, 14f), dp(context, 8f), 0)
      visibility = View.GONE
    }
    root.addView(usageLine)
    Thread {
      val minutes = minutesToday(context, packageName)
      if (minutes <= 0) return@Thread
      val label = try {
        val pm = context.packageManager
        pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString()
      } catch (e: Exception) { "this app" }
      Handler(Looper.getMainLooper()).post {
        usageLine.text = "You’ve already spent ${formatMinutes(minutes)} in $label today."
        usageLine.visibility = View.VISIBLE
      }
    }.start()

    root.addView(View(context), LinearLayout.LayoutParams(0, 0, 1f))

    /*
     * Two actions, and the order is the argument.
     *
     * "Not now" is the whole-width primary because it is the outcome the user
     * asked for when they set the block; the way in sits under it as plain
     * text. A single bright "Let me in" button — the only thing on the old
     * cover — made the exit the one obvious move on the screen, which is a
     * strange thing for a block to do.
     */
    root.addView(TextView(context).apply {
      text = "Not now"
      setTextColor(Color.parseColor("#07301F"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
      gravity = Gravity.CENTER
      background = GradientDrawable().apply {
        cornerRadius = dp(context, 30f).toFloat()
        setColor(Color.parseColor("#F2FFFFFF"))
      }
      setPadding(dp(context, 28f), dp(context, 17f), dp(context, 28f), dp(context, 17f))
      isClickable = true
      setOnClickListener {
        // "Not now" has to actually take the user somewhere, or it is a
        // dismiss button on a block: simply hiding the cover would leave the
        // blocked app on screen and usable, and nothing fires another window
        // change while they sit in it.
        //
        // During a session the answer is the timer, which is the screen they
        // are meant to be on. Otherwise it is the home screen — away from the
        // app they were reaching for, without opening anything.
        hide(context)
        if (LockdownStore.isOn(context)) {
          openByre(context, packageName)
        } else {
          try {
            context.startActivity(
              Intent(Intent.ACTION_MAIN)
                .addCategory(Intent.CATEGORY_HOME)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
          } catch (e: Exception) {
            Log.e("ByreShieldOverlay", "Could not reach home", e)
          }
        }
      }
    }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))

    // The better place to put the reach, if the user named one. Sits between
    // "Not now" and the way in: a real alternative, but never louder than the
    // choice the block was set up to make.
    val alt = AlternativeAppStore.get(context)
    val altLaunch = alt?.let { context.packageManager.getLaunchIntentForPackage(it) }
    if (alt != null && altLaunch != null && alt != packageName) {
      val altLabel = try {
        val pm = context.packageManager
        pm.getApplicationLabel(pm.getApplicationInfo(alt, 0)).toString()
      } catch (e: Exception) { null }
      if (altLabel != null) {
        root.addView(TextView(context).apply {
          text = "Open $altLabel instead"
          setTextColor(Color.parseColor("#6FE3A9"))
          setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
          gravity = Gravity.CENTER
          background = GradientDrawable().apply {
            cornerRadius = dp(context, 30f).toFloat()
            setColor(Color.TRANSPARENT)
            setStroke(dp(context, 1f), Color.parseColor("#556FE3A9"))
          }
          setPadding(dp(context, 28f), dp(context, 15f), dp(context, 28f), dp(context, 15f))
          isClickable = true
          setOnClickListener {
            hide(context)
            try {
              context.startActivity(altLaunch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            } catch (e: Exception) {
              Log.e("ByreShieldOverlay", "Could not open alternative", e)
            }
          }
        }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
          topMargin = dp(context, 12f)
        })
      }
    }

    root.addView(TextView(context).apply {
      text = cta
      setTextColor(Color.parseColor("#B8FFFFFF"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      gravity = Gravity.CENTER
      setPadding(0, dp(context, 22f), 0, dp(context, 6f))
      isClickable = true
      setOnClickListener {
        hide(context)
        openByre(context, packageName)
      }
    }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))

    return root
  }

  private fun minutesToday(context: Context, pkg: String): Long {
    if (!UsageAccess.isGranted(context)) return 0
    return try {
      val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val start = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
      }.timeInMillis
      val ms = usm.queryAndAggregateUsageStats(start, System.currentTimeMillis())[pkg]
        ?.totalTimeInForeground ?: 0L
      ms / 60000
    } catch (e: Exception) {
      0
    }
  }

  private fun formatMinutes(m: Long): String =
    if (m < 60) "$m min" else if (m % 60 == 0L) "${m / 60}h" else "${m / 60}h ${m % 60}m"

  private fun openByre(context: Context, packageName: String) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("phonewise://shield?package=$packageName"))
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    try {
      context.startActivity(intent)
    } catch (e: Exception) {
      Log.e("PhonewiseShieldOverlay", "Failed to open Phonewise", e)
    }
  }
}
