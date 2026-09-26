import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import AnalyzingLoader from './AnalyzingLoader';
import { fonts, palette } from '../design/tokens';
import { checkUsageAccessPermission, queryDailyUsage } from '../data/androidUsage';
import { DEFAULT_BLOCKED_APPS } from '../data/blockedApps';
import { buildRecapPlan } from '../data/setupPlan';
import Icon from '../ui/Icon';

type Answer = { value: string; label: string };

type Props = {
  name: string;
  answers: Record<string, Answer>;
  onFinish: (payload: { dailyHours: number; fromUsage: boolean; suggestedPackages: string[] }) => void;
};

const ANALYZING_LINES = [
  'Reading your answers',
  'Working out your daily average',
  'Finding your biggest distractions',
  'Building your setup',
];

// Per step, and the tail after the last one. The ring in AnalyzingLoader is
// driven off the same numbers so it lands full exactly as the reveal starts.
const ANALYZING_STEP_MS = 850;
const ANALYZING_TAIL_MS = 800;

// Fallback shown only when real usage access isn't available (iOS, web, or
// the user declined the permission) — never shown alongside real numbers.
const FALLBACK_DISTRACTION_APPS = [
  { name: 'Facebook', usage: 'Usage not available', color: '#1877F2', letter: 'f' },
  { name: 'Instagram', usage: 'Usage not available', color: '#E1306C', letter: '◎' },
  { name: 'Reddit', usage: 'Usage not available', color: '#FF4500', letter: 'r' },
  { name: 'YouTube', usage: 'Usage not available', color: '#FF0000', letter: '▶' },
  { name: 'X', usage: 'Usage not available', color: '#000000', letter: '𝕏' },
];

const APP_BRAND: Record<string, { color: string; letter: string }> = {
  'com.facebook.katana': { color: '#1877F2', letter: 'f' },
  'com.instagram.android': { color: '#E1306C', letter: '◎' },
  'com.reddit.frontpage': { color: '#FF4500', letter: 'r' },
  'com.google.android.youtube': { color: '#FF0000', letter: '▶' },
  'com.twitter.android': { color: '#000000', letter: '𝕏' },
  'com.zhiliaoapp.musically': { color: '#010101', letter: 'T' },
  'com.snapchat.android': { color: '#FFFC00', letter: 'S' },
};

function formatUsage(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'Not used today';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m today` : `${m}m today`;
}


export default function PostOnboardingFlow({ name, answers, onFinish }: Props) {
  const [step, setStep] = useState(0);
  const [analyzingLine, setAnalyzingLine] = useState(0);
  const [screenTimeAccess, setScreenTimeAccess] = useState(false);
  const [removedApps, setRemovedApps] = useState<string[]>([]);
  const [notifSub, setNotifSub] = useState(0);
  const [realHours, setRealHours] = useState<number | null>(null);
  const [realApps, setRealApps] = useState<typeof FALLBACK_DISTRACTION_APPS>([]);
  const [topPackages, setTopPackages] = useState<string[]>([]);

  // Screen-time access is granted upfront now (PermissionBoardingPassScreen,
  // before onboarding even starts) — this just re-reads that real state so
  // the usage-stats effect below knows whether it can fetch real numbers.
  // Checked on mount and again on foreground, the only way to know if the
  // user changed it in Settings since it fires no JS event.
  const refreshPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    const hasUsageAccess = await checkUsageAccessPermission();
    setScreenTimeAccess(hasUsageAccess);
  }, []);

  useEffect(() => {
    refreshPermissions();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPermissions();
    });
    return () => sub.remove();
  }, [refreshPermissions]);

  // Once usage access is actually granted, replace the self-reported/mock
  // numbers with a real 7-day daily average and the user's real top apps —
  // this only ever runs once permission flips true, and only on Android.
  useEffect(() => {
    if (!screenTimeAccess) return;
    (async () => {
      const end = Date.now();
      const start = end - 7 * 24 * 60 * 60 * 1000;
      const daily = await queryDailyUsage(start, end);
      if (daily.length === 0) return;

      const totalsByPackage = new Map<string, number>();
      for (const entry of daily) {
        totalsByPackage.set(
          entry.packageName,
          (totalsByPackage.get(entry.packageName) ?? 0) + entry.totalTimeInForeground,
        );
      }
      const grandTotalMs = Array.from(totalsByPackage.values()).reduce((a, b) => a + b, 0);
      const daysSeen = new Set(daily.map((d) => new Date(d.lastTimeUsed).toDateString())).size || 1;
      setRealHours(grandTotalMs / daysSeen / 3_600_000);

      const ranked = Array.from(totalsByPackage.entries()).sort((a, b) => b[1] - a[1]);
      setTopPackages(ranked.map(([pkg]) => pkg).slice(0, 12));
      const top = ranked.slice(0, 5).map(([packageName, ms]) => {
        const known = DEFAULT_BLOCKED_APPS.find((a) => a.packageName === packageName);
        const brand = APP_BRAND[packageName] ?? { color: '#6b7280', letter: (known?.name ?? packageName).charAt(0).toUpperCase() };
        return {
          name: known?.name ?? packageName.split('.').pop() ?? packageName,
          usage: formatUsage(ms),
          color: brand.color,
          letter: brand.letter,
        };
      });
      setRealApps(top);
    })();
  }, [screenTimeAccess]);

  const plan = buildRecapPlan(answers, realHours);
  const distractionApps = realApps.length > 0 ? realApps : FALLBACK_DISTRACTION_APPS;
  const activeApps = distractionApps.filter((a) => !removedApps.includes(a.name));
  const primaryApp = activeApps[0] || distractionApps[0];
  const knownByName = new Map(DEFAULT_BLOCKED_APPS.map((a) => [a.name, a.packageName]));
  const knownPkgs = new Set(DEFAULT_BLOCKED_APPS.map((a) => a.packageName));

  const finish = () => {
    const fromList = activeApps.map((a) => knownByName.get(a.name)).filter((p): p is string => !!p);
    const fromUsage = topPackages.filter((p) => knownPkgs.has(p));
    const suggestedPackages = Array.from(new Set([...fromUsage, ...fromList])).slice(0, 8);
    onFinish({ dailyHours: plan.dailyHours, fromUsage: plan.fromUsage, suggestedPackages });
  };

  useEffect(() => {
    if (step !== 0) return;
    if (analyzingLine < ANALYZING_LINES.length - 1) {
      const t = setTimeout(() => setAnalyzingLine((v) => v + 1), ANALYZING_STEP_MS);
      return () => clearTimeout(t);
    }
    // Permissions are all asked upfront now (PermissionBoardingPassScreen,
    // before onboarding even starts) — this used to land on step 1, a
    // second permission-request screen; that step no longer exists.
    const t = setTimeout(() => setStep(2), ANALYZING_TAIL_MS);
    return () => clearTimeout(t);
  }, [step, analyzingLine]);

  // Step 4 doesn't render on iOS (see below), so stepping onto it there would
  // strand the user on a blank screen.
  const next = () => setStep((s) => (Platform.OS === 'ios' && s + 1 === 4 ? 5 : s + 1));

  /* The user's own words, lowercased to sit in the headline style. Both
   * questions are skippable, so both need a fallback that is still true of
   * everyone rather than a guess about this person. */
  const reachAnswer = (answers.pickupReason?.label || 'not really thinking').toLowerCase();
  const ratherAnswer = (() => {
    const picked = (answers.interests?.label || '').split(',').map((x) => x.trim()).filter(Boolean);
    if (picked.length === 0) return 'somewhere else';
    // Two is the most that fits the headline size without wrapping to four
    // lines; the rest are represented by the count rather than truncated
    // silently.
    if (picked.length <= 2) return picked.join(' and ').toLowerCase();
    return `${picked.slice(0, 2).join(', ').toLowerCase()} +${picked.length - 2} more`;
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        {step === 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.centerBlock}>
            <AnalyzingLoader
              lines={ANALYZING_LINES}
              active={analyzingLine}
              duration={ANALYZING_LINES.length * ANALYZING_STEP_MS + ANALYZING_TAIL_MS}
            />
          </Animated.View>
        )}

        {/* These two beats used to be the "bad news / good news" pair every
            app in this category ships: a projected N-years-of-your-life doom
            figure, then a promise to hand N years back.
            Both had to go, for two separate reasons.

            1. The projection was an extrapolation from an onboarding answer
               dressed as a fact about the user's life, and the "good news"
               number was worse — `reclaimedYears = phoneYears ×
               reductionPercent`, where reductionPercent is a figure this app
               invented and floored at 30%. That is an unsubstantiated
               efficacy claim, the same defect AUDIT.md flags as P6 on the
               paywall chart, and it contradicts the project's own rule
               against printing numbers it has not measured.
            2. It is the single most recognisable beat in every competitor's
               funnel, which is exactly the ground App Review cited in the
               4.3(a) rejection of build 6.

            What replaces them says only things that are true, and says them
            back in the user's own words: their answer about why they reach
            for the phone, and what they told us they would rather be doing.
            Nothing is projected, nothing is promised. */}
        {step === 2 && (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.reflectBlock}>
            <Text style={styles.reflectLead}>you said you reach for it when you're</Text>
            <Text style={styles.reflectAnswer}>{reachAnswer}</Text>
            <Text style={styles.reflectTail}>
              Not because you decided to. That's the moment Phonewise steps into.
            </Text>
            <View style={{ height: 28 }} />
            <GradientButton label="Continue" onPress={next} />
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.reflectBlock}>
            <Text style={styles.reflectLead}>and that you'd rather be</Text>
            <Text style={styles.reflectAnswer}>{ratherAnswer}</Text>
            <Text style={styles.reflectTail}>
              Phonewise won't promise you that time back — nobody can measure that
              honestly. It just puts a real lock between you and the app, so
              the reach costs you something.
            </Text>
            <View style={{ height: 28 }} />
            <GradientButton label="Continue" onPress={next} />
          </Animated.View>
        )}

        {/* iOS never hands a third-party app the user's per-app usage or even
            the names of the apps they pick, so this step could only ever show
            a hardcoded list there — it reads as made-up data next to the real
            Screen Time picker two screens later. Android keeps it: the usage
            numbers behind it are real. */}
        {step === 4 && Platform.OS !== 'ios' && (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.appSelectBlock}>
            <Text style={[styles.heading, { marginBottom: 20 }]}>
              {realApps.length > 0
                ? 'These are your real biggest distractions'
                : 'These apps seem to be your biggest distractions'}
            </Text>
            <View style={styles.appList}>
              {distractionApps.filter((a) => !removedApps.includes(a.name)).map((app, i) => (
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
                    <Icon name="close" size={12} color={palette.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
            <View style={{ height: 16 }} />
            <Text style={styles.appsSelectedLabel}>
              {distractionApps.length - removedApps.length} apps selected
            </Text>
            <View style={{ height: 16 }} />
            <GradientButton label="Continue" onPress={next} />
          </Animated.View>
        )}

        {step === 5 && (
          <Pressable style={styles.centerBlock} onPress={() => (notifSub < 1 ? setNotifSub(1) : next())}>
            <Animated.View key={notifSub} entering={FadeIn.duration(350)} style={{ alignItems: 'center', width: '100%' }}>
              <Text style={styles.eyebrow}>How it works</Text>
              {notifSub === 0 ? (
                <Text style={styles.heading}>You open {primaryApp.name} without deciding to.</Text>
              ) : (
                <Text style={styles.heading}>Phonewise takes the screen.</Text>
              )}
              <View style={{ height: 30 }} />
              <View style={styles.phoneStage}>
                <View style={styles.phoneGlow} pointerEvents="none" />
                <View style={styles.phoneMock}>
                  <View style={styles.phoneRim} pointerEvents="none" />
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
                        stroke={palette.accent}
                        strokeWidth={3.5}
                        strokeLinecap="round"
                      />
                      <Path
                        d="M 50,48 L 62,50 M 50,48 L 52,60"
                        fill="none"
                        stroke={palette.accent}
                        strokeWidth={3.5}
                        strokeLinecap="round"
                      />
                    </Svg>
                  </View>
                ) : (
                  /* Was a staged OS notification reading "Time to go
                   * outside". Two things wrong with it: a device frame around
                   * a mocked push is the most copied beat in this category,
                   * and Phonewise does not send a nudge you can swipe away. What
                   * the phone shows now is what the phone will actually
                   * show — the shield, full bleed, in its own voice. */
                  <View style={styles.shieldFill}>
                    <LinearGradient
                      colors={['#1B2138', '#0B0D18', '#04050B']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.shieldInner}>
                      <View style={styles.shieldLock}>
                        <Icon name="lock" size={20} color="#FFFFFF" strokeWidth={1.9} />
                      </View>
                      <Text style={styles.shieldLine}>
                        “The work you said mattered is still waiting.”
                      </Text>
                      <Text style={styles.shieldFoot}>HOLD TO EARN 3 MINUTES</Text>
                    </View>
                  </View>
                  )}
                </View>
              </View>
            </Animated.View>
            <Text style={styles.tapHint}>TAP TO CONTINUE</Text>
          </Pressable>
        )}

        {step === 6 && (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.recapBlock}>
              {/* Was "Phonewise will get you back <N> years of your life" — the
                  same invented reclaimedYears figure as the removed beats,
                  in the strongest possible mood ("will"). The setup below it
                  is real and already states itself; the headline now names
                  what was actually configured instead of promising an
                  outcome nothing here can measure. */}
              <Text style={styles.finalHeading}>
                {name ? `${name},\n` : ''}
                your setup is{' '}
                <Text style={{ color: palette.accent }}>ready</Text>
              </Text>

              <SummaryRow
                icon={
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={palette.accent} strokeWidth={2}>
                    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <Circle cx={12} cy={11} r={2} fill={palette.accent} />
                    <Path d="M12 13v3" stroke={palette.accent} strokeWidth={2} />
                  </Svg>
                }
                title={plan.extra.title}
                desc={plan.extra.desc}
              />

              {plan.sleep ? (
                <SummaryRow
                  icon={
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill={palette.accent}>
                      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </Svg>
                  }
                  title={plan.sleep.title}
                  desc={plan.sleep.desc}
                />
              ) : null}

              <SummaryRow
                icon={
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={palette.accent} strokeWidth={2}>
                    <Rect x={3} y={4} width={18} height={18} rx={2} />
                    <Path d="M16 2v4M8 2v4M3 10h18" />
                    <Circle cx={8} cy={14} r={1.2} fill={palette.accent} />
                    <Circle cx={12} cy={14} r={1.2} fill={palette.accent} />
                    <Circle cx={16} cy={14} r={1.2} fill={palette.accent} />
                    <Circle cx={8} cy={18} r={1.2} fill={palette.accent} />
                    <Circle cx={12} cy={18} r={1.2} fill={palette.accent} />
                    <Circle cx={16} cy={18} r={1.2} fill={palette.accent} />
                  </Svg>
                }
                title={`${plan.reclaimedDaysThisYear} days back this year`}
                desc={`At ${plan.reductionPercent}% less phone time, that's about ${plan.reclaimedDaysThisYear} days this year.`}
              />

              <Text style={styles.sourceNote}>{plan.sourceNote}</Text>
              <Text style={styles.fistBumpLabel}>Let's solidify it with a fist bump</Text>
              <GradientButton label="Let's Do It" onPress={finish} />
            </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

function BigNumber({ value }: { value: string }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  useEffect(() => {
    scale.value = withTiming(1, { duration: 400 });
    opacity.value = withTiming(1, { duration: 400 });
  }, [value]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return (
    <Animated.Text style={[styles.bigNumber, style]} key={value}>
      {value}
    </Animated.Text>
  );
}


function SummaryRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIconContainer}>{icon}</View>
      <View style={styles.summaryText}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={styles.summaryDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  centerBlock: { alignItems: 'center', width: '100%', justifyContent: 'center' },
  /* Left-aligned and heavy, matching the education slides and the question
     flow, rather than the centred small-caption-plus-glowing-number stack
     these two screens used to share with every other app in the category. */
  reflectBlock: { alignItems: 'stretch', width: '100%', justifyContent: 'center', paddingHorizontal: 8 },
  reflectLead: {
    color: palette.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'left',
    lineHeight: 24,
  },
  reflectAnswer: {
    color: palette.accent,
    fontFamily: fonts.extrabold,
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'left',
    lineHeight: 44,
    letterSpacing: -1.8,
    marginTop: 10,
  },
  reflectTail: {
    color: palette.textTertiary,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: 'left',
    lineHeight: 22,
    marginTop: 20,
    maxWidth: 330,
  },
  recapBlock: {
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    flexGrow: 1,
  },
  appSelectBlock: { alignItems: 'center', width: '100%' },
  heading: { color: palette.text, fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 30, maxWidth: 320 },
  headingBold: { fontWeight: '700', color: palette.text },
  smallHeading: { color: palette.textSecondary, fontSize: 17, fontWeight: '600', textAlign: 'center', lineHeight: 24, maxWidth: 300, marginBottom: 6 },
  accentInline: { color: palette.accent, fontWeight: '700' },
  bigNumber: {
    color: palette.accent,
    fontSize: 46,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 14,
    textShadowColor: 'rgba(71,107,235,0.5)',
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
  },
  eyebrow: { color: palette.textSecondary, fontSize: 12, letterSpacing: 2, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase' },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceRaised,
    borderRadius: 20,
    padding: 16,
    width: '100%',
    maxWidth: 320,
    marginBottom: 12,
  },
  permTitle: { color: palette.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  permDesc: { color: palette.textSecondary, fontSize: 12.5, lineHeight: 17 },
  appList: { width: '100%', maxWidth: 340, backgroundColor: palette.surfaceRaised, borderRadius: 22, overflow: 'hidden' },
  appRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  appRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  appIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  appIconLetter: { color: '#fff', fontWeight: '800', fontSize: 15 },
  appName: { color: palette.text, fontSize: 15, fontWeight: '600' },
  appUsage: { color: palette.textSecondary, fontSize: 12, marginTop: 2 },
  removeBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  removeIcon: { color: palette.textSecondary, fontSize: 12 },
  appsSelectedLabel: { color: palette.textSecondary, fontSize: 13 },
  /* A phone, not a rectangle. 220x280 was squat — nothing like the 19.5:9
   * the eye expects — and a flat 6pt grey border read as a wireframe rather
   * than a device. This is the right aspect, with a dark bezel carrying a
   * specular rim: one hairline of light on a black edge is the whole
   * difference between "drawn box" and "object". */
  phoneStage: { alignItems: 'center', justifyContent: 'center' },
  phoneMock: {
    width: 208,
    height: 428,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: '#242428',
    backgroundColor: '#0A0A0C',
    padding: 12,
    paddingTop: 34,
    position: 'relative',
    overflow: 'hidden',
  },
  /* Sits behind the device and is what makes it feel lit from the scene
   * rather than pasted onto it. */
  phoneGlow: {
    position: 'absolute',
    top: 18,
    left: -26,
    right: -26,
    bottom: -14,
    borderRadius: 64,
    backgroundColor: palette.accent,
    opacity: 0.13,
  },
  phoneRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 37,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  /* The Dynamic Island. The old 14pt circle was a 2017 notch camera dot,
   * which dates the whole mock on sight. */
  cameraNotch: {
    width: 62,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#000000',
    alignSelf: 'center',
    position: 'absolute',
    top: 9,
    zIndex: 3,
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
  shieldFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shieldInner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  shieldLock: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.26)',
    marginBottom: 16,
  },
  shieldLine: {
    color: '#FFFFFF',
    fontFamily: fonts.extrabold,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  shieldFoot: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginTop: 18,
  },
  notifCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 14,
    width: '100%',
  },
  notifTitle: { color: palette.text, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  notifBody: { color: palette.textSecondary, fontSize: 11.5, lineHeight: 16 },
  tapHint: { color: palette.textSecondary, fontSize: 12, letterSpacing: 2, marginTop: 40 },
  summaryRow: {
    flexDirection: 'row',
    // Top-aligned, not centred: the descriptions wrap to two lines, and
    // centring floated the icon down opposite the gap between them.
    alignItems: 'flex-start',
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
  // Nudged down so the title's cap-height sits level with the icon plate.
  summaryText: { flex: 1, marginLeft: 16, marginTop: 2 },
  summaryTitle: { color: palette.text, fontSize: 16, lineHeight: 21, fontWeight: '700', marginBottom: 4 },
  summaryDesc: { color: palette.textSecondary, fontSize: 13, lineHeight: 18 },
  finalHeading: {
    color: '#ffffff',
    fontSize: 26,
    lineHeight: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 22,
  },
  fistBumpLabel: {
    color: palette.textSecondary,
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  sourceNote: {
    color: palette.textTertiary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
    maxWidth: 300,
  },
});
