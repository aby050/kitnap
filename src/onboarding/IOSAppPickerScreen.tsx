import React, { useEffect, useState } from 'react';
import { NativeSyntheticEvent, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { Button } from '../design/primitives';
import {
  getScreenTimeAuthorizationStatus,
  getSelectionCounts,
  requestScreenTimeAuthorization,
  screenTimeAvailable,
} from '../data/iosScreenTime';
import ScreenTimeLabels, { screenTimeLabelsAvailable } from 'screen-time-labels';
import { SELECTION_ID } from '../data/iosScreenTime';
import { palette } from '../design/tokens';

let DeviceActivitySelectionViewPersisted: any = null;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    DeviceActivitySelectionViewPersisted =
      require('react-native-device-activity').DeviceActivitySelectionViewPersisted;
  } catch {
    DeviceActivitySelectionViewPersisted = null;
  }
}

type SelectionEvent = NativeSyntheticEvent<{ familyActivitySelection: string | null; applicationCount: number }>;

/** iOS equivalent of AppPickerScreen — Apple's FamilyActivityPicker is a
 *  system sheet we cannot restyle. This screen is our chrome around it. */
export default function IOSAppPickerScreen({
  onContinue,
  hint,
}: {
  onContinue: () => void;
  hint?: string;
}) {
  // Screen Time is granted up front on the boarding pass, so start from the
  // real OS state — starting at 'idle' asked a second time for something the
  // user had already allowed, which is what made this screen feel like a
  // repeat of the permission flow.
  const [authStatus, setAuthStatus] = useState<'idle' | 'requesting' | 'approved' | 'denied'>(
    () => (getScreenTimeAuthorizationStatus() === 'approved' ? 'approved' : 'idle'),
  );
  // Seeded from the saved selection so returning to this screen shows what is
  // already picked instead of "0 apps selected".
  const [counts, setCounts] = useState(() => getSelectionCounts());
  // The icons are drawn natively from the app group; SwiftUI can't see that
  // another process wrote to it, so bumping this re-reads after the picker.
  const [revision, setRevision] = useState(0);

  const requestAccess = async () => {
    setAuthStatus('requesting');
    const status = await requestScreenTimeAuthorization();
    setAuthStatus(status === 'approved' ? 'approved' : 'denied');
  };

  // The persisted picker has already saved the selection by the time this
  // fires — there's nothing to write, only to re-read.
  const handleSelectionChange = () => {
    setCounts(getSelectionCounts());
    setRevision((r) => r + 1);
  };

  const body = (
    <Animated.View entering={FadeIn.duration(350)} style={styles.cluster}>
      <Text style={styles.heading}>Which apps should Byre block?</Text>
      <Text style={styles.sub}>
        {hint ??
          "This uses Apple's picker — Byre never sees the names, only that they're blocked. Choose the ones that usually steal your hours."}
      </Text>

      {authStatus !== 'approved' ? (
        <Button
          label={
            authStatus === 'requesting'
              ? 'Requesting…'
              : authStatus === 'denied'
                ? 'Access denied — tap to retry'
                : 'Allow Screen Time access'
          }
          variant="outline"
          disabled={authStatus === 'requesting'}
          onPress={requestAccess}
        />
      ) : (
        // Inline, not a sheet: Apple's picker carries its own search field and
        // category list, and hiding it behind a button meant there was no way
        // to search for an app to block.
        DeviceActivitySelectionViewPersisted && (
          <View style={styles.pickerFrame}>
            <DeviceActivitySelectionViewPersisted
              style={styles.picker}
              familyActivitySelectionId={SELECTION_ID}
              includeEntireCategory
              onSelectionChange={handleSelectionChange}
            />
          </View>
        )
      )}

      {ScreenTimeLabels && screenTimeLabelsAvailable() && (counts?.apps ?? 0) > 0 && (
        <ScreenTimeLabels
          selectionId={SELECTION_ID}
          iconSize={40}
          maxCount={6}
          revision={revision}
          style={styles.icons}
        />
      )}
      <SelectionSummary counts={counts} />
      <GradientButton label="Continue" onPress={onContinue} />
    </Animated.View>
  );

  if (!screenTimeAvailable()) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.heading}>Screen Time isn't available yet</Text>
          <Text style={styles.sub}>
            This needs a real iOS build with Apple's Family Controls entitlement — not this preview.
          </Text>
          <GradientButton label="Continue" onPress={onContinue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.center}>{body}</View>
    </SafeAreaView>
  );
}

/** Apple hands back an opaque token: the app is never told which apps were
 *  picked, so there are no names or icons to show — only how much is covered.
 *  Whole categories are counted separately because "Social" is one pick that
 *  covers dozens of apps. */
function SelectionSummary({ counts }: { counts: ReturnType<typeof getSelectionCounts> }) {
  if (!counts || counts.apps + counts.categories + counts.sites === 0) {
    return <Text style={styles.count}>Nothing selected yet</Text>;
  }
  const parts: string[] = [];
  if (counts.apps) parts.push(`${counts.apps} ${counts.apps === 1 ? 'app' : 'apps'}`);
  if (counts.categories)
    parts.push(`${counts.categories} ${counts.categories === 1 ? 'category' : 'categories'}`);
  if (counts.sites) parts.push(`${counts.sites} ${counts.sites === 1 ? 'site' : 'sites'}`);
  return (
    <View style={styles.summary}>
      <View style={styles.dot} />
      <Text style={styles.count}>{parts.join(' · ')} blocked</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  icons: { height: 44, alignSelf: 'center' },
  pickerFrame: {
    height: 380,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: palette.surfaceRaised,
  },
  picker: { flex: 1 },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent },
  container: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  cluster: { width: '100%', alignItems: 'stretch', gap: 16 },
  heading: { color: palette.text, fontSize: 24, fontWeight: '800', textAlign: 'center', lineHeight: 31 },
  sub: {
    color: palette.textSecondary,
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 21,
    alignSelf: 'center',
    maxWidth: 320,
  },
  count: {
    color: palette.textTertiary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
