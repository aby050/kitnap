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
      VStack(alignment: .leading, spacing: 0) {
        ForEach(Array(tokens.enumerated()), id: \.offset) { index, token in
          if index > 0 { Divider().background(Color.white.opacity(0.08)) }
          Label(token)
            .labelStyle(.titleAndIcon)
            .font(.system(size: 17, weight: .semibold))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 12)
        }
        ForEach(Array(categories.enumerated()), id: \.offset) { index, token in
          if index > 0 || !tokens.isEmpty { Divider().background(Color.white.opacity(0.08)) }
          Label(token)
            .labelStyle(.titleAndIcon)
            .font(.system(size: 17, weight: .semibold))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 12)
        }
      }
      .id(revision)
    } else {
      iconRow(tokens: tokens, overflow: overflow)
    }
  }

  private func iconRow(tokens: [ApplicationToken], overflow: Int) -> some View {
    HStack(spacing: iconSize * 0.18) {
      ForEach(Array(tokens.enumerated()), id: \.offset) { _, token in
        Label(token)
          .labelStyle(.iconOnly)
          .frame(width: iconSize, height: iconSize)
          .clipShape(RoundedRectangle(cornerRadius: iconSize * 0.24, style: .continuous))
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
