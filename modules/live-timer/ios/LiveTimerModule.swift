import ActivityKit
import ExpoModulesCore

/**
 * Starts, updates and ends the Lock Screen countdown.
 *
 * The activity is what survives outside the app: iOS keeps it on the Lock
 * Screen, in the Dynamic Island and on the always-on display, ticking the
 * countdown itself from the end date. The app doesn't need to be running, and
 * nothing here fires on a timer.
 *
 * `ByreTimerAttributes` is duplicated from the widget target on purpose —
 * ActivityKit matches by attribute type name, and the two definitions must
 * stay byte-for-byte compatible.
 */
struct ByreTimerAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var endsAt: Date
    var label: String
    var blockedCount: Int
  }

  var startedAt: Date
}

public class LiveTimerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LiveTimer")

    /// False when the user has switched Live Activities off for Byre, so the
    /// JS side can stay quiet instead of pretending it started one.
    Function("isAvailable") { () -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      return ActivityAuthorizationInfo().areActivitiesEnabled
    }

    Function("start") { (endsAtMs: Double, label: String, blockedCount: Int) -> Bool in
      guard #available(iOS 16.2, *),
        ActivityAuthorizationInfo().areActivitiesEnabled
      else { return false }

      // One session, one activity: starting a second would leave the first
      // counting down on the Lock Screen forever.
      endAll()

      let state = ByreTimerAttributes.ContentState(
        endsAt: Date(timeIntervalSince1970: endsAtMs / 1000),
        label: label,
        blockedCount: blockedCount
      )
      do {
        _ = try Activity.request(
          attributes: ByreTimerAttributes(startedAt: Date()),
          content: .init(state: state, staleDate: state.endsAt),
          pushType: nil
        )
        return true
      } catch {
        return false
      }
    }

    Function("update") { (endsAtMs: Double, label: String, blockedCount: Int) -> Void in
      guard #available(iOS 16.2, *) else { return }
      let state = ByreTimerAttributes.ContentState(
        endsAt: Date(timeIntervalSince1970: endsAtMs / 1000),
        label: label,
        blockedCount: blockedCount
      )
      Task {
        for activity in Activity<ByreTimerAttributes>.activities {
          await activity.update(.init(state: state, staleDate: state.endsAt))
        }
      }
    }

    Function("end") { () -> Void in
      endAll()
    }
  }
}

private func endAll() {
  guard #available(iOS 16.2, *) else { return }
  Task {
    for activity in Activity<ByreTimerAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
  }
}
