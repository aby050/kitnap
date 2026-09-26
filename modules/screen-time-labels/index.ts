import { requireNativeModule, requireNativeView } from 'expo';
import { Platform, ViewProps } from 'react-native';

/**
 * The real icons of the apps chosen in Apple's Family Activity picker.
 *
 * Apple never tells an app which apps were picked — the selection is a set of
 * opaque tokens that cannot cross into JavaScript. Only SwiftUI can draw them,
 * so this is a native view: React Native hands it a selection id, the Swift
 * side reads that selection out of the shared app group and renders the
 * genuine icons. Nothing about which apps they are is ever readable from JS,
 * which is what keeps the "Phonewise never sees the names" promise true.
 */

export type ScreenTimeLabelsProps = ViewProps & {
  /** Persisted selection id, as passed to setFamilyActivitySelectionId. */
  selectionId?: string;
  iconSize?: number;
  /** Icons beyond this collapse into a "+N" tile. */
  maxCount?: number;
  /** Bump after the picker closes to force a re-read of the app group. */
  revision?: number;
  /** 'row' = icons only, 'list' = icon + real app name per line. */
  layout?: 'row' | 'list';
};

let nativeModule: any = null;
let NativeView: any = null;

if (Platform.OS === 'ios') {
  try {
    nativeModule = requireNativeModule('ScreenTimeLabels');
    NativeView = requireNativeView('ScreenTimeLabels');
  } catch {
    // Not linked yet (a client built before this module existed) — callers
    // fall back to the count, same as on Android.
    nativeModule = null;
    NativeView = null;
  }
}

/** Whether the native view is available to render at all. */
export const screenTimeLabelsAvailable = () => NativeView !== null;

/** How many individual apps are in the saved selection. Categories are not
 *  counted: they have no icon of their own to show. */
export function selectedAppCount(selectionId: string): number {
  try {
    return nativeModule?.selectedAppCount(selectionId) ?? 0;
  } catch {
    return 0;
  }
}

export default NativeView as React.ComponentType<ScreenTimeLabelsProps> | null;
