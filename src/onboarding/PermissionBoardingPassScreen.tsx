import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Camera } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import {
  canDrawOverlays,
  isAccessibilityServiceEnabled,
  isIgnoringBatteryOptimizations,
  openAccessibilitySettings,
  openBatteryOptimizationSettings,
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
import LineArt, { ArtName } from './LineArt';
const PERMISSION_ART: Record<string, ArtName> = {
  overlay: 'phoneLock', usage: 'chart', accessibility: 'shield', notification: 'clock',
  battery: 'sun', screenTime: 'chart', camera: 'camera',
};
import { CardPanel, INK, INK_DIM, InkButton, PastelCard, TextLink, TINTS } from './PastelCard';
import AccessibilityDisclosure from './AccessibilityDisclosure';
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
 * One-permission-per-card ask, stepped through before onboarding's questions:
 * an icon, a step count, a plain-English reason, and a single Grant action,
 * with progress dots below the card. Every toggle here reads real OS
 * permission state — checked on mount and again whenever the app regains
 * focus, the only way to know if the user granted something in Settings,
 * since none of these fire a JS event.
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
  const [showAccessibilityDisclosure, setShowAccessibilityDisclosure] = useState(false);
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
    setNotification((await Notifications.getPermissionsAsync()).granted);
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
      // Google requires a prominent disclosure with an affirmative action
      // before an app that isn't an accessibility tool enables one.
      onRequest: () => setShowAccessibilityDisclosure(true),
    },
    {
      key: 'notification',
      icon: 'bell',
      title: 'Notifications',
      desc: 'Lets Phonewise tell you when a timed unlock ends and keep a running session visible.',
      granted: notification,
      onRequest: async () => {
        await Notifications.requestPermissionsAsync();
        await refresh();
      },
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
      desc: "Uses Apple's Screen Time controls so Phonewise can block the apps you pick. A system prompt follows.",
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
      desc: 'Lets Phonewise ping you when a timed unlock ends, even if the app is in the background.',
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

  const advancedFor = useRef('');
  const next = () => {
    if (advancedFor.current === card.key) return;
    advancedFor.current = card.key;
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
    <PastelCard tint={TINTS.blue}>
      <View style={styles.body}>
        <Animated.View key={card.key} entering={FadeIn.duration(350)} style={styles.art}>
          <LineArt name={PERMISSION_ART[card.key] ?? 'phoneLock'} height={230} />
        </Animated.View>

        <View style={styles.dotsRow}>
          {cards.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <Text style={styles.reqLabel}>
          Step {String(index + 1).padStart(2, '0')} of {String(cards.length).padStart(2, '0')}
        </Text>
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.desc}>{card.desc}</Text>
      </View>

      <CardPanel style={styles.ctaWrap}>
        {card.granted ? (
          <View style={styles.grantedRow}>
            <Icon name="check" size={16} color={INK} strokeWidth={2.6} />
            <Text style={styles.grantedText}>Granted</Text>
          </View>
        ) : (
          <>
            {Platform.OS === 'ios' ? (
              // Apple 5.1.1(iv): the button ahead of a system permission prompt
              // must read Continue/Next and always lead to the prompt, with no
              // way to skip past it. Whatever the answer, move on afterwards.
              <InkButton
                label="Continue"
                onPress={async () => {
                  await card.onRequest();
                  next();
                }}
              />
            ) : (
              <>
                <InkButton label="Grant" onPress={card.onRequest} />
                <TextLink label="Skip for now" onPress={next} />
              </>
            )}
          </>
        )}
      </CardPanel>
      <AccessibilityDisclosure
        visible={showAccessibilityDisclosure}
        onAccept={() => {
          setShowAccessibilityDisclosure(false);
          openAccessibilitySettings();
        }}
        onCancel={() => setShowAccessibilityDisclosure(false)}
      />
    </PastelCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'stretch', justifyContent: 'flex-end', paddingHorizontal: 24, paddingVertical: 16 },
  art: { alignSelf: 'stretch', marginBottom: 10 },
  dotsRow: { flexDirection: 'row', gap: 5, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(27,27,31,0.18)' },
  dotActive: { backgroundColor: INK, width: 16 },
  reqLabel: {
    color: INK_DIM,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 18,
  },
  title: { color: INK, fontSize: 34, lineHeight: 40, fontWeight: '700', marginTop: 10, textAlign: 'left', letterSpacing: -0.6 },
  desc: {
    color: INK_DIM,
    lineHeight: 22,
    fontSize: 16,
    textAlign: 'left',
    marginTop: 10,
  },
  ctaWrap: { alignItems: 'stretch' },
  grantedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  grantedText: { color: INK, fontSize: 15.5, fontWeight: '800' },
  skipLink: { color: palette.textTertiary, fontSize: 13.5, fontWeight: '600', textAlign: 'center' },
});
