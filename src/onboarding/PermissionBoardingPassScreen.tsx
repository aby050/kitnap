import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Camera } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import {
  canDrawOverlays,
  isAccessibilityServiceEnabled,
  isIgnoringBatteryOptimizations,
  isNotificationListenerEnabled,
  openAccessibilitySettings,
  openBatteryOptimizationSettings,
  openNotificationListenerSettings,
  openOverlaySettings,
} from 'device-permissions';
import { checkUsageAccessPermission, openUsageAccessSettings } from '../data/androidUsage';
import {
  getScreenTimeAuthorizationStatus,
  requestScreenTimeAuthorization,
} from '../data/iosScreenTime';
import { Button } from '../design/primitives';
import { palette } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';
import { OnboardingMarkSlot } from './OnboardingMark';
import PermissionArt from './PermissionArt';

type Card = {
  key: string;
  icon: IconName;
  title: string;
  desc: string;
  granted: boolean;
  onRequest: () => void;
};

/**
 * Boarding-pass style permission ask, all up front before onboarding's
 * questions — swipe/step through each one like a ticket, same idea as the
 * reference: a card with an icon, "AUTHORIZATION REQUIRED", a plain-English
 * reason, and a single Grant action, with progress dots below the card.
 * Every toggle here reads real OS permission state — checked on mount and
 * again whenever the app regains focus, the only way to know if the user
 * granted something in Settings, since none of these fire a JS event.
 */
export default function PermissionBoardingPassScreen({
  onContinue,
  only,
}: {
  onContinue: () => void;
  /** Show just these permission keys. Asking for everything up front makes the
   *  app look like it wants the whole phone before it has done anything; each
   *  ask lands better next to the question that motivates it. */
  only?: string[];
}) {
  const [index, setIndex] = useState(0);
  const [overlay, setOverlay] = useState(false);
  const [usage, setUsage] = useState(false);
  const [accessibility, setAccessibility] = useState(false);
  const [notification, setNotification] = useState(false);
  const [battery, setBattery] = useState(false);
  const [screenTime, setScreenTime] = useState(false);
  const [camera, setCamera] = useState(false);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'ios') {
      setScreenTime(getScreenTimeAuthorizationStatus() === 'approved');
      const notif = await Notifications.getPermissionsAsync();
      setNotification(notif.granted || notif.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED);
      const cam = await Camera.getCameraPermissionsAsync();
      setCamera(cam.granted);
      return;
    }
    if (Platform.OS !== 'android') return;
    setOverlay(canDrawOverlays());
    setAccessibility(isAccessibilityServiceEnabled());
    setNotification(isNotificationListenerEnabled());
    setBattery(isIgnoringBatteryOptimizations());
    setUsage(await checkUsageAccessPermission());
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  // iOS system prompts only appear if we actually request them. Fire the
  // current card's request so Simulator/device dialogs show up instead of
  // a Grant button that used to no-op (Android settings openers).
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let cancelled = false;
    (async () => {
      if (index === 0) await requestScreenTimeAuthorization();
      else if (index === 1) await Notifications.requestPermissionsAsync();
      else if (index === 2) await Camera.requestCameraPermissionsAsync();
      if (!cancelled) await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [index, refresh]);

  const androidCards: Card[] = [
    {
      key: 'overlay',
      icon: 'shield',
      title: 'Display over apps',
      desc: 'So the app can show the shield over a distracting app instead of just closing it.',
      granted: overlay,
      onRequest: openOverlaySettings,
    },
    {
      key: 'usage',
      icon: 'chart',
      title: 'Usage access',
      desc: 'Reads your real app usage so we can tell you the truth about it instead of asking you to guess.',
      granted: usage,
      onRequest: openUsageAccessSettings,
    },
    {
      key: 'accessibility',
      icon: 'settings',
      title: 'Accessibility',
      desc: "Lets the app notice when a distracting app opens and bring you back. It never reads what's on your screen.",
      granted: accessibility,
      onRequest: openAccessibilitySettings,
    },
    {
      key: 'notification',
      icon: 'bell',
      title: 'Notification access',
      desc: 'Notices notifications from distracting apps so it can nudge you before you even open them.',
      granted: notification,
      onRequest: openNotificationListenerSettings,
    },
    {
      key: 'battery',
      icon: 'timer',
      title: 'Uninterrupted sessions',
      desc: "Stops Android's battery saver from pausing the block partway through a locked session.",
      granted: battery,
      onRequest: openBatteryOptimizationSettings,
    },
  ];

  const iosCards: Card[] = [
    {
      key: 'screenTime',
      icon: 'chart',
      title: 'Screen Time',
      desc: "Uses Apple's Screen Time controls so Byre can block the apps you pick. A system prompt appears — Allow it.",
      granted: screenTime,
      onRequest: async () => {
        await requestScreenTimeAuthorization();
        await refresh();
      },
    },
    {
      key: 'notification',
      icon: 'bell',
      title: 'Notifications',
      desc: 'Lets Byre ping you when a timed unlock ends, even if the app is in the background.',
      granted: notification,
      onRequest: async () => {
        await Notifications.requestPermissionsAsync();
        await refresh();
      },
    },
    {
      key: 'camera',
      icon: 'eye',
      title: 'Camera',
      desc: 'Used only for Strict-mode movement challenges. Nothing is recorded or leaves the phone.',
      granted: camera,
      onRequest: async () => {
        await Camera.requestCameraPermissionsAsync();
        await refresh();
      },
    },
  ];

  const all: Card[] = Platform.OS === 'ios' ? iosCards : androidCards;
  const cards: Card[] = only ? all.filter((c) => only.includes(c.key)) : all;

  // Nothing relevant on this platform — don't strand the user on a blank pass.
  useEffect(() => {
    if (cards.length === 0) onContinue();
  }, [cards.length, onContinue]);
  if (cards.length === 0) return null;

  const card = cards[index];
  const isLast = index === cards.length - 1;

  const next = () => {
    if (isLast) onContinue();
    else setIndex((i) => i + 1);
  };

  // Granting is the answer to the question this screen asks, so it moves on by
  // itself — a Continue button after a system prompt is a second confirmation
  // of something already decided. The short pause lets the card show that it
  // took before it leaves.
  useEffect(() => {
    if (!card.granted) return;
    const t = setTimeout(next, 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.key, card.granted]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <OnboardingMarkSlot />
      <View style={styles.body}>
        <Animated.View key={card.key} entering={FadeIn.duration(350)} style={styles.art}>
          <PermissionArt permission={card.key} size={224} />
        </Animated.View>

        <View style={styles.dotsRow}>
          {cards.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <Text style={styles.reqLabel}>
          {String(index + 1).padStart(2, '0')} / {String(cards.length).padStart(2, '0')} · AUTHORIZATION REQUIRED
        </Text>
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.desc}>{card.desc}</Text>
      </View>

      <View style={styles.ctaWrap}>
        {card.granted ? (
          <View style={styles.grantedRow}>
            <Icon name="check" size={16} color={palette.accent} strokeWidth={2.6} />
            <Text style={styles.grantedText}>Granted</Text>
          </View>
        ) : (
          <>
            <Button label="Grant" variant="primary" onPress={card.onRequest} />
            <Pressable onPress={next} hitSlop={10}>
              <Text style={styles.skipLink}>Skip for now</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 26, paddingTop: 8 },
  art: { alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  dotsRow: { flexDirection: 'row', gap: 5, marginTop: 22 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)' },
  dotActive: { backgroundColor: palette.accent, width: 16 },
  reqLabel: {
    color: palette.accent,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 18,
  },
  title: { color: palette.text, fontSize: 24, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  desc: {
    color: palette.textSecondary,
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 320,
  },
  ctaWrap: { paddingHorizontal: 26, paddingBottom: 18, gap: 14, alignItems: 'stretch' },
  grantedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  grantedText: { color: palette.accent, fontSize: 15.5, fontWeight: '800' },
  skipLink: { color: palette.textTertiary, fontSize: 13.5, fontWeight: '600', textAlign: 'center' },
});
