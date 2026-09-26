import { requireNativeView } from 'expo';
import { Platform, ViewProps } from 'react-native';

/**
 * Real "Screen Time today" numbers, drawn by iOS itself.
 *
 * Apple never hands per-app usage minutes to app code — the only sanctioned
 * channel is a SwiftUI view rendered out-of-process by a DeviceActivityReport
 * extension (targets/UsageReport). This is that view, hosted natively;
 * nothing here ever sees the actual numbers either, it just asks iOS to draw
 * them.
 *
 * Requires Apple to have approved the Family Controls entitlement for the
 * extension's own bundle id (com.abhay.phonewise.ReportExtension) — until then
 * this renders blank on-device even though it builds and installs fine.
 */
export type UsageReportProps = ViewProps & {
  /** Bump to force a fresh render (e.g. pull-to-refresh). */
  revision?: number;
  /** How far back the report reaches. Defaults to 'today'. */
  period?: 'today' | 'week' | 'month';
};

let NativeView: any = null;

if (Platform.OS === 'ios') {
  try {
    NativeView = requireNativeView('UsageReport');
  } catch {
    NativeView = null;
  }
}

export const usageReportAvailable = () => NativeView !== null;

export default NativeView as React.ComponentType<UsageReportProps> | null;
