import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI

/**
 * Renders the real icons of the apps the user picked in Apple's Family
 * Activity picker.
 *
 * Family Controls hands out opaque `ApplicationToken`s: an app is never told
 * which apps were chosen, and the tokens cannot be serialised across the
 * bridge into JavaScript. The one thing Apple does allow is drawing a token —
 * `Label(token)` renders the genuine icon and name, and only the system can
 * see what's inside it. So the selection is read here, natively, from the
 * shared app group that react-native-device-activity writes to, and rendered
 * as a SwiftUI view that React Native hosts like any other.
 *
 * Reading the same storage the picker writes (rather than keeping our own
 * copy) means these icons can never drift out of sync with what is actually
 * being blocked.
 */

private let FAMILY_ACTIVITY_SELECTION_ID_KEY = "familyActivitySelectionIds"

private func appGroupDefaults() -> UserDefaults? {
  guard
    let appGroup = Bundle.main.object(
      forInfoDictionaryKey: "REACT_NATIVE_DEVICE_ACTIVITY_APP_GROUP") as? String,
    !appGroup.isEmpty
  else { return nil }
  return UserDefaults(suiteName: appGroup)
}

private func savedSelection(id: String) -> FamilyActivitySelection? {
  guard
    let defaults = appGroupDefaults(),
    let map = defaults.dictionary(forKey: FAMILY_ACTIVITY_SELECTION_ID_KEY) as? [String: String],
    let encoded = map[id],
    let data = Data(base64Encoded: encoded)
  else { return nil }
  return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
}

@available(iOS 16.0, *)
struct SelectedAppIcons: View {
  var selectionId: String
  var iconSize: CGFloat
  var maxCount: Int
  /// Bumped from JS to force a re-read after the picker closes; SwiftUI has no
  /// way to observe another process writing to the app group.
  var revision: Int

  /// "row" draws icons only; "list" draws icon + real app name per line, for
  /// the sheet that shows what a running session is holding back.
  var layout: String

  var body: some View {
    let selection = savedSelection(id: selectionId)
    let tokens = Array((selection?.applicationTokens ?? []).prefix(maxCount))
    let categories = Array((selection?.categoryTokens ?? []).prefix(maxCount))
    let overflow = (selection?.applicationTokens.count ?? 0) - tokens.count

    if layout == "list" {
      // Label(token)'s opaque .titleAndIcon draws the icon at a size it
      // derives from the font, which came out smaller than intended and
      // ignored this view's `iconSize` prop entirely. Splitting into a
      // boxed .iconOnly Label plus a free .titleOnly Label — same technique
      // as iconRow below — makes the icon size explicit and controllable.
      VStack(alignment: .leading, spacing: 0) {
        ForEach(Array(tokens.enumerated()), id: \.offset) { index, token in
          if index > 0 { Divider().background(Color.white.opacity(0.08)) }
          listRow(token: token)
        }
        ForEach(Array(categories.enumerated()), id: \.offset) { index, token in
          if index > 0 || !tokens.isEmpty { Divider().background(Color.white.opacity(0.08)) }
          listRow(token: token)
        }
      }
      .id(revision)
    } else {
      iconRow(tokens: tokens, overflow: overflow)
    }
  }

  /// Label(token)'s .iconOnly image renders at a fixed intrinsic size —
  /// wrapping it in a bigger .frame() just centers the same small image in
  /// extra empty space rather than scaling it up. scaleEffect actually
  /// enlarges the rendered content; the .clipShape keeps it from bleeding
  /// past the box once scaled.
  ///
  /// App icons and category icons don't share the same intrinsic render
  /// size (categories draw as a slightly larger colored glyph), so scaling
  /// both from one assumed size made them come out visibly different sizes
  /// on screen even with an identical target `iconSize`. Two separate
  /// baselines, calibrated per token kind, is what actually equalizes them.
  private static let nativeAppIconSize: CGFloat = 32
  private static let nativeCategoryIconSize: CGFloat = 40

  private func scaledIcon<V: View>(_ label: V, nativeSize: CGFloat) -> some View {
    label
      .labelStyle(.iconOnly)
      .frame(width: nativeSize, height: nativeSize)
      .scaleEffect(iconSize / nativeSize)
      .frame(width: iconSize, height: iconSize)
      .clipShape(RoundedRectangle(cornerRadius: iconSize * 0.24, style: .continuous))
  }

  private func scaledAppIcon<V: View>(_ label: V) -> some View {
    scaledIcon(label, nativeSize: Self.nativeAppIconSize)
  }

  private func scaledCategoryIcon<V: View>(_ label: V) -> some View {
    scaledIcon(label, nativeSize: Self.nativeCategoryIconSize)
  }

  private func listRow(token: ApplicationToken) -> some View {
    HStack(spacing: 12) {
      scaledAppIcon(Label(token))
      Label(token)
        .labelStyle(.titleOnly)
        .font(.system(size: 17, weight: .semibold))
        .foregroundColor(.white)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(.vertical, 10)
  }

  private func listRow(token: ActivityCategoryToken) -> some View {
    HStack(spacing: 12) {
      scaledCategoryIcon(Label(token))
      Label(token)
        .labelStyle(.titleOnly)
        .font(.system(size: 17, weight: .semibold))
        .foregroundColor(.white)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(.vertical, 10)
  }

  private func iconRow(tokens: [ApplicationToken], overflow: Int) -> some View {
    HStack(spacing: iconSize * 0.18) {
      ForEach(Array(tokens.enumerated()), id: \.offset) { _, token in
        scaledAppIcon(Label(token))
      }
      if overflow > 0 {
        Text("+\(overflow)")
          .font(.system(size: iconSize * 0.36, weight: .bold))
          .foregroundColor(.white.opacity(0.7))
          .frame(width: iconSize, height: iconSize)
          .background(
            RoundedRectangle(cornerRadius: iconSize * 0.24, style: .continuous)
              .fill(Color.white.opacity(0.1))
          )
      }
    }
    .id(revision)
  }
}

class ScreenTimeLabelsView: ExpoView {
  private var hosting: UIHostingController<AnyView>?

  var selectionId: String = "byre-blocklist" { didSet { render() } }
  var iconSize: CGFloat = 38 { didSet { render() } }
  var maxCount: Int = 6 { didSet { render() } }
  var layout: String = "row" { didSet { render() } }
  var revision: Int = 0 { didSet { render() } }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    render()
  }

  private func render() {
    guard #available(iOS 16.0, *) else { return }
    let root = AnyView(
      SelectedAppIcons(
        selectionId: selectionId,
        iconSize: iconSize,
        maxCount: maxCount,
        revision: revision,
        layout: layout
      )
    )

    if let hosting {
      hosting.rootView = root
      return
    }

    let controller = UIHostingController(rootView: root)
    controller.view.backgroundColor = .clear
    controller.view.frame = bounds
    // Label(token) is Apple's own opaque, privacy-preserving view — it
    // decides its own text color from the environment's colorScheme rather
    // than from .foregroundColor on the Text this file writes around it.
    // Without this, it read the system's light-mode default and rendered
    // the app name in black, invisible against this app's dark rows.
    controller.overrideUserInterfaceStyle = .dark
    addSubview(controller.view)
    hosting = controller
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    hosting?.view.frame = bounds
  }
}

public class ScreenTimeLabelsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ScreenTimeLabels")

    // Count is cheap and useful on its own — the JS side uses it to decide
    // whether to render the icon strip at all.
    Function("selectedAppCount") { (selectionId: String) -> Int in
      guard #available(iOS 16.0, *) else { return 0 }
      return savedSelection(id: selectionId)?.applicationTokens.count ?? 0
    }

    View(ScreenTimeLabelsView.self) {
      Prop("selectionId") { (view: ScreenTimeLabelsView, value: String) in
        view.selectionId = value
      }
      Prop("iconSize") { (view: ScreenTimeLabelsView, value: Double) in
        view.iconSize = CGFloat(value)
      }
      Prop("maxCount") { (view: ScreenTimeLabelsView, value: Int) in
        view.maxCount = value
      }
      Prop("revision") { (view: ScreenTimeLabelsView, value: Int) in
        view.revision = value
      }
      Prop("layout") { (view: ScreenTimeLabelsView, value: String) in
        view.layout = value
      }
    }
  }
}
