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
import BrandGlyph from '../ui/BrandGlyph';
import { SELECTION_ID } from '../data/iosScreenTime';
import { palette } from '../design/tokens';
import { CommonApp, installedCommonApps } from '../data/commonBlocked';

let DeviceActivitySelectionViewPersisted: any = null;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    DeviceActivitySelectionViewPersisted =
      require('react-native-device-activity').DeviceActivitySelectionSheetViewPersisted;
  } catch {
    DeviceActivitySelectionViewPersisted = null;
  }
}

/** How many picked apps get a row of their own before it collapses to "+N". */
const SELECTED_ROWS = 5;
/** icon (34) + 10pt padding top and bottom, matching listRow in the Swift view. */
const SELECTED_ROW_H = 54;

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
  // Suggestions, not preselection: Apple's picker returns opaque tokens and
  // can't be seeded from bundle ids, so the most we can honestly do is name
  // the usual suspects that are actually on this phone.
  const [suggestions, setSuggestions] = useState<CommonApp[]>([]);
  useEffect(() => {
    let alive = true;
    void installedCommonApps().then((apps) => {
      if (alive) setSuggestions(apps);
    });
    return () => {
      alive = false;
    };
  }, []);
  // The icons are drawn natively from the app group; SwiftUI can't see that
  // another process wrote to it, so bumping this re-reads after the picker.
  const [revision, setRevision] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  // The native list is a fixed-size host view — RN can't measure SwiftUI, so
  // the height is derived from the row count it will draw.
  const shownRows = Math.min(counts?.apps ?? 0, SELECTED_ROWS);
  const listHeight = shownRows * SELECTED_ROW_H;

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
        // Apple's picker as its own sheet, not embedded. The embedded form
        // renders but cannot be tapped — the library disables interaction on
        // the hosting view — so choosing apps here silently did nothing.
        // The sheet carries the same search field, category list and Done bar.
        <>
          <Button
            label={(counts?.apps ?? 0) > 0 ? 'Change apps' : 'Choose apps to block'}
            variant="outline"
            onPress={() => setPickerOpen(true)}
          />
          {pickerOpen && DeviceActivitySelectionViewPersisted && (
            <DeviceActivitySelectionViewPersisted
              style={styles.hiddenPicker}
              familyActivitySelectionId={SELECTION_ID}
              includeEntireCategory
              onDismissRequest={() => {
                setPickerOpen(false);
                handleSelectionChange();
              }}
              onSelectionChange={handleSelectionChange}
            />
          )}
        </>
      )}

      {(counts?.apps ?? 0) === 0 && suggestions.length > 0 && (
        <View style={styles.suggestBox}>
          <Text style={styles.suggestLabel}>Most people start with</Text>
          {/* Icons, not just names: these are what you'll be hunting for in
              Apple's list a second from now, so show them the way they look
              on the home screen rather than as words to translate. */}
          <View style={styles.suggestRow}>
            {suggestions.map((a) => (
              <View key={a.scheme} style={styles.suggestTile}>
                <BrandGlyph packageName={a.glyphId} size={46} />
                <Text style={styles.suggestTileText} numberOfLines={1}>
                  {a.name}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.suggestNote}>
            Apple's picker won't let us tick these for you — find them in the list above.
          </Text>
        </View>
      )}

      {/* "2 apps selected" tells you a number, not whether you picked the
          right things. The native view is the only thing allowed to see
          inside Apple's tokens, so it draws the real icon and real name per
          row — still without any of it crossing into JS. */}
      {ScreenTimeLabels && screenTimeLabelsAvailable() && (counts?.apps ?? 0) > 0 && (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedLabel}>Blocking</Text>
          <ScreenTimeLabels
            selectionId={SELECTION_ID}
            iconSize={34}
            maxCount={SELECTED_ROWS}
            layout="list"
            revision={revision}
            style={[styles.selectedList, { height: listHeight }]}
          />
          {(counts?.apps ?? 0) > SELECTED_ROWS && (
            <Text style={styles.selectedMore}>
              + {(counts?.apps ?? 0) - SELECTED_ROWS} more
            </Text>
          )}
        </View>
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
  suggestBox: { marginTop: 18, marginBottom: 4, alignItems: 'center' },
  suggestLabel: {
    color: palette.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  suggestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 12,
  },
  suggestTile: { width: 62, alignItems: 'center', gap: 6 },
  suggestTileText: {
    color: palette.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedCard: {
    borderRadius: 20,
    backgroundColor: palette.surfaceRaised,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  selectedLabel: {
    color: palette.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  selectedList: { alignSelf: 'stretch' },
  selectedMore: {
    color: palette.textTertiary,
    fontSize: 12.5,
    fontWeight: '600',
    paddingBottom: 8,
  },
  suggestNote: {
    color: palette.textQuaternary,
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  icons: { height: 44, alignSelf: 'center' },
  // The sheet is presented by SwiftUI from this view; the view itself is
  // never meant to be seen.
  hiddenPicker: { width: 1, height: 1, position: 'absolute', opacity: 0 },
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
