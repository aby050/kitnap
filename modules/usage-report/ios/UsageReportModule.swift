import DeviceActivity
import ExpoModulesCore
import SwiftUI

/**
 * Hosts Apple's `DeviceActivityReport` SwiftUI view — the one channel that
 * can show real per-app usage numbers. The OS renders it by calling into the
 * UsageReport extension (targets/UsageReport) out-of-process; nothing this
 * file does ever sees the actual minutes, it only asks for the report and
 * displays whatever comes back.
 */
class UsageReportView: ExpoView {
  private var hosting: UIHostingController<AnyView>?

  /// Bumped from JS (e.g. on pull-to-refresh) to force a re-render with a
  /// freshly computed filter, since the report only reflects usage up to
  /// whenever it was last asked for.
  var revision: Int = 0 { didSet { if revision != oldValue { setNeedsReportRender() } } }

  /// "today" | "week" | "month" — how far back the filter's DateInterval
  /// reaches. DeviceActivityFilter.SegmentInterval has no .monthly case at
  /// all, but that case only controls how the OS chunks up the returned
  /// segments, not the interval's actual length — .daily(during:) over a
  /// 30-day span still returns correct 30-day totals, our extension already
  /// sums every segment it gets regardless of how many there are.
  var period: String = "today" { didSet { if period != oldValue { setNeedsReportRender() } } }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    setNeedsReportRender()
  }

  /// Every prop assignment used to re-run `render()` outright, and Expo sets
  /// each prop on every JS re-render whether or not the value moved. That
  /// meant a parent re-render re-stamped the `.id`, which makes SwiftUI throw
  /// away the DeviceActivityReport and ask the OS for a fresh out-of-process
  /// query — the flicker and the intermittent blank card. Now only a real
  /// change schedules work, and mount + both props coalesce into one query
  /// instead of three.
  private var renderScheduled = false

  private func setNeedsReportRender() {
    guard !renderScheduled else { return }
    renderScheduled = true
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      self.renderScheduled = false
      self.render()
    }
  }

  private func render() {
    guard #available(iOS 16.4, *) else { return }

    let now = Date()
    let calendar = Calendar.current
    let startOfToday = calendar.startOfDay(for: now)
    let start: Date
    switch period {
    case "week":
      start = calendar.date(byAdding: .day, value: -6, to: startOfToday) ?? startOfToday
    case "month":
      start = calendar.date(byAdding: .day, value: -29, to: startOfToday) ?? startOfToday
    default:
      start = startOfToday
    }
    // Segment size is the whole cost story. The extension has to stream
    // every segment x every category x every app, and it only ever sums
    // them — so a month asked for as 30 daily segments is ~6x the data for
    // an identical total. Ask for the coarsest segmentation that still
    // covers the span, inside a memory-capped extension process.
    let interval = DateInterval(start: start, end: now)
    let segment: DeviceActivityFilter.SegmentInterval =
      period == "month" ? .weekly(during: interval) : .daily(during: interval)
    let filter = DeviceActivityFilter(segment: segment)
    let context = DeviceActivityReport.Context(rawValue: "Today")
    let root = AnyView(
      DeviceActivityReport(context, filter: filter)
        // Identity has to include the period. DeviceActivityReport won't
        // re-query when only its filter changes under a stable id — the
        // view came back empty on Week/Month because SwiftUI reused the
        // instance built for Today.
        .id("\(revision)-\(period)")
    )

    // Update in place. Tearing the host down and rebuilding it was worse:
    // the OS reuses the hosted report scene either way and logs "Update was
    // a no-op", so the replacement view got an empty scene and drew nothing.
    // The period-bearing `.id` above is what makes SwiftUI re-run the query.
    if let hosting {
      hosting.rootView = root
      return
    }

    let controller = UIHostingController(rootView: root)
    controller.view.backgroundColor = .clear
    controller.view.frame = bounds
    controller.overrideUserInterfaceStyle = .dark
    addSubview(controller.view)
    hosting = controller
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    hosting?.view.frame = bounds
  }
}

public class UsageReportModule: Module {
  public func definition() -> ModuleDefinition {
    Name("UsageReport")

    View(UsageReportView.self) {
      Prop("revision") { (view: UsageReportView, value: Int) in
        view.revision = value
      }
      Prop("period") { (view: UsageReportView, value: String) in
        view.period = value
      }
    }
  }
}
