import React, { useState } from 'react';
import { NativeSyntheticEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import {
  blockSelectedApps,
  requestScreenTimeAuthorization,
  saveBlockedSelection,
  screenTimeAvailable,
} from '../data/iosScreenTime';
import { palette } from '../design/tokens';

let DeviceActivitySelectionSheetView: any = null;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    DeviceActivitySelectionSheetView = require('react-native-device-activity').DeviceActivitySelectionSheetView;
  } catch {
    DeviceActivitySelectionSheetView = null;
  }
}

type SelectionEvent = NativeSyntheticEvent<{ familyActivitySelection: string | null; applicationCount: number }>;

/** iOS equivalent of AppPickerScreen — picks real apps via Apple's own
 *  FamilyActivityPicker (a system sheet, not custom UI; Apple requires
 *  this exact picker so the selection itself stays opaque to the app).
 *  Only reachable once Screen Time authorization is granted, which itself
 *  only works once Apple has approved the Family Controls entitlement. */
export default function IOSAppPickerScreen({ onContinue }: { onContinue: () => void }) {
  const [authStatus, setAuthStatus] = useState<'idle' | 'requesting' | 'approved' | 'denied'>('idle');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [appCount, setAppCount] = useState(0);

  const requestAccess = async () => {
    setAuthStatus('requesting');
    const status = await requestScreenTimeAuthorization();
    setAuthStatus(status === 'approved' ? 'approved' : 'denied');
  };

  const handleSelectionChange = (event: SelectionEvent) => {
    const token = event.nativeEvent.familyActivitySelection;
    if (token) {
      saveBlockedSelection(token);
      blockSelectedApps();
      setAppCount(event.nativeEvent.applicationCount);
    }
    setPickerOpen(false);
  };

  if (!screenTimeAvailable()) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.body}>
          <Text style={styles.heading}>Screen Time isn't available yet</Text>
          <Text style={styles.sub}>
            This needs a real iOS build with Apple's Family Controls entitlement approved — not available in this
            preview.
          </Text>
        </View>
        <View style={styles.ctaWrap}>
          <GradientButton label="Continue" onPress={onContinue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
          Which apps do you want blocked?
        </Animated.Text>
        <Text style={styles.sub}>
          This uses Apple's own picker — Wend never sees the names of the apps you choose, only that they're
          blocked.
        </Text>

        {authStatus !== 'approved' ? (
          <Pressable style={styles.authBtn} onPress={requestAccess} disabled={authStatus === 'requesting'}>
            <Text style={styles.authBtnText}>
              {authStatus === 'requesting' ? 'Requesting…' : authStatus === 'denied' ? 'Access denied — tap to retry' : 'Allow Screen Time access'}
            </Text>
          </Pressable>
        ) : (
          <>
            <Pressable style={styles.pickBtn} onPress={() => setPickerOpen(true)}>
              <Text style={styles.pickBtnText}>{appCount > 0 ? `${appCount} apps selected — change` : 'Choose apps'}</Text>
            </Pressable>
            {pickerOpen && DeviceActivitySelectionSheetView && (
              <DeviceActivitySelectionSheetView
                style={{ width: 1, height: 1, position: 'absolute' }}
                onDismissRequest={() => setPickerOpen(false)}
                onSelectionChange={handleSelectionChange}
              />
            )}
          </>
        )}
      </View>

      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 20 },
  heading: { color: palette.text, fontSize: 24, fontWeight: '800', textAlign: 'center', lineHeight: 31 },
  sub: { color: palette.textSecondary, fontSize: 14.5, textAlign: 'center', lineHeight: 21, maxWidth: 300 },
  authBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accent,
  },
  authBtnText: { color: palette.accent, fontSize: 15.5, fontWeight: '700' },
  pickBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: palette.glass,
    borderWidth: 1,
    borderColor: palette.border,
  },
  pickBtnText: { color: palette.text, fontSize: 15.5, fontWeight: '700' },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
