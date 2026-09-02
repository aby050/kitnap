import ActivityKit
import SwiftUI
import WidgetKit

/**
 * The running session, on the Lock Screen.
 *
 * A Live Activity is the only way a third-party app appears on iOS's
 * always-on display: the system keeps the countdown ticking without the app
 * running, and dims it in AOD by itself. Everything here is declarative and
 * static — the elapsed time comes from `Text(timerInterval:)`, which the OS
 * animates on its own, so nothing needs to wake up once a second.
 *
 * This struct is deliberately duplicated in the app's `live-timer` module:
 * ActivityKit matches activities by attribute type name across targets, and
 * the two definitions must stay identical.
 */
struct ByreTimerAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// When the session ends. The system renders the countdown from this.
    var endsAt: Date
    /// What the session is for, in the user's own words where they gave any.
    var label: String
    /// Apps held back right now — a count, since iOS never gives us names.
    var blockedCount: Int
  }

  /// Fixed for the life of the activity.
  var startedAt: Date
}

private let mint = Color(red: 111 / 255, green: 227 / 255, blue: 169 / 255)

struct ByreLiveTimerView: View {
  let context: ActivityViewContext<ByreTimerAttributes>

  var body: some View {
    HStack(spacing: 14) {
      ZStack {
        Circle().stroke(mint.opacity(0.25), lineWidth: 3).frame(width: 44, height: 44)
        Image(systemName: "shield.fill").font(.system(size: 17)).foregroundColor(mint)
      }

      VStack(alignment: .leading, spacing: 3) {
        Text(context.state.label)
          .font(.system(size: 13, weight: .semibold))
          .foregroundColor(.white.opacity(0.75))
          .lineLimit(1)

        // The OS ticks this down; the activity is never re-rendered for it.
        Text(timerInterval: Date()...context.state.endsAt, countsDown: true)
          .font(.system(size: 30, weight: .semibold, design: .rounded))
          .monospacedDigit()
          .foregroundColor(.white)

        if context.state.blockedCount > 0 {
          Text("^[\(context.state.blockedCount) app](inflect: true) held back")
            .font(.system(size: 11.5))
            .foregroundColor(.white.opacity(0.5))
        }
      }
      Spacer(minLength: 0)
    }
    .padding(16)
    .activityBackgroundTint(Color.black.opacity(0.55))
    .activitySystemActionForegroundColor(mint)
  }
}

struct ByreLiveTimer: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: ByreTimerAttributes.self) { context in
      ByreLiveTimerView(context: context)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Image(systemName: "shield.fill").foregroundColor(mint).padding(.leading, 6)
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(timerInterval: Date()...context.state.endsAt, countsDown: true)
            .font(.system(size: 17, weight: .semibold, design: .rounded))
            .monospacedDigit()
            .foregroundColor(.white)
            .frame(width: 74)
            .padding(.trailing, 6)
        }
        DynamicIslandExpandedRegion(.bottom) {
          Text(context.state.label)
            .font(.system(size: 13))
            .foregroundColor(.white.opacity(0.7))
        }
      } compactLeading: {
        Image(systemName: "shield.fill").foregroundColor(mint)
      } compactTrailing: {
        Text(timerInterval: Date()...context.state.endsAt, countsDown: true)
          .monospacedDigit()
          .frame(width: 44)
          .foregroundColor(mint)
      } minimal: {
        Image(systemName: "shield.fill").foregroundColor(mint)
      }
      .keylineTint(mint)
    }
  }
}

@main
struct ByreWidgetBundle: WidgetBundle {
  var body: some Widget {
    ByreLiveTimer()
  }
}
