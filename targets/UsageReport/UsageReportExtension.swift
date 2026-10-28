import DeviceActivity
import FamilyControls
import ManagedSettings
import SwiftUI

/**
 * Renders Kitnap's in-app "Screen Time today" view.
 *
 * This is the one place Apple allows real per-app usage numbers to be drawn
 * at all — DeviceActivityResults never crosses back into the host app as
 * data, only as a rendered SwiftUI view the OS composites in from this
 * extension process. `UsageReportModule` (in the main app target) hosts a
 * `DeviceActivityReport` view asking for the "Today" context below; the OS
 * loads this extension out-of-process, calls `makeConfiguration`, and shows
 * whatever `TodayReportView` returns.
 */
@main
struct UsageReportExtension: DeviceActivityReportExtension {
  var body: some DeviceActivityReportScene {
    TodayReport { model in
      TodayReportView(model: model)
    }
  }
}

/** One row's worth of what the view needs — the token itself for
 *  `Label(token)` to draw the real icon and name, since that's still the
 *  only channel allowed to reveal which app this is. */
struct AppUsageRow: Identifiable {
  let id: String
  let token: ApplicationToken?
  let duration: TimeInterval
  // Corrected: DeviceActivityData.ApplicationActivity genuinely does expose
  // per-app notification and pickup counts (confirmed against the SDK's own
  // interface, not assumed) — the "no API for this" claim earlier was wrong.
  let notifications: Int
  let pickups: Int
}

struct TodayReportModel {
  let total: TimeInterval
  let totalNotifications: Int
  let apps: [AppUsageRow]
}

struct TodayReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .init(rawValue: "Today")
  let content: (TodayReportModel) -> TodayReportView

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> TodayReportModel {
    // Week/Month spans come back as one segment per day, so the same app
    // shows up once per day — accumulate by token instead of appending a
    // fresh row each time, or a 7-day range would draw 7 bars for Instagram.
    var byToken: [ApplicationToken?: (duration: TimeInterval, notifications: Int, pickups: Int)] = [:]
    var total: TimeInterval = 0
    var totalNotifications = 0

    for await datum in data {
      for await segment in datum.activitySegments {
        total += segment.totalActivityDuration
        for await category in segment.categories {
          for await application in category.applications {
            totalNotifications += application.numberOfNotifications
            let token = application.application.token
            let existing = byToken[token] ?? (0, 0, 0)
            byToken[token] = (
              existing.duration + application.totalActivityDuration,
              existing.notifications + application.numberOfNotifications,
              existing.pickups + application.numberOfPickups
            )
          }
        }
      }
    }

    var rows: [AppUsageRow] = []
    for (index, entry) in byToken.enumerated() {
      rows.append(
        AppUsageRow(
          id: entry.key.map(String.init(describing:)) ?? "untokened-\(index)",
          token: entry.key,
          duration: entry.value.duration,
          notifications: entry.value.notifications,
          pickups: entry.value.pickups
        )
      )
    }
    rows.sort { $0.duration > $1.duration }
    return TodayReportModel(total: total, totalNotifications: totalNotifications, apps: rows)
  }
}

struct TodayReportView: View {
  let model: TodayReportModel

  private func formatted(_ interval: TimeInterval) -> String {
    let minutes = max(0, Int(interval) / 60)
    let h = minutes / 60
    let m = minutes % 60
    if h > 0 { return m == 0 ? "\(h)h" : "\(h)h \(m)m" }
    return "\(m)m"
  }

  /// Label(token) is Apple's opaque, privacy-preserving view — it can't be
  /// split into "just resize the icon", so the icon and name are drawn as
  /// two separate Label instances (.iconOnly boxed to a fixed frame,
  /// .titleOnly free-flowing) rather than one .titleAndIcon whose icon size
  /// silently followed the row's font size and came out inconsistent.
  private let iconSize: CGFloat = 30
  private let barMaxHeight: CGFloat = 110
  private let mint = Color(red: 0.435, green: 0.89, blue: 0.663)

  var body: some View {
    // Scrollable now, so this can afford to show more than fit on screen at
    // once rather than silently dropping everything past 6.
    // Every app used today, sorted by usage — scrollable now, so no need to
    // silently drop past a small cap.
    let top = model.apps
    let peak = max(1, top.map(\.duration).max() ?? 1)

    VStack(alignment: .leading, spacing: 18) {
      VStack(alignment: .leading, spacing: 2) {
        Text(formatted(model.total))
          .font(.system(size: 32, weight: .bold))
          .foregroundColor(.white)
        Text("Screen Time")
          .font(.system(size: 13, weight: .semibold))
          .foregroundColor(.white.opacity(0.55))
      }

      if top.isEmpty {
        Text("Nothing recorded yet today.")
          .font(.system(size: 13.5))
          .foregroundColor(.white.opacity(0.5))
      } else {
        // A bar chart, not a list of numbers — bars you can compare at a
        // glance beat a column of "11m / 8m / 5m" text.
        // No horizontal scroll: swiping a chart that sits under a headline
        // number reads as broken. Show what fits, tightly, and let the
        // "Top Offenders" list below carry the long tail.
        HStack(alignment: .bottom, spacing: 6) {
          ForEach(Array(top.prefix(6).enumerated()), id: \.offset) { _, row in
            VStack(spacing: 8) {
              Text(formatted(row.duration))
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(.white.opacity(0.65))

              ZStack(alignment: .bottom) {
                Capsule()
                  .fill(Color.white.opacity(0.08))
                  .frame(width: 12, height: barMaxHeight)
                Capsule()
                  .fill(mint)
                  .frame(
                    width: 12,
                    height: max(4, barMaxHeight * CGFloat(row.duration / peak))
                  )
              }

              if let token = row.token {
                Label(token)
                  .labelStyle(.iconOnly)
                  .frame(width: iconSize, height: iconSize)
                  .clipShape(RoundedRectangle(cornerRadius: iconSize * 0.24, style: .continuous))
              } else {
                RoundedRectangle(cornerRadius: iconSize * 0.24, style: .continuous)
                  .fill(Color.white.opacity(0.1))
                  .frame(width: iconSize, height: iconSize)
              }
            }
            .frame(maxWidth: .infinity)
          }
        }
      }

      let topOffenders = model.apps.filter { $0.notifications > 0 }.sorted { $0.notifications > $1.notifications }.prefix(3)
      if !topOffenders.isEmpty {
        VStack(alignment: .leading, spacing: 10) {
          Text("\(model.totalNotifications) notification\(model.totalNotifications == 1 ? "" : "s")")
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(.white.opacity(0.7))

          Text("TOP OFFENDERS")
            .font(.system(size: 11, weight: .bold))
            .tracking(0.6)
            .foregroundColor(.white.opacity(0.4))

          VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(topOffenders.enumerated()), id: \.offset) { index, row in
              if index > 0 {
                Divider().background(Color.white.opacity(0.08))
              }
              HStack(spacing: 10) {
                if let token = row.token {
                  Label(token)
                    .labelStyle(.iconOnly)
                    .frame(width: 26, height: 26)
                    .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                  Label(token)
                    .labelStyle(.titleOnly)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                }
                Spacer()
                Text("\(row.notifications) notification\(row.notifications == 1 ? "" : "s")")
                  .font(.system(size: 12.5, weight: .medium))
                  .foregroundColor(.white.opacity(0.55))
              }
              .padding(.vertical, 8)
            }
          }
        }
      }
    }
    .padding(16)
    .background(Color.clear)
  }
}
