import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';
import {
  canDrawOverlays,
  isAccessibilityServiceEnabled,
  isNotificationListenerEnabled,
  openAccessibilitySettings,
  openNotificationListenerSettings,
  openOverlaySettings,
} from 'device-permissions';
import { checkUsageAccessPermission, openUsageAccessSettings } from '../data/androidUsage';

type Props = {
  name: string;
  screentimeHours: number;
  onFinish: () => void;
};

const ANALYZING_LINES = ['Analyzing your answers…', 'Understanding your habits…', 'Creating your setup…'];

const DISTRACTION_APPS = [
  { name: 'Facebook', usage: '1h 6m today', color: '#1877F2', letter: 'f' },
  { name: 'Instagram', usage: '18m today', color: '#E1306C', letter: '◎' },
  { name: 'Reddit', usage: '2m today', color: '#FF4500', letter: 'r' },
  { name: 'YouTube', usage: 'Not used today', color: '#FF0000', letter: '▶' },
  { name: 'X', usage: 'Not used today', color: '#000000', letter: '𝕏' },
];

function ContinueButton({ label = 'Continue', onPress }: { label?: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[style, { width: '100%', maxWidth: 300 }]}>
      <Pressable
        onPressIn={() => (scale.value = withTiming(0.97, { duration: 90 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 220 }))}
        onPress={onPress}
        style={styles.continueBtn}
      >
        <Text style={styles.continueText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function PostOnboardingFlow({ name, screentimeHours, onFinish }: Props) {
  const [step, setStep] = useState(0);
  const [analyzingLine, setAnalyzingLine] = useState(0);
  const [displayOverApps, setDisplayOverApps] = useState(false);
  const [screenTimeAccess, setScreenTimeAccess] = useState(false);
  const [accessibilityAccess, setAccessibilityAccess] = useState(false);
  const [notificationAccess, setNotificationAccess] = useState(false);
  const [removedApps, setRemovedApps] = useState<string[]>([]);
  const [notifSub, setNotifSub] = useState(0);

  // Each toggle reflects real OS permission state — checked on mount and
  // again whenever the app regains focus (the only way to know if the user
  // granted something in Settings, since none of these fire a JS event).
  const refreshPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    setDisplayOverApps(canDrawOverlays());
    setAccessibilityAccess(isAccessibilityServiceEnabled());
    setNotificationAccess(isNotificationListenerEnabled());
    setScreenTimeAccess(await checkUsageAccessPermission());
  }, []);

  useEffect(() => {
    refreshPermissions();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPermissions();
    });
    return () => sub.remove();
  }, [refreshPermissions]);

  const badDays = Math.round((screentimeHours * 365) / 24);
  const projectedYears = Math.max(1, Math.round((50 * screentimeHours) / 16));
  const reclaimedYears = Math.max(1, Math.round(projectedYears * 0.3));

  const activeApps = DISTRACTION_APPS.filter((a) => !removedApps.includes(a.name));
  const primaryApp = activeApps[0] || DISTRACTION_APPS[0];

  useEffect(() => {
    if (step !== 0) return;
    if (analyzingLine < ANALYZING_LINES.length - 1) {
      const t = setTimeout(() => setAnalyzingLine((v) => v + 1), 750);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep(1), 900);
    return () => clearTimeout(t);
  }, [step, analyzingLine]);

  const next = () => setStep((s) => s + 1);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        {step === 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.centerBlock}>
            <Text style={styles.heading}>{ANALYZING_LINES[analyzingLine]}</Text>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeInUp.duration(400)} exiting={FadeOutUp.duration(200)} style={styles.centerBlock}>
            <Text style={styles.heading}>
              I can help with that{name ? `, ${name}` : ''}.{'\n\n'}
              <Text style={styles.headingBold}>But to change your habits, I'm going to need your permission.</Text>
            </Text>

            <View style={{ height: 30 }} />

            <PermissionRow
              title="Display over other apps"
              desc="So the app can gently help you pause before opening distracting apps."
              value={displayOverApps}
              onChange={() => {
                if (!displayOverApps) openOverlaySettings();
              }}
            />
            <PermissionRow
              title="Screen time"
              desc="Lets the app show you your daily screen time and progress."
              value={screenTimeAccess}
              onChange={() => {
                if (!screenTimeAccess) openUsageAccessSettings();
              }}
            />
            <PermissionRow
              title="Accessibility"
              desc="Lets the app notice when a distracting app opens. It never reads what's on your screen."
              value={accessibilityAccess}
              onChange={() => {
                if (!accessibilityAccess) openAccessibilitySettings();
              }}
            />
            <PermissionRow
              title="Notification access"
              desc="Lets the app notice notifications from distracting apps, so it can nudge you before you open them."
              value={notificationAccess}
              onChange={() => {
                if (!notificationAccess) openNotificationListenerSettings();
              }}
            />

            <View style={{ height: 24 }} />
            <ContinueButton onPress={next} />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInUp.duration(400)} exiting={FadeOutUp.duration(200)} style={styles.centerBlock}>
            <Text style={styles.smallHeading}>The bad news is that you'll spend{' '}
              <Text style={styles.accentInline}>{badDays} days</Text> on your phone this year.
            </Text>
            <Text style={styles.smallHeading}>Meaning that you're on track to spend</Text>
            <BigNumber value={`${projectedYears} years`} />
            <Text style={styles.smallHeading}>of your life looking down at your phone.</Text>
            <View style={{ height: 20 }} />
            <ContinueButton onPress={next} />
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInUp.duration(400)} exiting={FadeOutUp.duration(200)} style={styles.centerBlock}>
            <Text style={styles.smallHeading}>The good news is that this app can help you get back</Text>
            <BigNumber value={`${reclaimedYears} years`} />
            <Text style={styles.smallHeading}>of your life.</Text>
            <View style={{ height: 20 }} />
            <ContinueButton onPress={next} />
          </Animated.View>
        )}

        {step === 4 && (
          <Animated.View entering={FadeInUp.duration(400)} exiting={FadeOutUp.duration(200)} style={styles.appSelectBlock}>
            <Text style={[styles.heading, { marginBottom: 20 }]}>These apps seem to be your biggest distractions</Text>
            <View style={styles.appList}>
              {DISTRACTION_APPS.filter((a) => !removedApps.includes(a.name)).map((app, i) => (
                <View key={app.name} style={[styles.appRow, i > 0 && styles.appRowBorder]}>
                  <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                    <Text style={styles.appIconLetter}>{app.letter}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appUsage}>{app.usage}</Text>
                  </View>
                  <Pressable
                    onPress={() => setRemovedApps((prev) => [...prev, app.name])}
                    style={styles.removeBtn}
                    hitSlop={8}
                  >
                    <Text style={styles.removeIcon}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <View style={{ height: 16 }} />
            <Text style={styles.appsSelectedLabel}>
              {DISTRACTION_APPS.length - removedApps.length} apps selected
            </Text>
            <View style={{ height: 16 }} />
            <ContinueButton onPress={next} />
          </Animated.View>
        )}

        {step === 5 && (
          <Pressable style={styles.centerBlock} onPress={() => (notifSub < 1 ? setNotifSub(1) : next())}>
            <Animated.View key={notifSub} entering={FadeIn.duration(350)} style={{ alignItems: 'center', width: '100%' }}>
              <Text style={styles.eyebrow}>How it works</Text>
              {notifSub === 0 ? (
                <Text style={styles.heading}>Without noticing, you open {primaryApp.name}.</Text>
              ) : (
                <Text style={styles.heading}>The app steps in — gently.</Text>
              )}
              <View style={{ height: 30 }} />
              <View style={styles.phoneMock}>
                <View style={styles.cameraNotch} />
                {notifSub === 0 ? (
                  <View style={styles.phoneContent}>
                    <View style={styles.appGrid}>
                      {Array.from({ length: 12 }).map((_, i) => {
                        if (i === 0) {
                          return (
                            <View key={i} style={styles.gridAppSquareWrapper}>
                              {primaryApp.name === 'Facebook' ? (
                                <View style={[styles.gridAppSquare, { backgroundColor: '#1877F2' }]}>
                                  <Text style={styles.facebookText}>f</Text>
                                </View>
                              ) : primaryApp.name === 'Instagram' ? (
                                <View style={[styles.gridAppSquare, { overflow: 'hidden' }]}>
                                  <LinearGradient
                                    colors={['#C13584', '#E1306C', '#F77737']}
                                    style={StyleSheet.absoluteFill}
                                  />
                                  <Text style={styles.instagramText}>◎</Text>
                                </View>
                              ) : (
                                <View style={[styles.gridAppSquare, { backgroundColor: primaryApp.color }]}>
                                  <Text style={styles.genericText}>{primaryApp.letter}</Text>
                                </View>
                              )}
                            </View>
                          );
                        }
                        return <View key={i} style={styles.gridAppCircle} />;
                      })}
                    </View>
                    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                      <Path
                        d="M 95,160 Q 90,80 50,48"
                        fill="none"
                        stroke="#7CF5B0"
                        strokeWidth={3.5}
                        strokeLinecap="round"
                      />
                      <Path
                        d="M 50,48 L 62,50 M 50,48 L 52,60"
                        fill="none"
                        stroke="#7CF5B0"
                        strokeWidth={3.5}
                        strokeLinecap="round"
                      />
                    </Svg>
                  </View>
                ) : (
                  <View style={styles.notifCard}>
                    <Text style={styles.notifTitle}>Time to go outside · now</Text>
                    <Text style={styles.notifBody}>You've already spent a while on distracting apps today.</Text>
                  </View>
                )}
              </View>
            </Animated.View>
            <Text style={styles.tapHint}>TAP TO CONTINUE</Text>
          </Pressable>
        )}

        {step === 6 && (() => {
          const targetMinutes = Math.round(screentimeHours * 0.7 * 60);
          const targetH = Math.floor(targetMinutes / 60);
          const targetM = targetMinutes % 60;
          const targetTimeStr = targetH > 0 ? `${targetH}h ${targetM}m` : `${targetM}m`;
          const reclaimedDays = Math.round(screentimeHours * 365 * 0.3 / 24);

          return (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.centerBlock}>
              <Text style={styles.finalHeading}>
                {name ? `${name},\n` : ''}
                Wend will get you back <Text style={{ color: colors.accent }}>{reclaimedYears} years</Text>{'\n'}of your life
              </Text>
              <View style={{ height: 16 }} />
              
              <SummaryRow
                icon={
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#7CF5B0" strokeWidth={2}>
                    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <Circle cx={12} cy={11} r={2} fill="#7CF5B0" />
                    <Path d="M12 13v3" stroke="#7CF5B0" strokeWidth={2} />
                  </Svg>
                }
                title="30% less screen time"
                desc={`Reduce your screen time by 30%, to ${targetTimeStr} each day`}
              />
              
              <SummaryRow
                icon={
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="#7CF5B0">
                    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </Svg>
                }
                title="30% deeper sleep"
                desc="Fall asleep faster and deeper with less screen time before bed"
              />
              
              <SummaryRow
                icon={
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#7CF5B0" strokeWidth={2}>
                    <Rect x={3} y={4} width={18} height={18} rx={2} />
                    <Path d="M16 2v4M8 2v4M3 10h18" />
                    <Circle cx={8} cy={14} r={1.2} fill="#7CF5B0" />
                    <Circle cx={12} cy={14} r={1.2} fill="#7CF5B0" />
                    <Circle cx={16} cy={14} r={1.2} fill="#7CF5B0" />
                    <Circle cx={8} cy={18} r={1.2} fill="#7CF5B0" />
                    <Circle cx={12} cy={18} r={1.2} fill="#7CF5B0" />
                    <Circle cx={16} cy={18} r={1.2} fill="#7CF5B0" />
                  </Svg>
                }
                title={`${reclaimedDays} days back this year`}
                desc={`Develop your focus plan to save up to ${reclaimedDays} days this year`}
              />

              <View style={{ height: 40 }} />
              <Text style={styles.fistBumpLabel}>Let's solidify it with a fist bump</Text>
              <ContinueButton label="👊 Let's Do It" onPress={onFinish} />
            </Animated.View>
          );
        })()}
      </View>
    </SafeAreaView>
  );
}

function BigNumber({ value }: { value: string }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 140 });
    opacity.value = withTiming(1, { duration: 400 });
  }, [value]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return (
    <Animated.Text style={[styles.bigNumber, style]} key={value}>
      {value}
    </Animated.Text>
  );
}

function PermissionRow({
  title,
  desc,
  value,
  onChange,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.permRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.permTitle}>{title}</Text>
        <Text style={styles.permDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.accent, false: 'rgba(255,255,255,0.2)' }}
        thumbColor="#fff"
      />
    </View>
  );
}

function SummaryRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIconContainer}>{icon}</View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={styles.summaryDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  centerBlock: { alignItems: 'center', width: '100%' },
  appSelectBlock: { alignItems: 'center', width: '100%' },
  heading: { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 30, maxWidth: 320 },
  headingBold: { fontWeight: '700', color: colors.text },
  smallHeading: { color: colors.textDim, fontSize: 17, fontWeight: '600', textAlign: 'center', lineHeight: 24, maxWidth: 300, marginBottom: 6 },
  accentInline: { color: colors.accent, fontWeight: '700' },
  bigNumber: {
    color: colors.accent,
    fontSize: 46,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 14,
    textShadowColor: 'rgba(124,245,176,0.5)',
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
  },
  eyebrow: { color: colors.textDim, fontSize: 12, letterSpacing: 2, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase' },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 16,
    width: '100%',
    maxWidth: 320,
    marginBottom: 12,
  },
  permTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  permDesc: { color: colors.textDim, fontSize: 12.5, lineHeight: 17 },
  appList: { width: '100%', maxWidth: 340, backgroundColor: colors.cardBg, borderRadius: 22, overflow: 'hidden' },
  appRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  appRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  appIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  appIconLetter: { color: '#fff', fontWeight: '800', fontSize: 15 },
  appName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  appUsage: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  removeBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  removeIcon: { color: colors.textDim, fontSize: 12 },
  appsSelectedLabel: { color: colors.textDim, fontSize: 13 },
  phoneMock: {
    width: 220,
    height: 280,
    borderRadius: 36,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: '#0d0d0e',
    padding: 14,
    paddingTop: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  cameraNotch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'center',
    position: 'absolute',
    top: 6,
  },
  phoneContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  appGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    columnGap: 10,
    paddingHorizontal: 6,
    marginTop: 10,
  },
  gridAppCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gridAppSquareWrapper: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridAppSquare: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebookText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 3,
  },
  instagramText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  genericText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  notifCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 14,
    width: '100%',
  },
  notifTitle: { color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  notifBody: { color: colors.textDim, fontSize: 11.5, lineHeight: 16 },
  tapHint: { color: colors.textDim, fontSize: 12, letterSpacing: 2, marginTop: 40 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    marginBottom: 20,
  },
  summaryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  summaryDesc: { color: colors.textDim, fontSize: 13, lineHeight: 18 },
  finalHeading: {
    color: '#ffffff',
    fontSize: 26,
    lineHeight: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 28,
  },
  fistBumpLabel: {
    color: colors.textDim,
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  continueBtn: { width: '100%', paddingVertical: 16, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center' },
  continueText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
