import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
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
import { colors } from '../theme';

type Card = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
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
export default function PermissionBoardingPassScreen({ onContinue }: { onContinue: () => void }) {
  const [index, setIndex] = useState(0);
  const [overlay, setOverlay] = useState(false);
  const [usage, setUsage] = useState(false);
  const [accessibility, setAccessibility] = useState(false);
  const [notification, setNotification] = useState(false);
  const [battery, setBattery] = useState(false);

  const refresh = useCallback(async () => {
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

  const cards: Card[] = [
    {
      key: 'overlay',
      icon: 'layers-outline',
      title: 'Display over apps',
      desc: 'So the app can show the shield over a distracting app instead of just closing it.',
      granted: overlay,
      onRequest: openOverlaySettings,
    },
    {
      key: 'usage',
      icon: 'stats-chart-outline',
      title: 'Screen time',
      desc: 'Reads your real screen time so we can tell you the truth about it instead of asking you to guess.',
      granted: usage,
      onRequest: openUsageAccessSettings,
    },
    {
      key: 'accessibility',
      icon: 'build-outline',
      title: 'Accessibility',
      desc: "Lets the app notice when a distracting app opens and bring you back. It never reads what's on your screen.",
      granted: accessibility,
      onRequest: openAccessibilitySettings,
    },
    {
      key: 'notification',
      icon: 'notifications-outline',
      title: 'Notification access',
      desc: 'Notices notifications from distracting apps so it can nudge you before you even open them.',
      granted: notification,
      onRequest: openNotificationListenerSettings,
    },
    {
      key: 'battery',
      icon: 'battery-charging-outline',
      title: 'Uninterrupted sessions',
      desc: "Stops Android's battery saver from pausing the block partway through a locked session.",
      granted: battery,
      onRequest: openBatteryOptimizationSettings,
    },
  ];

  const card = cards[index];
  const isLast = index === cards.length - 1;

  const next = () => {
    if (isLast) onContinue();
    else setIndex((i) => i + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.View key={card.key} entering={FadeIn.duration(350)} style={styles.pass}>
          <View style={styles.passHeader}>
            <Text style={styles.passEyebrow}>BOARDING PASS</Text>
            <Text style={styles.passCount}>
              {String(index + 1).padStart(2, '0')} / {String(cards.length).padStart(2, '0')}
            </Text>
          </View>

          <View style={styles.passIconWrap}>
            <Ionicons name={card.icon} size={56} color="#1a1a1a" />
          </View>

          <Text style={styles.passTitle}>{card.title.toUpperCase()}</Text>

          <View style={styles.passDivider}>
            {Array.from({ length: 14 }).map((_, i) => (
              <View key={i} style={styles.passDividerDot} />
            ))}
          </View>

          <Text style={styles.passBrand}>wend</Text>
          <View style={styles.dotsRow}>
            {cards.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        </Animated.View>

        <Text style={styles.reqLabel}>AUTHORIZATION REQUIRED</Text>
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.desc}>{card.desc}</Text>
      </View>

      <View style={styles.ctaWrap}>
        <Pressable
          style={[styles.grantBtn, card.granted && styles.grantBtnDone]}
          onPress={() => {
            if (card.granted) next();
            else card.onRequest();
          }}
        >
          <Text style={styles.grantBtnText}>{card.granted ? 'Continue' : 'Grant'}</Text>
        </Pressable>
        {!card.granted && (
          <Pressable onPress={next} hitSlop={10}>
            <Text style={styles.skipLink}>Skip for now</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 26, paddingTop: 30 },
  pass: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#F5F1E9',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  passHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 18 },
  passEyebrow: { color: 'rgba(20,20,20,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  passCount: { color: '#E8642C', fontSize: 12, fontWeight: '800' },
  passIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: 'rgba(20,20,20,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  passTitle: { color: '#1a1a1a', fontSize: 15, fontWeight: '800', letterSpacing: 1.5, marginBottom: 20 },
  passDivider: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 14 },
  passDividerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(20,20,20,0.15)' },
  passBrand: { color: 'rgba(20,20,20,0.35)', fontSize: 14, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', gap: 5, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(20,20,20,0.15)' },
  dotActive: { backgroundColor: '#E8642C', width: 16 },
  reqLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 32,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  desc: {
    color: colors.textDim,
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 320,
  },
  ctaWrap: { paddingHorizontal: 26, paddingBottom: 18, gap: 14, alignItems: 'center' },
  grantBtn: {
    width: '100%',
    paddingVertical: 17,
    borderRadius: 28,
    backgroundColor: '#111113',
    alignItems: 'center',
  },
  grantBtnDone: { backgroundColor: colors.accent },
  grantBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  skipLink: { color: colors.textFaint, fontSize: 13.5, fontWeight: '600' },
});
