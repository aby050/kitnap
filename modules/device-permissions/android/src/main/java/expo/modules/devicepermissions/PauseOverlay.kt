package expo.modules.devicepermissions

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.CountDownTimer
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * The few seconds between reaching for an app and getting it.
 *
 * ## Why this exists separately from the shield
 *
 * The shield answers "you decided not to open this". The pause answers the
 * far more common case: you did not decide anything, your thumb did. A
 * challenge there is too much — people turn the whole feature off rather
 * than do push-ups to check a message — and no friction at all is too
 * little, because the reach never reaches consciousness.
 *
 * So: the app opens, but not yet. A number counts down over a nearly black
 * screen, and the only control on offer during it is the one that takes you
 * back. When it reaches zero the app is yours, no challenge, no cost. The
 * intervention is not the waiting; it is being asked, once, while nothing
 * else is happening.
 *
 * ## Two details that decide whether it works
 *
 *  - **"Not now" is available immediately; "Go ahead" is not.** If both were
 *    live from the first frame the pause would be a dialog, and a dialog is
 *    dismissed reflexively by the same habit that opened the app.
 *  - **It counts down, it does not spin.** A number going down is a promise
 *    with an end. A spinner reads as the phone being broken, and people
 *    respond to that by pressing harder, not by reconsidering.
 */
object PauseOverlay {
  private var view: View? = null
  private var shownFor: String? = null
  private var timer: CountDownTimer? = null

  /** Packages already paused this session, so passing through does not
   *  re-pause on every window change inside the app you were let into. */
  private val passed = mutableMapOf<String, Long>()

  /** How long a pass lasts. Re-pausing someone who was let in ninety seconds
   *  ago teaches them the feature is noise, not a moment. */
  private const val PASS_MS = 5 * 60 * 1000L

  fun isPassed(pkg: String): Boolean {
    val at = passed[pkg] ?: return false
    if (System.currentTimeMillis() - at > PASS_MS) {
      passed.remove(pkg)
      return false
    }
    return true
  }

  fun show(context: Context, packageName: String, seconds: Int, line: String) {
    if (!ShieldOverlay.canDraw(context)) return // Nothing honest to fall back to here.
    if (view != null && shownFor == packageName) return
    hide(context)

    val wm = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager ?: return

    val count = TextView(context).apply {
      text = seconds.toString()
      setTextColor(Color.WHITE)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 72f)
      gravity = Gravity.CENTER
    }

    val goAhead = Button(context).apply {
      text = "Go ahead"
      isEnabled = false
      alpha = 0.35f
      isAllCaps = false
      setTextColor(Color.parseColor("#07301F"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      background = GradientDrawable().apply {
        cornerRadius = dp(context, 28f).toFloat()
        setColor(Color.parseColor("#6FE3A9"))
      }
      setPadding(dp(context, 30f), dp(context, 14f), dp(context, 30f), dp(context, 14f))
      setOnClickListener {
        passed[packageName] = System.currentTimeMillis()
        hide(context)
      }
    }

    val root = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setBackgroundColor(Color.parseColor("#F7070709"))
      setPadding(dp(context, 32f), 0, dp(context, 32f), 0)
      isClickable = true
      isFocusable = true

      addView(count)
      addView(TextView(context).apply {
        text = line
        setTextColor(Color.parseColor("#A3FFFFFF"))
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
        gravity = Gravity.CENTER
        setPadding(0, dp(context, 14f), 0, dp(context, 30f))
      })
      addView(goAhead)
      // Offered from the first frame, unlike "Go ahead". Leaving is never the
      // thing anyone should have to wait for.
      addView(TextView(context).apply {
        text = "Not now"
        setTextColor(Color.parseColor("#8CFFFFFF"))
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
        gravity = Gravity.CENTER
        setPadding(0, dp(context, 22f), 0, 0)
        setOnClickListener {
          hide(context)
          goHome(context)
        }
      })
    }

    val type =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
      else
        @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      type,
      WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
      android.graphics.PixelFormat.TRANSLUCENT,
    )
    params.gravity = Gravity.CENTER

    try {
      wm.addView(root, params)
      view = root
      shownFor = packageName
    } catch (e: Exception) {
      Log.e("KitnapPauseOverlay", "Could not add overlay", e)
      return
    }

    timer = object : CountDownTimer(seconds * 1000L, 1000L) {
      override fun onTick(remaining: Long) {
        count.text = ((remaining / 1000) + 1).toString()
      }

      override fun onFinish() {
        count.text = "0"
        goAhead.isEnabled = true
        goAhead.alpha = 1f
      }
    }.also { it.start() }
  }

  fun hide(context: Context) {
    timer?.cancel()
    timer = null
    val current = view ?: return
    val wm = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
    try {
      wm?.removeView(current)
    } catch (e: Exception) {
      Log.w("KitnapPauseOverlay", "Overlay already gone", e)
    }
    view = null
    shownFor = null
  }

  /** Home, not back: back often returns into the same app's previous screen,
   *  which is the opposite of what "Not now" just promised. */
  private fun goHome(context: Context) {
    Handler(Looper.getMainLooper()).post {
      try {
        val intent = android.content.Intent(android.content.Intent.ACTION_MAIN)
          .addCategory(android.content.Intent.CATEGORY_HOME)
          .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      } catch (e: Exception) {
        Log.e("KitnapPauseOverlay", "Could not go home", e)
      }
    }
  }

  private fun dp(context: Context, value: Float): Int =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, context.resources.displayMetrics)
      .toInt()
}
